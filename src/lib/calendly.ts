/**
 * Build a Calendly booking URL with pre-populated user information
 * Appends query parameters for name, email, and agenda summary
 */
export function buildCalendlyUrl(params: {
  baseUrl: string;
  userName: string;
  userEmail: string;
  agendaSummary?: string;
}): string {
  try {
    const url = new URL(params.baseUrl);

    // Add user name
    url.searchParams.set('name', params.userName);

    // Add user email
    url.searchParams.set('email', params.userEmail);

    // Add agenda summary (truncated to 500 chars for Calendly limit)
    if (params.agendaSummary) {
      const truncatedAgenda = params.agendaSummary.substring(0, 500);
      url.searchParams.set('a1', truncatedAgenda);
    }

    return url.toString();
  } catch (error) {
    console.error('Failed to build Calendly URL:', error);
    // Fallback: return base URL if parsing fails
    return params.baseUrl;
  }
}

/**
 * Extract a summary from the full agenda markdown
 * Takes first paragraph or first 200 characters, whichever is shorter
 */
export function extractAgendaSummary(fullAgenda: string): string {
  // Remove markdown headers
  const withoutHeaders = fullAgenda.replace(/^#+\s+/gm, '');

  // Split into paragraphs
  const paragraphs = withoutHeaders.split('\n\n').filter((p) => p.trim().length > 0);

  if (paragraphs.length === 0) {
    return 'Emergency Preparedness Consulting Session';
  }

  // Get first paragraph
  const firstParagraph = paragraphs[0].trim();

  // Remove bullet points and list markers
  const cleaned = firstParagraph.replace(/^[-*•]\s+/gm, '').trim();

  // Truncate to 200 characters if needed
  if (cleaned.length <= 200) {
    return cleaned;
  }

  return cleaned.substring(0, 197) + '...';
}
