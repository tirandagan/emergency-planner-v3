"use server";

import { generateObject } from 'ai';
import { getModel } from '@/lib/openrouter';
import { z } from 'zod';
import { GeneratedKit, ScenarioType, MobilityType, Person, SupplyItem, DBProduct, ItemType, KitItem } from '@/types';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { generateEmbedding } from '@/lib/embeddings';
import { resolveMasterItem } from '@/lib/masterItemService';
import { scrapeProductUrl, ScrapedProduct } from '@/lib/scraper';

// New Product Tree Matching Logic
export const matchProducts = async (supplies: SupplyItem[], scenarioContext: string): Promise<SupplyItem[]> => {
    console.log(`[matchProducts] Matching ${supplies.length} items...`);
    
    const matchedSupplies: SupplyItem[] = [];

    for (const item of supplies) {
        try {
            // 1. Resolve Master Item (Semantic Dedup)
            const resolution = await resolveMasterItem(item.item_name, item.search_query, true); // Auto-create pending if new

            if (!resolution) {
                console.warn(`[matchProducts] Failed to resolve master item for "${item.item_name}"`);
                matchedSupplies.push(item);
                continue;
            }

            const masterId = resolution.master_item_id;

            // 2. Find Verified Specific Products linked to Master Item
            // Changed to fetch multiple items (limit 5)
            const { data: specificProducts, error: spError } = await supabaseAdmin
                .from('specific_products')
                .select('*, product_offers(*)')
                .eq('master_item_id', masterId)
                .eq('status', 'verified')
                .limit(5); // Fetch up to 5 specific products

            if (specificProducts && specificProducts.length > 0) {
                const matchedProducts: DBProduct[] = specificProducts.map(product => {
                    const offer = product.product_offers && product.product_offers.length > 0 ? product.product_offers[0] : null;
                    
                    return {
                        id: product.id,
                        name: product.name,
                        description: product.description,
                        price: offer ? offer.price : 0,
                        type: offer ? offer.type as any : 'DIRECT_SALE',
                        affiliate_link: offer ? offer.url : '#',
                        image_url: product.image_url,
                        capacity_value: product.capacity_value || 1,
                        capacity_unit: product.capacity_unit || 'count'
                    };
                });

                // Use the best match (first one) for the default calculation
                const bestMatch = matchedProducts[0];
                const capacity = bestMatch.capacity_value || 1;
                const calculatedQuantity = Math.ceil(item.quantity_needed / capacity);
                const estimatedCost = (bestMatch.price || 0) * calculatedQuantity;

                matchedSupplies.push({
                    ...item,
                    matched_products: matchedProducts, // New array field
                    matched_product: bestMatch, // Keep backward compatibility for now
                    calculated_quantity: calculatedQuantity,
                    estimated_cost: estimatedCost,
                    match_score: resolution.confidence_score
                });
            } else {
                // 3. No Specific Product Found -> Trigger Background Search
                console.log(`[matchProducts] No verified product for master "${item.item_name}". Searching...`);
                matchedSupplies.push(item);
            }

        } catch (e) {
            console.error(`[matchProducts] Error processing "${item.item_name}":`, e);
            matchedSupplies.push(item);
        }
    }

    return matchedSupplies;
};

