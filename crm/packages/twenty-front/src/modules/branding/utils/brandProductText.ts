import { APP_DISPLAY_NAME } from '@/branding/constants/Branding';

// Preserve later upstream attribution in translated product descriptions.
export const brandProductText = (message: string): string =>
  message.replace(/\bTwenty\b/, APP_DISPLAY_NAME);
