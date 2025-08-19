import "@_/styles/global.scss";
import ApolloWrapper from "@_/aClient/provider";
import Nav from "@_/components/nav";
import { SessionProvider } from "@_/providers/SessionProvider";
import { AntdRegistry } from '@ant-design/nextjs-registry';
import ReduxProvider from '@_/rStore/provider';
import ValidateClientSession from '@_/lib/auth/validateClientSession';




export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ApolloWrapper>
          <SessionProvider>
            <AntdRegistry>
              <ReduxProvider>
                <ValidateClientSession>
                  <Nav />
                  {children}
                </ValidateClientSession>
              </ReduxProvider>
            </AntdRegistry>
          </SessionProvider>
        </ApolloWrapper>
      </body>
    </html>
  );
}


