import "@_/styles/global.scss";
import Nav from '@_/components/test/nav'


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<>
    <Nav />
    {children}
  </>);
}


