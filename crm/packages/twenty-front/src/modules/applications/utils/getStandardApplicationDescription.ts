import { brandProductText } from '@/branding/utils/brandProductText';
import { t } from '@lingui/core/macro';

export const getStandardApplicationDescription = (): string =>
  brandProductText(t`The base data model every Twenty workspace runs on.`);
