import { addDays } from 'date-fns';
import { useCallback, useEffect, useState } from 'react';

import { SaveAndCancelButtons } from '@/settings/components/SaveAndCancelButtons/SaveAndCancelButtons';
import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SettingsSkeletonLoader } from '@/settings/components/SettingsSkeletonLoader';
import { SettingsDevelopersRoleSelector } from '@/settings/developers/components/SettingsDevelopersRoleSelector';
import { EXPIRATION_DATES } from '@/settings/developers/constants/ExpirationDates';
import { apiKeyTokenFamilyState } from '@/settings/developers/states/apiKeyTokenFamilyState';
import { Select } from '@/ui/input/components/Select';
import { SettingsTextInput } from '@/ui/input/components/SettingsTextInput';
import { SettingsPageLayout } from '@/settings/components/layout/SettingsPageLayout';
import { useMutation, useQuery } from '@apollo/client/react';
import { useLingui } from '@lingui/react/macro';
import { useStore } from 'jotai';
import { Key } from 'ts-key-enum';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath, isDefined } from 'twenty-shared/utils';
import {
  CreateApiKeyDocument,
  GenerateApiKeyTokenDocument,
  GetApiKeyRolesDocument,
  GetApiKeysDocument,
} from '~/generated-metadata/graphql';
import { useNavigateSettings } from '~/hooks/useNavigateSettings';
import { SETTINGS_DEVELOPERS_TABS } from '@/settings/developers/constants/SettingsDevelopersTabs';
import { Section } from 'twenty-ui/components/layout';
import { Button } from 'twenty-ui/primitives/input';

const JARVIS_TOKEN_NAME = 'JARVIS Personal Assistant';
const JARVIS_TOKEN_EXPIRATION_DAYS = 90;

export const SettingsDevelopersApiKeysNew = () => {
  const { t, i18n } = useLingui();
  const [generateOneApiKeyToken] = useMutation(GenerateApiKeyTokenDocument);
  const navigateSettings = useNavigateSettings();
  const { data: rolesData, loading: rolesLoading } = useQuery(
    GetApiKeyRolesDocument,
  );
  const roles = rolesData?.getApiKeyRoles ?? [];

  const [formValues, setFormValues] = useState<{
    name: string;
    expirationDate: number | null;
    roleId: string;
  }>({
    expirationDate: EXPIRATION_DATES[5].value,
    name: '',
    roleId: '',
  });

  useEffect(() => {
    if (isDefined(rolesData?.getApiKeyRoles)) {
      const apiKeyAssignableRoles = rolesData.getApiKeyRoles.filter(
        (role) => role.canBeAssignedToApiKeys,
      );
      if (apiKeyAssignableRoles.length > 0) {
        setFormValues((prev) => {
          if (!prev.roleId) {
            return { ...prev, roleId: apiKeyAssignableRoles[0].id };
          }
          return prev;
        });
      }
    }
  }, [rolesData]);

  const [createApiKey] = useMutation(CreateApiKeyDocument, {
    refetchQueries: [GetApiKeysDocument],
    awaitRefetchQueries: true,
  });

  const jotaiStore = useStore();

  const setApiKeyTokenCallback = useCallback(
    (apiKeyId: string, token: string) => {
      jotaiStore.set(apiKeyTokenFamilyState.atomFamily(apiKeyId), token);
    },
    [jotaiStore],
  );

  const handleSave = async () => {
    if (!formValues.name) {
      return;
    }

    const expiresAt = addDays(
      new Date(),
      formValues.expirationDate ?? 30,
    ).toISOString();

    const roleIdToUse = formValues.roleId;

    if (!roleIdToUse) {
      return;
    }

    const { data: newApiKeyData } = await createApiKey({
      variables: {
        input: {
          name: formValues.name.trim(),
          expiresAt,
          roleId: roleIdToUse,
        },
      },
    });

    const newApiKey = newApiKeyData?.createApiKey;

    if (!newApiKey) {
      return;
    }

    const tokenData = await generateOneApiKeyToken({
      variables: {
        apiKeyId: newApiKey.id,
        expiresAt: expiresAt,
      },
    });

    if (isDefined(tokenData.data?.generateApiKeyToken)) {
      setApiKeyTokenCallback(
        newApiKey.id,
        tokenData.data.generateApiKeyToken.token,
      );
      navigateSettings(SettingsPath.ApiKeyDetail, {
        apiKeyId: newApiKey.id,
      });
    }
  };

  const canSave = !!formValues.name && !!formValues.roleId;

  if (rolesLoading) {
    return <SettingsSkeletonLoader />;
  }

  return (
    <SettingsPageLayout
      title={t`New API token`}
      links={[
        {
          children: t`Workspace`,
          href: getSettingsPath(SettingsPath.General),
        },
        {
          children: t`Developers`,
          href: getSettingsPath(
            SettingsPath.Developers,
            undefined,
            undefined,
            SETTINGS_DEVELOPERS_TABS.TABS_IDS.API,
          ),
        },
        { children: t`New API Token` },
      ]}
      actionButton={
        <SaveAndCancelButtons
          isSaveDisabled={!canSave}
          onCancel={() => {
            navigateSettings(
              SettingsPath.Developers,
              undefined,
              undefined,
              undefined,
              SETTINGS_DEVELOPERS_TABS.TABS_IDS.API,
            );
          }}
          onSave={handleSave}
        />
      }
    >
      <SettingsPageContainer>
        <Section.Root>
          <Section.Header
            title={t`JARVIS preset`}
            description={t`Start with a 90-day token for your personal assistant. Select a restricted role below to control exactly which records JARVIS can read or change.`}
          />
          <Button
            variant="outline"
            onClick={() => {
              setFormValues((previousValues) => ({
                ...previousValues,
                name: JARVIS_TOKEN_NAME,
                expirationDate: JARVIS_TOKEN_EXPIRATION_DAYS,
              }));
            }}
          >{t`Use JARVIS preset`}</Button>
        </Section.Root>
        <Section.Root>
          <Section.Header
            title={t`Name`}
            description={t`Name of your API token`}
          />
          <SettingsTextInput
            instanceId="api-key-new-name"
            placeholder={t`E.g. JARVIS Personal Assistant`}
            value={formValues.name}
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing || e.keyCode === 229) {
                return;
              }
              if (e.key === Key.Enter) {
                handleSave();
              }
            }}
            onChange={(value) => {
              setFormValues((prevState) => ({
                ...prevState,
                name: value,
              }));
            }}
            fullWidth
          />
        </Section.Root>
        <Section.Root>
          <Section.Header
            title={t`Role`}
            description={t`Choose a dedicated integration role. Its object permissions are enforced by the server on every request.`}
          />
          <SettingsDevelopersRoleSelector
            value={formValues.roleId}
            onChange={(roleId) => {
              setFormValues((prevState) => ({
                ...prevState,
                roleId,
              }));
            }}
            roles={roles}
          />
        </Section.Root>
        <Section.Root>
          <Section.Header
            title={t`Expiration Date`}
            description={t`When the API token will stop working.`}
          />
          <Select
            dropdownId="object-field-type-select"
            options={EXPIRATION_DATES.map(({ label, value }) => ({
              label: i18n._(label),
              value,
            }))}
            value={formValues.expirationDate}
            onChange={(value) => {
              setFormValues((prevState) => ({
                ...prevState,
                expirationDate: value,
              }));
            }}
          />
        </Section.Root>
      </SettingsPageContainer>
    </SettingsPageLayout>
  );
};
