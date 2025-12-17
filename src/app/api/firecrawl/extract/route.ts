import { NextRequest, NextResponse } from 'next/server';
import { extractProductFromUrl } from '@/lib/firecrawl';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ success: false, message: 'URL is required' }, { status: 400 });
    }

    const result = await extractProductFromUrl(url);

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, message, errors: [message] },
      { status: 500 }
    );
  }
}
