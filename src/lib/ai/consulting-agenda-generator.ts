import { generateText } from 'ai';
import { getModel, MODELS } from '@/lib/openrouter';
import { db } from '@/db';
import { consultingBookings, consultingServices } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * OpenRouter AI Integration for Consulting Agenda Generation
 * Uses Gemini Flash model for fast, cost-effective agenda generation
 */

const AGENDA_MODEL = MODELS.GEMINI_FLASH;

interface ConsultingBookingWithService {
  booking: typeof consultingBookings.$inferSelect;
  service: typeof consultingServices.$inferSelect | null;
}

interface AgendaGenerationResult {
  agenda: string;
  estimatedDuration: number;
}

/**
 * Generate a personalized consulting session agenda using AI
 * Uses google/gemini-2.0-flash-exp via OpenRouter for fast, cost-effective generation
 */
export async function generateConsultingAgenda(
  bookingId: string
): Promise<AgendaGenerationResult> {
  const startTime = Date.now();

  // Fetch booking with service details
  const [result] = await db
    .select({
      booking: consultingBookings,
      service: consultingServices,
    })
    .from(consultingBookings)
    .leftJoin(consultingServices, eq(consultingBookings.consultingServiceId, consultingServices.id))
    .where(eq(consultingBookings.id, bookingId))
    .limit(1);

  if (!result || !result.service) {
    throw new Error('Booking or service not found');
  }

  const prompt = buildAgendaPrompt(result);
  const model = getModel('GEMINI_FLASH');

  const { text } = await generateText({
    model,
    system: `You are an expert emergency preparedness consultant with years of experience helping families prepare for disasters. Your goal is to create clear, actionable consulting session agendas that address each client's specific needs and preparedness level.

Your agendas should:
- Be professional yet warm and encouraging
- Focus on actionable outcomes the client can implement
- Address their specific concerns and preparedness gaps
- Set realistic expectations for what can be accomplished in one session
- Build confidence in their ability to improve their preparedness`,
    prompt,
    temperature: 0.7,
  });

  const agenda = text || '';
  const estimatedDuration = extractDurationFromAgenda(agenda) || 60;

  // TODO: Add AI usage tracking when analytics table is created
  // Track usage with logAIUsage()

  return { agenda, estimatedDuration };
}

/**
 * Build the AI prompt from booking and service data
 */
function buildAgendaPrompt(data: ConsultingBookingWithService): string {
  if (!data.service) {
    throw new Error('Service is required to build agenda prompt');
  }

  const responses = data.booking.intakeResponses as Record<string, string>;
  const responsesText = Object.entries(responses)
    .map(([question, answer]) => `**${question}**\n${answer}`)
    .join('\n\n');

  return `
Generate a structured consulting session agenda for this emergency preparedness client:

**Service:** ${data.service.name}
${data.service.description}

**Client's Intake Responses:**
${responsesText}

**Your Task:**
Create a professional consulting session agenda that includes:

1. **Session Overview** (2-3 sentences)
   - Briefly summarize what you'll accomplish together
   - Set positive expectations for the session

2. **Key Topics to Cover** (4-6 topics)
   - Based on their specific responses and preparedness level
   - Prioritize the most impactful areas
   - Use bullet points for clarity

3. **Discussion Questions** (3-5 questions)
   - Specific questions you'll explore together during the session
   - Questions should help identify gaps and opportunities
   - Frame questions positively to encourage engagement

4. **Deliverables & Next Steps** (2-3 concrete outcomes)
   - What the client will walk away with
   - Actionable next steps they can take immediately
   - Resources or tools you'll provide

5. **Estimated Duration**
   - Based on the complexity of their needs, estimate: 30, 60, or 90 minutes
   - Include this as the final line: "Estimated Duration: [X] minutes"

**Format:**
- Use markdown formatting with clear headers (##)
- Use bullet points for easy scanning
- Keep language conversational and encouraging
- Focus on empowerment and confidence-building

**Tone:**
Professional but warm. The client should feel excited about the session and confident in their ability to improve their preparedness with your guidance.
`.trim();
}

/**
 * Extract estimated duration from the AI-generated agenda
 * Looks for patterns like "60 minutes", "1 hour", "90 min"
 */
function extractDurationFromAgenda(agenda: string): number | null {
  const patterns = [
    /estimated duration[:\s]+(\d+)\s*minutes?/i,
    /duration[:\s]+(\d+)\s*mins?/i,
    /(\d+)\s*minutes?\s*session/i,
    /(\d+)\s*hour(?:s?)\s*session/i,
  ];

  for (const pattern of patterns) {
    const match = agenda.match(pattern);
    if (match) {
      const value = parseInt(match[1], 10);
      // If pattern mentions hours, convert to minutes
      if (pattern.source.includes('hour')) {
        return value * 60;
      }
      return value;
    }
  }

  return null;
}
