// app/console/page.tsx
import { Page } from '@_/template';
import { redirect, RedirectType } from 'next/navigation';

function ConsoleHome() {
    redirect('/console/dashboard', RedirectType.replace);
    
    return <Page><p>Redirecting...</p></Page>
}

export default ConsoleHome;