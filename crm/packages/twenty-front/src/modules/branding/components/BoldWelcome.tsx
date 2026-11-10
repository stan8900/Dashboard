import { styled } from '@linaria/react';
import { Trans } from '@lingui/react/macro';
import { themeCssVariables } from 'twenty-ui/theme';

const StyledWelcome = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.md};
  line-height: 1.6;
  max-width: 360px;
  text-align: center;

  p {
    margin: 0;
  }

  p + p {
    color: ${themeCssVariables.font.color.tertiary};
    font-size: ${themeCssVariables.font.size.sm};
    margin-top: ${themeCssVariables.spacing[3]};
  }
`;

export const BoldWelcome = () => (
  <StyledWelcome>
    <p>
      <Trans>A clear space for your people, records, and daily work.</Trans>
    </p>
    <p>
      <Trans>Sign in or create an account to get started.</Trans>
    </p>
  </StyledWelcome>
);
