"use client";

import React, { useState, useEffect } from 'react';
import { BookOpen, Youtube, FileText, File, ChevronDown, ChevronUp, Loader2, ExternalLink, Sparkles } from 'lucide-react';
import { fetchSkillResources } from '@/app/actions';
import type { YouTubeVideo, Article, PDFDocument, SkillResource } from '@/types';

interface CriticalSkillsProps {
    skills: string[];
    scenarios: string[];
    skillResources?: SkillResource[];
}

interface SkillResourcesState {
    skill: string;
    videos: YouTubeVideo[];
    videoReasoning?: string;
    articles: Article[];
    pdfs: PDFDocument[];
    loading: boolean;
    error?: string;
}

const VideoCard: React.FC<{ video: YouTubeVideo }> = ({ video }) => {
    const [isPlaying, setIsPlaying] = useState(false);

    if (isPlaying) {
        return (
            <div className="bg-gray-900/50 rounded-lg overflow-hidden border border-gray-700">
                <div className="relative aspect-video bg-gray-900">
                    <iframe
                        src={`https://www.youtube.com/embed/${video.id}?autoplay=1`}
                        title={video.title}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
                <div className="p-3 flex justify-between items-start gap-3">
                     <div className="flex-1">
                        <p className="text-sm text-white font-medium line-clamp-2 mb-1">{video.title}</p>
                        <p className="text-xs text-gray-500">{video.channel}</p>
                    </div>
                    <a 
                        href={video.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300 whitespace-nowrap flex items-center gap-1"
                    >
                        <ExternalLink className="w-3 h-3" />
                        YouTube
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-900/50 rounded-lg overflow-hidden border border-gray-700 hover:border-red-500/50 transition-colors group">
            <div 
                className="relative aspect-video bg-gray-900 cursor-pointer"
                onClick={() => setIsPlaying(true)}
            >
                <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Youtube className="w-12 h-12 text-red-500" />
                </div>
            </div>
            <div className="p-3 flex justify-between items-start gap-3">
                <div className="flex-1 cursor-pointer" onClick={() => setIsPlaying(true)}>
                    <p className="text-sm text-white font-medium line-clamp-2 mb-1">
                        {video.title}
                    </p>
                    <p className="text-xs text-gray-500">{video.channel}</p>
                </div>
                <a 
                    href={video.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-500 hover:text-white whitespace-nowrap flex items-center gap-1"
                    title="Watch on YouTube"
                >
                    <ExternalLink className="w-3 h-3" />
                </a>
            </div>
        </div>
    );
};

const CriticalSkills: React.FC<CriticalSkillsProps> = ({ skills, scenarios, skillResources: preloadedResources }) => {
    const [expandedSkills, setExpandedSkills] = useState<Set<number>>(new Set([0])); // First skill expanded by default
    const [skillResources, setSkillResources] = useState<SkillResourcesState[]>([]);

    useEffect(() => {
        // Initialize skill resources array
        // If preloadedResources are provided, use them.
        setSkillResources(skills.map((skill, index) => {
            const preloaded = preloadedResources ? preloadedResources[index] : null;
            
            if (preloaded && preloaded.skill === skill) {
                return {
                    skill,
                    videos: preloaded.videos || [],
                    videoReasoning: (preloaded as any).videoReasoning,
                    articles: preloaded.articles || [],
                    pdfs: preloaded.pdfs || [],
                    loading: false
                };
            }

            return {
                skill,
                videos: [],
                articles: [],
                pdfs: [],
                loading: false
            };
        }));
    }, [skills, preloadedResources]);

    // Load initial resources for the default expanded skill (index 0) ONLY if not preloaded
    useEffect(() => {
        if (skills.length > 0 && skillResources.length > 0) {
             // Only try to load if we have initialized resources and they are empty/not loading AND not preloaded
            const firstResource = skillResources[0];
            const hasPreloaded = preloadedResources && preloadedResources.length > 0;
            
            if (!hasPreloaded && expandedSkills.has(0) && firstResource && !firstResource.loading && firstResource.videos.length === 0 && !firstResource.error) {
                // Use a small timeout to ensure we don't conflict with initial render
                setTimeout(() => loadResources(0), 0);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [skillResources.length, preloadedResources]); 


    const toggleSkill = async (index: number) => {
        // Update expanded state
        setExpandedSkills(prev => {
            const next = new Set(prev);
            if (next.has(index)) {
                next.delete(index);
            } else {
                next.add(index);
            }
            return next;
        });

        // Trigger resource load if needed (outside of state setter)
        // Only if not already loaded (which covers preloaded case too)
        const isExpanding = !expandedSkills.has(index);
        if (isExpanding) {
            // Small timeout to allow UI to update first
            setTimeout(() => {
                 const resources = skillResources[index];
                 // Check if empty and not loading. Preloaded resources would populate this, so this check is sufficient.
                 if (resources && !resources.loading && resources.videos.length === 0 && resources.articles.length === 0 && resources.pdfs.length === 0) {
                    loadResources(index);
                }
            }, 0);
        }
    };

    const loadResources = async (index: number) => {
        const skill = skills[index];

        // Set loading state
        setSkillResources(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], loading: true };
            return updated;
        });

        try {
            const resources = await fetchSkillResources(skill, scenarios);

            setSkillResources(prev => {
                const updated = [...prev];
                updated[index] = {
                    skill,
                    videos: resources.videos,
                    videoReasoning: resources.videoReasoning,
                    articles: resources.articles,
                    pdfs: resources.pdfs,
                    loading: false
                };
                return updated;
            });
        } catch (error) {
            console.error('Error loading resources:', error);
            setSkillResources(prev => {
                const updated = [...prev];
                updated[index] = {
                    ...updated[index],
                    loading: false,
                    error: 'Failed to load resources'
                };
                return updated;
            });
        }
    };

    if (skills.length === 0) {
        return (
            <div className="bg-gray-800/50 rounded-lg p-8 text-center border border-gray-700">
                <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No critical skills identified for this scenario.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-3">
                    <BookOpen className="w-6 h-6 text-tactical-accent" />
                    <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Critical Skills Training</h3>
                        <p className="text-xs text-gray-400 mt-1">
                            Master these {skills.length} essential skills to maximize your survival chances
                        </p>
                    </div>
                </div>
            </div>

            {/* Skills List */}
            <div className="space-y-3">
                {skills.map((skill, index) => {
                    const isExpanded = expandedSkills.has(index);
                    const resources = skillResources[index];

                    return (
                        <div key={index} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                            {/* Skill Header */}
                            <button
                                onClick={() => toggleSkill(index)}
                                className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-700/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-tactical-accent/20 flex items-center justify-center text-tactical-accent font-bold text-sm">
                                        {index + 1}
                                    </div>
                                    <span className="font-medium text-white">{skill}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {resources?.loading && <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />}
                                    {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                                </div>
                            </button>

                            {/* Skill Resources */}
                            {isExpanded && (
                                <div className="px-4 pb-4 border-t border-gray-700 animate-in slide-in-from-top-2 duration-200">
                                    {resources?.loading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="w-8 h-8 text-tactical-accent animate-spin" />
                                            <span className="ml-3 text-gray-400">Loading training resources...</span>
                                        </div>
                                    ) : resources?.error ? (
                                        <div className="py-4 text-center text-red-400">
                                            {resources.error}
                                        </div>
                                    ) : (
                                        <div className="pt-4 space-y-4">
                                            {/* YouTube Videos */}
                                            {resources?.videos && resources.videos.length > 0 && (
                                                <div>
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h4 className="flex items-center gap-2 text-xs font-bold text-gray-300 uppercase tracking-wider">
                                                            <Youtube className="w-4 h-4 text-red-500" />
                                                            Video Tutorials ({resources.videos.length})
                                                        </h4>
                                                    </div>
                                                    
                                                    {/* AI Reasoning Display */}
                                                    {resources.videoReasoning && (
                                                        <div className="mb-4 bg-tactical-accent/5 border border-tactical-accent/20 rounded-lg p-3">
                                                            <div className="flex items-start gap-2">
                                                                <Sparkles className="w-4 h-4 text-tactical-accent mt-0.5 shrink-0" />
                                                                <div>
                                                                    <span className="text-xs font-bold text-tactical-accent uppercase tracking-wider block mb-1">
                                                                        AI Selection Reasoning
                                                                    </span>
                                                                    <p className="text-sm text-gray-300 leading-relaxed">
                                                                        {resources.videoReasoning}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                        {resources.videos.map((video) => (
                                                            <VideoCard key={video.id} video={video} />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Articles */}
                                            {resources?.articles && resources.articles.length > 0 && (
                                                <div>
                                                    <h4 className="flex items-center gap-2 text-xs font-bold text-gray-300 uppercase tracking-wider mb-3">
                                                        <FileText className="w-4 h-4 text-blue-400" />
                                                        Articles & Guides ({resources.articles.length})
                                                    </h4>
                                                    <div className="space-y-2">
                                                        {resources.articles.map((article, i) => (
                                                            <a
                                                                key={i}
                                                                href={article.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-start gap-3 p-3 bg-gray-900/50 rounded border border-gray-700 hover:border-blue-500/50 transition-colors group"
                                                            >
                                                                <FileText className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm text-white font-medium group-hover:text-blue-400 transition-colors">
                                                                        {article.title}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500 mt-0.5">{article.source}</p>
                                                                </div>
                                                                <ExternalLink className="w-4 h-4 text-gray-600 shrink-0" />
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* PDFs */}
                                            {resources?.pdfs && resources.pdfs.length > 0 && (
                                                <div>
                                                    <h4 className="flex items-center gap-2 text-xs font-bold text-gray-300 uppercase tracking-wider mb-3">
                                                        <File className="w-4 h-4 text-green-400" />
                                                        PDF Manuals & Documents ({resources.pdfs.length})
                                                    </h4>
                                                    <div className="space-y-2">
                                                        {resources.pdfs.map((pdf, i) => (
                                                            <a
                                                                key={i}
                                                                href={pdf.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-start gap-3 p-3 bg-gray-900/50 rounded border border-gray-700 hover:border-green-500/50 transition-colors group"
                                                            >
                                                                <File className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm text-white font-medium group-hover:text-green-400 transition-colors">
                                                                        {pdf.title}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500 mt-0.5">{pdf.source}</p>
                                                                </div>
                                                                <ExternalLink className="w-4 h-4 text-gray-600 shrink-0" />
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* No resources found */}
                                            {(!resources?.videos || resources.videos.length === 0) &&
                                                (!resources?.articles || resources.articles.length === 0) &&
                                                (!resources?.pdfs || resources.pdfs.length === 0) && (
                                                    <div className="py-4 text-center text-gray-500 text-sm">
                                                        No resources available for this skill yet.
                                                    </div>
                                                )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CriticalSkills;
