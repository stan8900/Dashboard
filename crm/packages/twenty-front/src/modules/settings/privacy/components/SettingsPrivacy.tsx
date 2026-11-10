import { BoldPolicyLinks } from '@/branding/components/BoldPolicyLinks';
import { SettingsPrivacyAiDataProcessing } from '@/settings/privacy/components/SettingsPrivacyAiDataProcessing';
import { useIsAiDataPolicyConfigurable } from '@/settings/privacy/hooks/useIsAiDataPolicyConfigurable';

export const SettingsPrivacy = () => {
  const isAiDataPolicyConfigurable = useIsAiDataPolicyConfigurable();

  return (
    <>
      <BoldPolicyLinks />
      {isAiDataPolicyConfigurable && <SettingsPrivacyAiDataProcessing />}
    </>
  );
};
