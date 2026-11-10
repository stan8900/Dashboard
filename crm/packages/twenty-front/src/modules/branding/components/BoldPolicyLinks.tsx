import {
  BOLD_PRIVACY_PATH,
  BOLD_TERMS_PATH,
} from '@/branding/constants/PolicyLinks';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { Section } from 'twenty-ui/components/layout';
import { themeCssVariables } from 'twenty-ui/theme';

const StyledLinks = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[4]};

  a {
    color: ${themeCssVariables.font.color.primary};
  }
`;

export const BoldPolicyLinks = () => {
  const { t } = useLingui();

  return (
    <Section.Root>
      <Section.Header
        title={t`Bold policies`}
        description={t`Bold’s legal policies have not yet been published. Contact your workspace administrator for more information.`}
      />
      <StyledLinks>
        <a href={BOLD_PRIVACY_PATH} target="_blank" rel="noopener noreferrer">
          {t`Bold Privacy Policy`}
        </a>
        <a href={BOLD_TERMS_PATH} target="_blank" rel="noopener noreferrer">
          {t`Bold Terms of Use`}
        </a>
      </StyledLinks>
    </Section.Root>
  );
};
