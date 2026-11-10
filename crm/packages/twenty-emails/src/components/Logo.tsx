import { type I18n } from '@lingui/core';
import { Img } from 'react-email';
import { BOLD_PUBLIC_URL } from 'src/branding';

const logoStyle = {
  marginBottom: '40px',
};

type LogoProps = {
  i18n: I18n;
};

export const Logo = ({ i18n }: LogoProps) => {
  return (
    <Img
      src={`${BOLD_PUBLIC_URL}/images/branding/bold-192.png`}
      alt={i18n._('Bold logo')}
      width="40"
      height="40"
      style={logoStyle}
    />
  );
};
