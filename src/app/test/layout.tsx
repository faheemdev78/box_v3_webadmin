import "@/styles/global.scss";
import Nav from '@/components/test/nav'


function RootLayout({ children }: { children: React.ReactNode }) {
  return (<>
    <Nav />
    {children}
  </>);
}

export default RootLayout
