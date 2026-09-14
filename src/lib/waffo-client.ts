import {
  getWaffoEnvironment,
  getWaffoMerchantId,
  getWaffoPrivateKey,
} from '@/config/waffo-env';
import { WaffoPancake } from '@waffo/pancake-ts';

let waffoClient: WaffoPancake | null = null;

export function getWaffoClient(): WaffoPancake {
  if (!waffoClient) {
    const merchantId = getWaffoMerchantId();
    const privateKey = getWaffoPrivateKey();
    if (!merchantId || !privateKey) {
      throw new Error(
        'WAFFO_MERCHANT_ID and WAFFO_PRIVATE_KEY must be set for Waffo payments'
      );
    }

    waffoClient = new WaffoPancake({
      merchantId,
      privateKey,
      environment: getWaffoEnvironment(),
    });
  }

  return waffoClient;
}
