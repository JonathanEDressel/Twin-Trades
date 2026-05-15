import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { verifyApplePurchase } from '@/services/subscription';
import { Subscription } from '@/models/Subscription';

// expo-in-app-purchases requires a custom dev build — it crashes in Expo Go.
// Detect Expo Go by checking appOwnership and short-circuit all IAP calls.
const isExpoGo = Constants.appOwnership === 'expo';

function getIAP(): any | null {
  if (isExpoGo || Platform.OS !== 'ios') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('expo-in-app-purchases');
  } catch {
    return null;
  }
}

const PRODUCT_IDS = [
  'com.twintrades.app.monthly',
  'com.twintrades.app.annual',
  'com.twintrades.app.lifetime',
];

export async function fetchProducts(): Promise<any[]> {
  const IAP = getIAP();
  if (!IAP) return [];
  await IAP.connectAsync();
  const { results } = await IAP.getProductsAsync(PRODUCT_IDS);
  return results ?? [];
}

export async function purchaseProduct(productId: string): Promise<Subscription | null> {
  const IAP = getIAP();
  if (!IAP) return null;
  return new Promise((resolve, reject) => {
    IAP.setPurchaseListener(async ({ responseCode, results }) => {
      if (responseCode === IAP.IAPResponseCode.OK && results?.length) {
        const purchase = results[0];
        try {
          const subscription = await verifyApplePurchase({
            transaction_id: purchase.orderId ?? '',
            product_id: purchase.productId,
          });
          await IAP.finishTransactionAsync(purchase, true);
          resolve(subscription);
        } catch (err) {
          reject(err);
        }
      } else if (responseCode === IAP.IAPResponseCode.USER_CANCELED) {
        resolve(null);
      } else {
        reject(new Error(`Purchase failed with code ${responseCode}`));
      }
    });

    IAP.purchaseItemAsync(productId).catch(reject);
  });
}

export async function restorePurchases(): Promise<void> {
  const IAP = getIAP();
  if (!IAP) return;
  const { results } = await IAP.getPurchaseHistoryAsync();
  for (const purchase of results ?? []) {
    if (!purchase.acknowledged) {
      await verifyApplePurchase({
        transaction_id: purchase.orderId ?? '',
        product_id: purchase.productId,
      });
      await IAP.finishTransactionAsync(purchase, true);
    }
  }
}

export async function disconnectIAP(): Promise<void> {
  const IAP = getIAP();
  if (!IAP) return;
  await IAP.disconnectAsync();
}
