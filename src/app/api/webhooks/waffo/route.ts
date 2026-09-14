import { WaffoProvider } from '@/payment/provider/waffo';
import { type NextRequest, NextResponse } from 'next/server';

const waffoProvider = new WaffoProvider();

/**
 * Waffo Pancake webhook handler
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const payload = await req.text();
  const signature = req.headers.get('x-waffo-signature') || '';

  try {
    if (!payload) {
      return NextResponse.json(
        { error: 'Missing webhook payload' },
        { status: 400 }
      );
    }

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing Waffo signature' },
        { status: 400 }
      );
    }

    await waffoProvider.handleWebhookEvent(payload, signature);
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[Waffo webhook]', message, error);
    return NextResponse.json(
      { error: 'Webhook handler failed', message },
      { status: 400 }
    );
  }
}
