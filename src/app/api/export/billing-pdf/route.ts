import { NextRequest, NextResponse } from 'next/server';
import { getBillingTransactions } from '@/lib/usage';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const filters = {
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      transactionType: body.transactionType || 'all',
      page: 1,
      pageSize: 10000,
    };

    const { transactions } = await getBillingTransactions(user.id, filters);

    // TODO: Add PDF generation library (e.g., @react-pdf/renderer or puppeteer)
    // For now, return placeholder
    return NextResponse.json(
      { error: 'PDF generation not yet implemented', transactionCount: transactions.length },
      { status: 501 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to export PDF' },
      { status: 500 }
    );
  }
}
