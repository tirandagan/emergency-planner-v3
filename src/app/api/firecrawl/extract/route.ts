import { NextRequest, NextResponse } from 'next/server';
import { extractProductFromUrl } from '@/lib/firecrawl';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { url, userId } = await request.json();

    if (!url) {
      return NextResponse.json({ success: false, message: 'URL is required' }, { status: 400 });
    }

    const result = await extractProductFromUrl(url, userId);

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Firecrawl API] Unexpected error:', message);

    return NextResponse.json(
      { success: false, message, errors: [message] },
      { status: 500 }
    );
  }
}
