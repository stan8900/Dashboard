import { BoldPolicyLinks } from '@/branding/components/BoldPolicyLinks';
import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SettingsPageLayout } from '@/settings/components/layout/SettingsPageLayout';
import { SettingsLabContent } from '@/settings/lab/components/SettingsLabContent';
import { useLingui } from '@lingui/react/macro';
import { Section } from 'twenty-ui/components/layout';

export const SettingsCommunity = () => {
  const { t } = useLingui();

  return (
    <SettingsPageLayout
      title={t`Bold resources`}
      links={[{ children: t`Resources` }]}
    >
      <SettingsPageContainer>
        <Section.Root>
          <Section.Header
            title={t`Your Bold workspace`}
            description={t`Contact your workspace administrator for help, access requests, or product updates.`}
          />
        </Section.Root>
        <BoldPolicyLinks />
        <Section.Root>
          <Section.Header title={t`Experimental features`} />
          <SettingsLabContent />
        </Section.Root>
      </SettingsPageContainer>
    </SettingsPageLayout>
  );
};