export const generateSurvivalPlan = async (
    familySize: number,
    location: string,
    duration: number,
    scenarios: ScenarioType[],
    mobility: MobilityType,
    specialNeeds: string[],
    budgetAmount: number,
    prepTime: string,
    personnel?: Person[]
): Promise<GeneratedKit> => {
    const scenarioList = scenarios.join(', ');

    const prompt = `
    You are a world-class survivalist. Create a survival plan.

    PARAMETERS:
    - Personnel: ${familySize}
    - Location: ${location}
    - Scenarios: ${scenarioList} (MULTIPLE SCENARIOS - Plan for overlap and scenario-specific needs)
    - Duration: ${duration} days
    - Strategy: ${mobility}
    - Budget Limit: $${budgetAmount}
    - Preparation Time: ${prepTime}
    - Special Considerations: ${specialNeeds.join(', ') || 'None'}

    TASKS:
    1. GENERATE SUPPLIES (CRITICAL):
       Generate a JSON array called "supplies". Analyze the 'Special Considerations' list carefully (females, infants, elderly, medical).
       For each item, you must provide:
       - "item_name": Display name (e.g., "Water Filter").
       - "search_query": A long, descriptive string optimized for semantic vector matching. Describe the item's attributes, not just the name. (e.g., "Portable water filtration pump 0.02 micron virus removal for nuclear fallout").
       - "unit_type": MUST be exactly one of: ["count", "gallons", "calories", "liters", "pairs", "sets"].
       - "quantity_needed": A number (integer or float). Calculate this based on Personnel * Duration. (e.g., if 4 people need 2000 calories for 30 days, output 240000).
       - "urgency": "High", "Medium", or "Low".

    2. SIMULATION LOG: Write a gritty, realistic 3-step log (Day 1, Day 2, Day 3) of how this scenario unfolds in this specific location and how the gear saves them.

    3. SKILLS: List 3-5 critical skills they need to learn (not buy) to survive this specific scenario.

    4. YOUTUBE: Provide 3-5 specific YouTube search queries to learn the required skills (e.g. "How to start a fire with a bow drill").

    5. ROUTES: Provide at least 3-4 evacuation routes. MANDATORY: You must provide exactly 2 routes with type "vehicle" and 1-2 routes with type "foot". Include waypoints (Lat/Long) and a description. For the 'type' field, use exactly "vehicle" for driving routes or "foot" for walking routes. IMPORTANT: For 'dangerLevel', use ONLY one of these exact values: "High", "Medium", or "Low". Put any detailed risk commentary in the separate 'riskAssessment' field.

    OUTPUT FORMAT:
    Ensure the output is valid JSON with the following structure:
    {
      "supplies": [...],
      "simulation_log": [...], // Array of strings
      "skills": [...],
      "youtube_queries": [...],
      "routes": [...]
    }
  `;

    // Define Zod schema for survival plan response
    const survivalPlanSchema = z.object({
        supplies: z.array(z.object({
            item_name: z.string(),
            search_query: z.string(),
            unit_type: z.enum(["count", "gallons", "calories", "liters", "pairs", "sets"]),
            quantity_needed: z.number(),
            urgency: z.enum(["High", "Medium", "Low"])
        })),
        simulation_log: z.array(z.string()),
        skills: z.array(z.string()),
        youtube_queries: z.array(z.string()),
        routes: z.array(z.object({
            id: z.string(),
            name: z.string(),
            description: z.string(),
            type: z.enum(["vehicle", "foot"]),
            dangerLevel: z.enum(["High", "Medium", "Low"]),
            riskAssessment: z.string(),
            waypoints: z.array(z.object({
                lat: z.number(),
                lng: z.number(),
                name: z.string()
            }))
        }))
    });

    console.log("Calling OpenRouter (Claude Sonnet 3.5) for survival plan...");
    const startTime = Date.now();

    const { object: parsedRaw } = await generateObject({
        model: getModel('SONNET'),
        prompt,
        schema: survivalPlanSchema
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`OpenRouter API call completed in ${elapsed}s`);

    // 1. Match Products (Using new Product Tree Logic)
    const supplies = parsedRaw.supplies || [];
    const matchedSupplies = await matchProducts(supplies, scenarioList);

    // 2. Map to KitItem for UI compatibility
    const items: KitItem[] = matchedSupplies.map((supply: SupplyItem, index: number) => {
        const isMatched = !!supply.matched_product;
        const product = supply.matched_product;

        return {
            id: `item-${index}`,
            name: isMatched ? product!.name : supply.item_name,
            category: isMatched && product?.name ? "Equipment" : "General",
            description: isMatched ? product!.description : supply.search_query,
            priority: supply.urgency,
            estimatedCost: isMatched ? (supply.estimated_cost || 0) : 0,
            type: isMatched ? product!.type as ItemType : ItemType.DIRECT_SALE,
            link: isMatched ? product!.affiliate_link : `https://www.google.com/search?q=${encodeURIComponent(supply.item_name + ' buy')}`,
            owned: false,
            applicableScenarios: scenarios,
            supplyIndex: index
        };
    });

    // 3. Construct Result
    const result: GeneratedKit = {
        scenarios: scenarios,
        summary: `Survival plan for ${duration} days in ${location}.`,
        readinessScore: 0,
        simulationLog: parsedRaw.simulation_log,
        requiredSkills: parsedRaw.skills,
        rationPlan: `See supplies list for food/water requirements.`,
        youtubeQueries: parsedRaw.youtube_queries,
        evacuationRoutes: parsedRaw.routes,
        items: items,
        supplies: matchedSupplies,
        personnel: personnel,
        preparationTime: prepTime
    };

    console.log(`Response processed: ${items.length} items, ${result.evacuationRoutes?.length || 0} routes`);
    return result;
};


export const assessInventory = async (items: string[], scenario: string): Promise<{ score: number, advice: string }> => {
    const prompt = `
    Analyze this inventory list: ${items.join(', ')}.
    Scenario: ${scenario}.
    Give a readiness score (0-100) and a one sentence advice on what is critically missing.
  `;

    // Define Zod schema for inventory assessment response
    const inventoryAssessmentSchema = z.object({
        score: z.number(),
        advice: z.string()
    });

    try {
        const { object } = await generateObject({
            model: getModel('HAIKU'),
            prompt,
            schema: inventoryAssessmentSchema
        });

        return object;
    } catch (e) {
        console.error("[assessInventory] Error:", e);
        return { score: 0, advice: "Could not connect to analysis grid." };
    }
}

// Mission Report types
export interface MissionReportInput {
    title: string;
    location: string;
    scenarios: string[];
    familySize: number;
    durationDays: number;
    mobilityType: string;
    budgetAmount: number;
    reportData: GeneratedKit;
}

export interface SavedMissionReport {
    id: string;
    user_id: string;
    title: string;
    location: string;
    scenarios: string[];
    family_size: number;
    duration_days: number;
    mobility_type: string;
    budget_amount: number;
    report_data: GeneratedKit;
    created_at: string;
    updated_at: string;
}

export const saveMissionReport = async (userId: string, report: MissionReportInput): Promise<SavedMissionReport> => {
    const { data, error } = await supabaseAdmin
        .from('mission_reports')
        .insert([
            {
                user_id: userId,
                title: report.title,
                location: report.location,
                scenarios: report.scenarios,
                family_size: report.familySize,
                duration_days: report.durationDays,
                mobility_type: report.mobilityType,
                budget_amount: report.budgetAmount,
                report_data: report.reportData
            }
        ])
        .select()
        .single();

    if (error) {
        console.error('Error saving mission report:', error);
        throw new Error('Failed to save mission report');
    }

    // Log plan creation activity
    try {
        // Using the logUserActivity function from profile actions
        // This is a server action, so we can import it directly
        const { logUserActivity } = await import('@/actions/profile');
        await logUserActivity(userId, 'plan_created', { planId: data.id, title: report.title });
    } catch (activityError) {
        // Non-critical error, just log it
        console.warn('Failed to log plan creation activity:', activityError);
    }

    return data as SavedMissionReport;
};

export const getMissionReports = async (userId: string): Promise<SavedMissionReport[]> => {
    const { data, error } = await supabaseAdmin
        .from('mission_reports')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching mission reports:', error);
        return [];
    }
    return (data || []) as SavedMissionReport[];
};

