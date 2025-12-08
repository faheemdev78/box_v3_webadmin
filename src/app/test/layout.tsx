import "@_/styles/global.scss";
import Nav from '@_/components/test/nav'


function RootLayout({ children }: { children: React.ReactNode }) {
  return (<>
    <Nav />
    {children}
  </>);
}

export default RootLayout
