import { CreemLegacyWebhookProvider } from '@/payment/provider/creem-legacy-webhook';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * Legacy Creem webhook (main-Waffo).
 *
 * New payments use /api/webhooks/waffo. This route stays so Creem renewals
 * still reach https://phototourl.com/api/webhooks/creem.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const payload = await req.text();
  const signature = req.headers.get('creem-signature') || '';

  try {
    if (!payload) {
      return NextResponse.json(
        { error: 'Missing webhook payload' },
        { status: 400 }
      );
    }

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing Creem signature' },
        { status: 400 }
      );
    }

    const provider = new CreemLegacyWebhookProvider();
    await provider.handleWebhookEvent(payload, signature);

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('[Creem legacy webhook]', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
}