export const getMissionReport = async (id: string, userId: string): Promise<SavedMissionReport | null> => {
    const { data, error } = await supabaseAdmin
        .from('mission_reports')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

    if (error) {
        console.error('Error fetching mission report:', error);
        return null;
    }

    const savedReport = data as SavedMissionReport;

    // RE-MATCHING LOGIC (Server-Side Refresh)
    // We check if we have 'supplies' (raw needs). If so, we re-run matchProducts
    // to ensure we get the latest Specific Products and Prices from the DB.
    // This fixes the issue where old reports show stale "Generic" items.
    
    if (savedReport.report_data && savedReport.report_data.supplies) {
        try {
            console.log(`[getMissionReport] Refreshing matches for report ${id}...`);
            const scenarios = savedReport.scenarios || savedReport.report_data.scenarios || [];
            const scenarioContext = scenarios.join(', ');
            
            // Re-run matching
            const matchedSupplies = await matchProducts(savedReport.report_data.supplies, scenarioContext);
            
            // Re-map items
            const updatedItems: KitItem[] = matchedSupplies.map((supply: SupplyItem, index: number) => {
                const isMatched = !!supply.matched_product;
                const product = supply.matched_product;
                
                return {
                    id: `item-${index}`,
                    name: isMatched ? product!.name : supply.item_name,
                    category: isMatched && product?.name ? "Equipment" : "General",
                    description: isMatched ? product!.description : supply.search_query,
                    priority: supply.urgency,
                    estimatedCost: isMatched ? (supply.estimated_cost || 0) : 0,
                    type: isMatched ? product!.type as ItemType : ItemType.DIRECT_SALE,
                    link: isMatched ? product!.affiliate_link : `https://www.google.com/search?q=${encodeURIComponent(supply.item_name + ' buy')}`,
                    owned: false, // Resetting owned status is a downside here. Ideally we preserve it.
                    // To preserve 'owned', we would need to merge with the old 'items' list.
                    // Let's try to preserve 'owned' if ID matches or index matches.
                    applicableScenarios: scenarios,
                    supplyIndex: index
                };
            });

            // Merge 'owned' status from old items if possible
            if (savedReport.report_data.items) {
                updatedItems.forEach((newItem, i) => {
                    const oldItem = savedReport.report_data.items[i];
                    if (oldItem && oldItem.supplyIndex === newItem.supplyIndex) {
                        newItem.owned = oldItem.owned;
                    }
                });
            }

            // Update the report data in memory (not saving back to DB to avoid write on read, unless desired)
            savedReport.report_data.supplies = matchedSupplies;
            savedReport.report_data.items = updatedItems;
            
        } catch (e) {
            console.error("[getMissionReport] Failed to refresh products:", e);
            // Fallback to existing data
        }
    }

    return savedReport;
};

