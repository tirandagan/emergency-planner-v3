import { NextRequest, NextResponse } from 'next/server';
import { getAmazonItem, searchAmazonItems } from '@/lib/amazon-paapi';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const asin = searchParams.get('asin');
  const query = searchParams.get('query');

  if (asin) {
    const { item, error } = await getAmazonItem(asin);
    if (item) {
      return NextResponse.json({ success: true, data: item });
    } else {
      return NextResponse.json({ success: false, error: error || 'Item not found or API error' }, { status: 404 });
    }
  }

  if (query) {
    const { items, error } = await searchAmazonItems(query);
    if (error) {
         return NextResponse.json({ success: false, error }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: items });
  }

  return NextResponse.json({ success: false, error: 'Missing asin or query parameter' }, { status: 400 });
}
