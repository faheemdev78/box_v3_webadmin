// import '@ant-design/v5-patch-for-react-19';
import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
config.autoAddCss = false;

import "@/styles/global.scss";
import ApolloWrapper from "@/aClient/provider";
// import Nav from "@/components/nav";
import { AntdRegistry } from '@ant-design/nextjs-registry';
import ReduxProvider from '@/rStore/provider';
// import { SessionProvider } from "@/lib/auth/SessionProvider";
import ValidateClientSession from '@/lib/auth/validateClientSession';
import { Header } from "@/template";
import NextTopLoader from 'nextjs-toploader';
import { Footer } from '@/template/footer';
import { fetchSettings } from '@/lib/fetchSettings';
import { DevBlock } from '@/components/devBlock';

function StartupError({ error }: { error: Error }) {
  return (
    <html lang="en">
      <body>
        <h3>🚨 ERROR: Unable to start application</h3>
        <p>{error.message}</p>
      </body>
    </html>
  );
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await fetchSettings();
  if (settings.error) return <StartupError error={settings.error} />
  
  // console.log("process.env: ", JSON.stringify(process.env))

  return (<html lang="en">
    <body>
      <ApolloWrapper>
        {/* <SessionProvider> */}
          <AntdRegistry>
          <ReduxProvider settings={settings}>
              <ValidateClientSession>
                <Header />
                <NextTopLoader />
                {children}
                <Footer />
                {/* <DevBlock obj={process.env} force={false} /> */}
              </ValidateClientSession>
            </ReduxProvider>
          </AntdRegistry>
        {/* </SessionProvider> */}
      </ApolloWrapper>
    </body>
  </html>);
}