export const deleteMissionReport = async (id: string, userId: string): Promise<boolean> => {
    const { error } = await supabaseAdmin
        .from('mission_reports')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

    if (error) {
        console.error('Error deleting mission report:', error);
        throw new Error('Failed to delete mission report');
    }
    return true;
};

export const updateMissionReportTitle = async (
    id: string,
    userId: string,
    title: string
): Promise<boolean> => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle || trimmedTitle.length > 100) {
        throw new Error('Title must be between 1 and 100 characters');
    }

    const { error } = await supabaseAdmin
        .from('mission_reports')
        .update({ title: trimmedTitle, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId);

    if (error) {
        console.error('Error updating mission report title:', error);
        throw new Error('Failed to update mission report title');
    }
    return true;
};

// Legacy functions - kept for backward compatibility
export const saveScenario = async (userId: string, kit: GeneratedKit, location: string, type: string) => {
    // Redirect to new function
    return saveMissionReport(userId, {
        title: `${type} - ${location}`,
        location,
        scenarios: kit.scenarios || [type],
        familySize: 4,
        durationDays: 7,
        mobilityType: 'Bug Out (Vehicle)',
        budgetAmount: 2000,
        reportData: kit
    });
};

export const getSavedScenarios = async (userId: string) => {
    return getMissionReports(userId);
};

export const deleteScenario = async (id: string, userId: string) => {
    return deleteMissionReport(id, userId);
};

// New function to enrich the plan with resources
export const enrichSurvivalPlanWithResources = async (plan: GeneratedKit): Promise<GeneratedKit> => {
    console.log("[enrichSurvivalPlanWithResources] Starting resource enrichment for", plan.requiredSkills.length, "skills");
    
    const skills = plan.requiredSkills || [];
    const scenarios = plan.scenarios || [];
    
    // Fetch resources for all skills in parallel
    const resourcePromises = skills.map(skill => fetchSkillResources(skill, scenarios));
    const allResources = await Promise.all(resourcePromises);
    
    const skillResources = skills.map((skill, index) => ({
        skill,
        ...allResources[index]
    }));
    
    return {
        ...plan,
        skillResources
    };
};

