import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SettingsSkeletonLoader } from '@/settings/components/SettingsSkeletonLoader';
import { SettingsPageLayout } from '@/settings/components/layout/SettingsPageLayout';
import { ApiKeyInput } from '@/settings/developers/components/ApiKeyInput';
import { ApiKeyNameInput } from '@/settings/developers/components/ApiKeyNameInput';
import { SettingsDevelopersRoleSelector } from '@/settings/developers/components/SettingsDevelopersRoleSelector';
import { apiKeyTokenFamilyState } from '@/settings/developers/states/apiKeyTokenFamilyState';
import { computeNewExpirationDate } from '@/settings/developers/utils/computeNewExpirationDate';
import { formatExpiration } from '@/settings/developers/utils/formatExpiration';
import { SettingsTextInput } from '@/ui/input/components/SettingsTextInput';
import { ConfirmationDialog } from '@/ui/layout/dialog/components/ConfirmationDialog';
import { useDialog } from '@/ui/layout/dialog/hooks/useDialog';
import { useAtomFamilyStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomFamilyStateValue';
import { useMutation, useQuery } from '@apollo/client/react';
import { styled } from '@linaria/react';
import { Trans, useLingui } from '@lingui/react/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { useStore } from 'jotai';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath, isDefined } from 'twenty-shared/utils';
import { doNotTranslate } from 'twenty-shared/i18n';
import { useToast } from 'twenty-ui/components/feedback';
import { Section } from 'twenty-ui/components/layout';
import { IconRepeat, IconTrash } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/primitives/input';
import { themeCssVariables } from 'twenty-ui/theme';
import {
  AssignRoleToApiKeyDocument,
  CreateApiKeyDocument,
  GenerateApiKeyTokenDocument,
  GetApiKeyDocument,
  GetApiKeyRolesDocument,
  RevokeApiKeyDocument,
} from '~/generated-metadata/graphql';
import { useNavigateSettings } from '~/hooks/useNavigateSettings';
import { SETTINGS_DEVELOPERS_TABS } from '@/settings/developers/constants/SettingsDevelopersTabs';

const StyledInfo = styled.span`
  color: ${themeCssVariables.font.color.light};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.regular};
`;

const StyledInputContainer = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  gap: ${themeCssVariables.spacing[2]};
  width: 100%;
`;

const DELETE_API_KEY_MODAL_ID = 'delete-api-key-modal';
const REGENERATE_API_KEY_MODAL_ID = 'regenerate-api-key-modal';

export const SettingsDevelopersApiKeyDetail = () => {
  const { t } = useLingui();
  const { enqueueToast } = useToast();
  const { openDialog } = useDialog();
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigateSettings();
  const { apiKeyId = '' } = useParams();

  const jotaiStore = useStore();

  const apiKeyToken = useAtomFamilyStateValue(apiKeyTokenFamilyState, apiKeyId);

  const setApiKeyTokenCallback = useCallback(
    (apiKeyId: string, token: string) => {
      jotaiStore.set(apiKeyTokenFamilyState.atomFamily(apiKeyId), token);
    },
    [jotaiStore],
  );

  const [generateOneApiKeyToken] = useMutation(GenerateApiKeyTokenDocument);
  const [createApiKey] = useMutation(CreateApiKeyDocument);
  const [revokeApiKey] = useMutation(RevokeApiKeyDocument);
  const [assignRoleToApiKey] = useMutation(AssignRoleToApiKeyDocument);

  const { data: apiKeyData, loading: apiKeyLoading } = useQuery(
    GetApiKeyDocument,
    {
      variables: {
        input: {
          id: apiKeyId,
        },
      },
    },
  );

  useEffect(() => {
    if (isDefined(apiKeyData?.apiKey)) {
      setApiKeyName(apiKeyData.apiKey.name);
      if (isDefined(apiKeyData.apiKey.role)) {
        setSelectedRoleId(apiKeyData.apiKey.role.id);
      }
    }
  }, [apiKeyData]);

  const { data: rolesData, loading: rolesLoading } = useQuery(
    GetApiKeyRolesDocument,
  );

  const roles = rolesData?.getApiKeyRoles ?? [];

  const apiKey = apiKeyData?.apiKey;
  const [apiKeyName, setApiKeyName] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState<string | undefined>(
    undefined,
  );

  const handleRoleChange = async (roleId: string) => {
    if (!apiKey?.id || !isNonEmptyString(roleId)) {
      return;
    }

    setIsLoading(true);
    try {
      await assignRoleToApiKey({
        variables: {
          apiKeyId: apiKey.id,
          roleId,
        },
      });
      enqueueToast({
        status: 'success',
        children: t`Role updated successfully`,
      });
      setSelectedRoleId(roleId);
    } catch {
      enqueueToast({ status: 'error', children: t`Error updating role` });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteIntegration = async (redirect = true) => {
    setIsLoading(true);

    try {
      await revokeApiKey({
        variables: {
          input: {
            id: apiKeyId,
          },
        },
      });
      if (redirect) {
        navigate(
          SettingsPath.Developers,
          undefined,
          undefined,
          undefined,
          SETTINGS_DEVELOPERS_TABS.TABS_IDS.API,
        );
      }
    } catch {
      enqueueToast({ status: 'error', children: t`Error revoking API token.` });
    } finally {
      setIsLoading(false);
    }
  };

  const createIntegration = async (
    name: string,
    newExpiresAt: string | null,
  ) => {
    const roleIdToUse = selectedRoleId;

    if (!roleIdToUse) {
      enqueueToast({
        status: 'error',
        children: t`A role must be selected for the API token`,
      });
      return;
    }

    if (!isDefined(roleIdToUse)) {
      throw new Error(
        doNotTranslate('Role not selected - this should never happen'),
      );
    }

    const { data: newApiKeyData } = await createApiKey({
      variables: {
        input: {
          name: name,
          expiresAt: newExpiresAt ?? '',
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
        expiresAt: newApiKey?.expiresAt,
      },
    });
    return {
      id: newApiKey.id,
      token: tokenData.data?.generateApiKeyToken.token,
    };
  };

  const regenerateApiKey = async () => {
    setIsLoading(true);
    try {
      if (isDefined(apiKey)) {
        if (!isNonEmptyString(apiKeyName)) {
          enqueueToast({
            status: 'error',
            children: t`API token name cannot be empty`,
          });
          return;
        }
        const newExpiresAt = computeNewExpirationDate(
          apiKey.expiresAt,
          apiKey.createdAt,
        );
        const newApiKey = await createIntegration(apiKeyName, newExpiresAt);
        await deleteIntegration(false);

        if (isNonEmptyString(newApiKey?.token)) {
          setApiKeyTokenCallback(newApiKey.id, newApiKey.token);
          navigate(SettingsPath.ApiKeyDetail, {
            apiKeyId: newApiKey.id,
          });
        }
      }
    } catch {
      enqueueToast({
        status: 'error',
        children: t`Error rotating API token.`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const confirmationValue = t`yes`;

  if (apiKeyLoading || rolesLoading) {
    return <SettingsSkeletonLoader />;
  }

  return (
    <>
      {isDefined(apiKey) && (
        <SettingsPageLayout
          title={apiKey.name || t`Unnamed API Token`}
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
            { children: apiKey.name || t`Unnamed API Token` },
          ]}
        >
          <SettingsPageContainer>
            <Section.Root>
              {apiKeyToken ? (
                <>
                  <Section.Header
                    title={t`API Token`}
                    description={t`Copy this token now. Its secret will not be shown again.`}
                  />
                  <ApiKeyInput apiKey={apiKeyToken} />
                </>
              ) : (
                <>
                  <Section.Header
                    title={t`API Token`}
                    description={t`Rotate this token if it is lost or may be exposed.`}
                  />
                  <StyledInputContainer>
                    <Button
                      startIcon={<IconRepeat />}
                      onClick={() => openDialog(REGENERATE_API_KEY_MODAL_ID)}
                    >{t`Rotate token`}</Button>
                    <StyledInfo>
                      {formatExpiration(apiKey?.expiresAt || '', true, false)}
                    </StyledInfo>
                  </StyledInputContainer>
                </>
              )}
            </Section.Root>
            <Section.Root>
              <Section.Header
                title={t`Name`}
                description={t`Name of your API token`}
              />
              <ApiKeyNameInput
                apiKeyName={apiKeyName}
                apiKeyId={apiKey?.id}
                disabled={isLoading}
                onNameUpdate={setApiKeyName}
              />
            </Section.Root>
            <Section.Root>
              <Section.Header
                title={t`Role`}
                description={t`The server-enforced role that controls this token's record access.`}
              />
              <SettingsDevelopersRoleSelector
                value={selectedRoleId}
                onChange={handleRoleChange}
                roles={roles}
              />
            </Section.Root>
            <Section.Root>
              <Section.Header
                title={t`Expiration`}
                description={t`When the token will be disabled`}
              />
              <SettingsTextInput
                instanceId={`api-key-expiration-${apiKey?.id}`}
                placeholder={t`E.g. backoffice integration`}
                value={formatExpiration(apiKey?.expiresAt || '', true, false)}
                disabled
                fullWidth
              />
            </Section.Root>
            <Section.Root>
              <Section.Header
                title={t`Audit identifier`}
                description={t`Use this safe identifier to find this token's requests in the API access logs.`}
              />
              <SettingsTextInput
                instanceId={`api-token-identifier-${apiKey.id}`}
                value={apiKey.id}
                disabled
                fullWidth
              />
            </Section.Root>
            <Section.Root>
              <Section.Header
                title={t`Danger zone`}
                description={t`Revoke this token immediately`}
              />
              <Button
                startIcon={<IconTrash />}
                onClick={() => openDialog(DELETE_API_KEY_MODAL_ID)}
                variant="outline"
                color="danger"
              >{t`Revoke token`}</Button>
            </Section.Root>
          </SettingsPageContainer>
        </SettingsPageLayout>
      )}
      <ConfirmationDialog
        confirmationPlaceholder={confirmationValue}
        confirmationValue={confirmationValue}
        dialogId={DELETE_API_KEY_MODAL_ID}
        title={t`Revoke API token`}
        subtitle={
          <Trans>
            Please type {`"${confirmationValue}"`} to confirm you want to delete
            this API token. Any integration using it will stop working.
          </Trans>
        }
        onConfirmClick={deleteIntegration}
        confirmButtonText={t`Revoke token`}
        loading={isLoading}
      />
      <ConfirmationDialog
        confirmationPlaceholder={confirmationValue}
        confirmationValue={confirmationValue}
        dialogId={REGENERATE_API_KEY_MODAL_ID}
        title={t`Rotate API token`}
        subtitle={
          <Trans>
            This creates a replacement token and immediately revokes the current
            token. Update JARVIS with the new secret before continuing. Please
            type
            {`"${confirmationValue}"`} to confirm.
          </Trans>
        }
        onConfirmClick={regenerateApiKey}
        confirmButtonText={t`Rotate token`}
        loading={isLoading}
      />
    </>
  );
};
