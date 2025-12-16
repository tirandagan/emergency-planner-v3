import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const engine = searchParams.get('engine');

  if (!query) {
    return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 });
  }

  if (engine !== 'amazon') {
    return NextResponse.json({ error: 'Unsupported engine' }, { status: 400 });
  }

  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) {
    // Fallback for development if no key is present, or return error
    console.error('Missing SERPAPI_API_KEY');
    return NextResponse.json({ error: 'Server configuration error: Missing API key' }, { status: 500 });
  }

  try {
    // Amazon Engine uses 'k' for keywords, not 'q'
    const url = `https://serpapi.com/search.json?engine=amazon&k=${encodeURIComponent(query)}&api_key=${apiKey}`;
    const response = await fetch(url);
    
    if (!response.ok) {
        throw new Error(`SerpAPI responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('SerpAPI fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch from SerpAPI' }, { status: 500 });
  }
}
