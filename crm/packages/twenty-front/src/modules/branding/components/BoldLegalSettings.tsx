import { BoldPolicyLinks } from '@/branding/components/BoldPolicyLinks';
import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SettingsPageLayout } from '@/settings/components/layout/SettingsPageLayout';
import { useLingui } from '@lingui/react/macro';

export const BoldLegalSettings = () => {
  const { t } = useLingui();

  return (
    <SettingsPageLayout
      title={t`Bold policies`}
      links={[{ children: t`Legal` }]}
    >
      <SettingsPageContainer>
        <BoldPolicyLinks />
      </SettingsPageContainer>
    </SettingsPageLayout>
  );
};