// Fetch skill resources (YouTube videos, articles, PDFs)
export const fetchSkillResources = async (
    skill: string,
    scenarios: string[]
): Promise<{ videos: any[]; videoReasoning?: string; articles: any[]; pdfs: any[] }> => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_SERVICES_API_KEY;
    const searchCxId = process.env.GOOGLE_CUSTOM_SEARCH_CX;

    console.log(`[fetchSkillResources] fetching for skill: "${skill}"`);

    if (!apiKey) {
        console.error("Google Services API key not configured");
        return { videos: [], articles: [], pdfs: [] };
    }

    // Helper to fetch from YouTube
    const searchYouTube = async (query: string) => {
        try {
            const res = await fetch(
                `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=20&key=${apiKey}`,
                {
                    headers: {
                        'Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
                    }
                }
            );
            
            if (!res.ok) {
                console.error(`[YouTube API Error] ${res.status} ${res.statusText}`);
                try {
                    const errorBody = await res.text();
                    console.error(`[YouTube API Error Body]`, errorBody);
                } catch (e) { /* ignore */ }
                return [];
            }
            
            const data = await res.json();
            return (data.items || []).map((item: any) => ({
                id: item.id.videoId,
                title: item.snippet.title,
                description: item.snippet.description,
                channel: item.snippet.channelTitle,
                thumbnailUrl: item.snippet.thumbnails.medium.url, // Default to medium
                videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`
            }));
        } catch (e) {
            console.error(`[YouTube Fetch Error]`, e);
            return [];
        }
    };

    // Helper to filter videos using LLM
    const filterVideosWithLLM = async (videos: any[], skill: string, scenarios: string[]): Promise<{ selectedVideos: any[], reasoning?: string }> => {
        if (videos.length === 0) return { selectedVideos: [] };

        const videoListText = videos.map((v, i) =>
            `ID: ${v.id}\nTitle: ${v.title}\nChannel: ${v.channel}\nDescription: ${v.description}\n---`
        ).join('\n');

        const prompt = `
        You are an expert survival instructor curating the best educational content.

        Task: Select the top 3 most valuable YouTube videos from the list below for learning the skill: "${skill}".
        Context: The user is preparing for these disaster scenarios: ${scenarios.join(', ')}.

        CRITERIA:
        1. MUST be an instructional "How-to" or tutorial video.
        2. STRICTLY EXCLUDE: News reports, "caught on camera" footage, reaction videos, vlogs without substance, or generic "top 10" lists unless highly educational.
        3. FOCUS: Practical, actionable skills (e.g., "How to fix a flat tire" vs "Coin acceptor repair").
        4. RELEVANCE: Must be directly related to "${skill}" in a survival context.
        5. Video should have the word "Disaster" in the title

        Videos to Evaluate:
        ${videoListText}

        Return a JSON object with:
        - "selectedIds": Array of video IDs for the top 3 videos.
        - "reasoning": Brief explanation of why these were chosen.
        `;

        // Define Zod schema for video filtering response
        const videoFilterSchema = z.object({
            selectedIds: z.array(z.string()),
            reasoning: z.string()
        });

        try {
            const { object: result } = await generateObject({
                model: getModel('HAIKU'),
                prompt,
                schema: videoFilterSchema
            });

            // Filter the original list based on returned IDs, preserving order of AI selection if possible
            const selectedVideos = result.selectedIds
                .map((id: string) => videos.find((v: any) => v.id === id))
                .filter((v: any) => v !== undefined);

            if (selectedVideos.length > 0) {
                console.log(`[LLM Filter] Selected ${selectedVideos.length} videos. Reasoning: ${result.reasoning}`);
                return { selectedVideos, reasoning: result.reasoning };
            }
        } catch (e) {
            console.error("[LLM Filter] Failed to filter videos:", e);
        }

        // Fallback: return original list (or empty to trigger manual fallback logic)
        return { selectedVideos: [] };
    };

    // Helper to filter text resources (Articles/PDFs) using LLM
    const filterTextResourcesWithLLM = async (resources: any[], skill: string, scenarios: string[], type: 'ARTICLE' | 'PDF'): Promise<any[]> => {
        if (resources.length === 0) return [];

        const resourceListText = resources.map((r, i) =>
            `ID: ${i}\nTitle: ${r.title}\nSource: ${r.source}\nSnippet: ${r.snippet}\n---`
        ).join('\n');

        const prompt = `
        You are an expert survival instructor curating the best reading materials.

        Task: Select the top 3 most valuable ${type === 'PDF' ? 'PDF manuals/documents' : 'articles'} from the list below for learning the skill: "${skill}".
        Context: The user is preparing for these disaster scenarios: ${scenarios.join(', ')}.

        CRITERIA:
        1. MUST be an instructional guide, manual, or educational resource.
        2. STRICTLY EXCLUDE: Employee handbooks, government bureaucratic forms, meeting minutes, procurement documents, corporate policies, or irrelevant news.
        3. FOCUS: Practical, actionable knowledge (e.g. "Field Manual for Urban Evasion" vs "Department of Labor Employee Policy").
        4. RELEVANCE: Must be directly related to "${skill}" in a survival context.

        Resources to Evaluate:
        ${resourceListText}

        Return a JSON object with:
        - "selectedIndices": Array of integer IDs (from the list above) for the top 3 resources.
        `;

        // Define Zod schema for text resource filtering response
        const textResourceFilterSchema = z.object({
            selectedIndices: z.array(z.number())
        });

        try {
            const { object: result } = await generateObject({
                model: getModel('HAIKU'),
                prompt,
                schema: textResourceFilterSchema
            });

            return result.selectedIndices
                .map((index: number) => resources[index])
                .filter((r: any) => r !== undefined);
        } catch (e) {
            console.error(`[LLM Filter ${type}] Failed to filter resources:`, e);
        }

        // Fallback: return first 3
        return resources.slice(0, 3);
    };

    // Helper to clean skill name
    const cleanSkillName = (rawSkill: string) => {
        return rawSkill.replace(/\s*\(.*?\)\s*/g, '').trim();
    };

    const coreSkill = cleanSkillName(skill);
    
    // Helper to check relevance
    const isRelevant = (title: string, term: string) => {
        const titleLower = title.toLowerCase();
        const termLower = term.toLowerCase();
        
        // Blacklist negative terms often associated with news/footage
        const negativeTerms = ['destroyed', 'crushed', 'news', 'footage', 'attack', 'war', 'battle', 'killed', 'died', 'caught on camera'];
        if (negativeTerms.some(neg => titleLower.includes(neg))) return false;

        const termWords = termLower.split(' ').filter(w => w.length > 3);
        
        // If only 1 significant word (e.g. "Vehicle"), require stricter matching or instructional keywords
        if (termWords.length === 1) {
            const instructionalKeywords = ['how', 'guide', 'tutorial', 'maintenance', 'repair', 'fix', 'service', 'tips', 'basics', '101'];
            return termWords.some(word => titleLower.includes(word)) && 
                   instructionalKeywords.some(k => titleLower.includes(k));
        }

        // Otherwise, require at least one significant word match
        return termWords.some(word => titleLower.includes(word));
    };

    // Qualify search terms with scenario context
    const uniqueKeywords = new Set<string>();
    
    // Special handling: technical skills should rely less on scenario context to avoid irrelevant news
    // (e.g. "Vehicle Maintenance" + "Civil Unrest" -> Riots destroying cars)
    const isTechnicalSkill = /maintenance|repair|mechanic|medical|first aid|cooking|building|construction/i.test(coreSkill);
    
    if (!isTechnicalSkill) {
        scenarios.forEach(s => {
            if (s.toLowerCase().includes('emp')) uniqueKeywords.add('EMP');
            if (s.toLowerCase().includes('pandemic')) uniqueKeywords.add('pandemic');
            if (s.toLowerCase().includes('civil')) uniqueKeywords.add('civil unrest');
            if (s.toLowerCase().includes('nuclear')) uniqueKeywords.add('nuclear fallout');
            if (s.toLowerCase().includes('disaster')) uniqueKeywords.add('disaster');
        });
    } else {
        // For technical skills, be very selective with context
        if (scenarios.some(s => s.toLowerCase().includes('emp'))) uniqueKeywords.add('EMP'); // EMP is relevant for electronics/repair
    }
    
    // If no specific keywords, add 'survival'
    if (uniqueKeywords.size === 0) uniqueKeywords.add('survival');
    
    const scenarioContext = Array.from(uniqueKeywords).join(' ');

    // 1. Try specific query
    // Add negative keywords to the search query itself
    let qualifiedQuery = `${coreSkill} ${scenarioContext} tutorial -news -footage -destroyed -crushed`;
    let videos = await searchYouTube(qualifiedQuery);
    let relevantVideos: any[] = [];
    let videoReasoning: string | undefined;

    // Use LLM to filter if we have videos
    if (videos.length > 0) {
        const result = await filterVideosWithLLM(videos, coreSkill, scenarios);
        relevantVideos = result.selectedVideos;
        videoReasoning = result.reasoning;
    }
    
    // Fallback to manual filter if LLM fails
    if (relevantVideos.length === 0 && videos.length > 0) {
         console.log("[fetchSkillResources] LLM returned no videos, using manual filter fallback.");
         relevantVideos = videos.filter((v: any) => isRelevant(v.title, coreSkill));
    }

    // 2. If no relevant videos, try generic query: "How to" + Core Skill
    if (relevantVideos.length === 0) {
        console.log(`[fetchSkillResources] No relevant videos found for specific query: "${qualifiedQuery}". Retrying with generic query.`);
        qualifiedQuery = `how to ${coreSkill} survival -news -footage`;
        videos = await searchYouTube(qualifiedQuery);
        
        if (videos.length > 0) {
             const result = await filterVideosWithLLM(videos, coreSkill, scenarios);
             relevantVideos = result.selectedVideos;
             videoReasoning = result.reasoning;
             
             if (relevantVideos.length === 0) {
                 relevantVideos = videos.filter((v: any) => isRelevant(v.title, coreSkill));
             }
        }
    }

    // 3. Final fallback: Just the core skill + "guide"
    if (relevantVideos.length === 0) {
        console.log(`[fetchSkillResources] Still no relevant videos. Trying final fallback.`);
        qualifiedQuery = `${coreSkill} guide -news`;
        videos = await searchYouTube(qualifiedQuery);
        relevantVideos = videos; // Accept whatever we get at this point
    }

    // Use relevant videos (up to 3)
    videos = relevantVideos.slice(0, 3);

    let articles: any[] = [];
    let pdfs: any[] = [];

    if (searchCxId) {
        try {
            const fetchCustomSearch = async (query: string, extraParams: string = '') => {
                // Fetch more results (10) to give the LLM a good pool to filter from
                const res = await fetch(
                    `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&cx=${searchCxId}&key=${apiKey}&num=10${extraParams}`,
                    {
                        headers: {
                            'Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
                        }
                    }
                );
                if (!res.ok) {
                     console.warn(`[Custom Search Error] ${res.status}`);
                     return [];
                }
                const data = await res.json();
                return (data.items || []).map((item: any) => ({
                    title: item.title,
                    source: new URL(item.link).hostname.replace('www.', ''),
                    url: item.link,
                    snippet: item.snippet
                }));
            };

            // Fetch broader pool of candidates
            const rawArticles = await fetchCustomSearch(qualifiedQuery + ' guide survival');
            const rawPdfs = await fetchCustomSearch(qualifiedQuery + ' manual survival', '&fileType=pdf');

            // Filter with LLM
            if (rawArticles.length > 0) {
                articles = await filterTextResourcesWithLLM(rawArticles, coreSkill, scenarios, 'ARTICLE');
            }
            
            if (rawPdfs.length > 0) {
                pdfs = await filterTextResourcesWithLLM(rawPdfs, coreSkill, scenarios, 'PDF');
            }

        } catch (e) {
            console.error("Error fetching custom search resources:", e);
        }
    }

    console.log(`[fetchSkillResources] Found ${videos.length} videos, ${articles.length} articles, ${pdfs.length} pdfs`);
    return { videos, videoReasoning, articles, pdfs };
};
