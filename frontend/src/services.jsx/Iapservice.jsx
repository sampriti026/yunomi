export const skus = Platform.select({
  android: [
    'com.yunomi.subscription.monthly', // One-time purchase for one month access
    'com.yunomi.subscription.annual', // Annual subscription
  ],
});
