import { APP_DISPLAY_NAME } from '@/branding/constants/Branding';
import { Helmet } from '@dr.pogodin/react-helmet';

import { useWorkspaceSurface } from '@/ui/layout/hooks/useWorkspaceSurface';

type PageTitleProps = {
  title: string;
};

export const PageTitle = (props: PageTitleProps) => {
  const workspaceSurface = useWorkspaceSurface();

  if (workspaceSurface.type === 'side-panel') {
    return null;
  }

  return (
    <Helmet>
      <title>
        {props.title === APP_DISPLAY_NAME ||
        props.title.endsWith(` | ${APP_DISPLAY_NAME}`)
          ? props.title
          : `${props.title} | ${APP_DISPLAY_NAME}`}
      </title>
    </Helmet>
  );
};
