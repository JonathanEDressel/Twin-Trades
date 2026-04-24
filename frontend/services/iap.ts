import { Platform } from 'react-native';
// Dynamic import avoids crashing in Expo Go where native module isn't available
const getIAP = () => import('expo-in-app-purchases');
import { verifyApplePurchase } from '@/services/subscription';
import { Subscription } from '@/models/Subscription';

const PRODUCT_IDS = [
  'com.twintrades.app.monthly',
  'com.twintrades.app.annual',
  'com.twintrades.app.lifetime',
];

export async function fetchProducts(): Promise<any[]> {
  if (Platform.OS !== 'ios') return [];
  const IAP = await getIAP();
  await IAP.connectAsync();
  const { results } = await IAP.getProductsAsync(PRODUCT_IDS);
  return results ?? [];
}

export async function purchaseProduct(productId: string): Promise<Subscription | null> {
  if (Platform.OS !== 'ios') return null;

  const IAP = await getIAP();
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
  if (Platform.OS !== 'ios') return;
  const IAP = await getIAP();
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
  if (Platform.OS !== 'ios') return;
  const IAP = await getIAP();
  await IAP.disconnectAsync();
}
