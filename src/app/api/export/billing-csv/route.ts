import { NextRequest, NextResponse } from 'next/server';
import { getBillingTransactions } from '@/lib/usage';
import { createClient } from '@/utils/supabase/server';
import { logApiError } from '@/lib/system-logger';

export async function POST(request: NextRequest): Promise<NextResponse> {
  let userId: string | undefined;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id;

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

    const csvHeader = 'Date,Description,Amount,Status,Invoice ID\n';
    const csvRows = transactions
      .map((t) => {
        const date = new Date(t.transactionDate).toLocaleDateString();
        const desc = (t.description || t.transactionType).replace(/"/g, '""');
        const amount = `$${t.amount} ${t.currency.toUpperCase()}`;
        const status = t.status;
        const invoiceId = t.stripeInvoiceId || 'N/A';
        return `"${date}","${desc}","${amount}","${status}","${invoiceId}"`;
      })
      .join('\n');

    const csv = csvHeader + csvRows;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="billing-history-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    await logApiError(error, {
      route: '/api/export/billing-csv',
      userId,
      userAction: 'Exporting billing history as CSV',
    });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to export CSV' },
      { status: 500 }
    );
  }
}
