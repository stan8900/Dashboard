import { type I18n } from '@lingui/core';
import { Container } from 'react-email';
import { BOLD_PUBLIC_URL } from 'src/branding';
import { Link } from 'src/components/Link';
import { ShadowText } from 'src/components/ShadowText';

type FooterProps = { i18n: I18n };

export const Footer = ({ i18n }: FooterProps) => (
  <Container style={{ marginTop: '12px' }}>
    <ShadowText>
      <>
        <Link href={BOLD_PUBLIC_URL} value={i18n._('Bold')} />
        {' · '}
        <Link
          href={`${BOLD_PUBLIC_URL}/legal/privacy.html`}
          value={i18n._('Legal information')}
        />
      </>
    </ShadowText>
  </Container>
);
