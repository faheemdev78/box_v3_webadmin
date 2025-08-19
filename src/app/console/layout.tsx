// 'use client'
// import "@/styles/global.scss";
// import { use, useEffect, useState } from "react";
// import { getSessionToken } from "@_/lib/auth";
// import { DevBlock } from "@_/components";
// import { useDispatch, useSelector } from 'react-redux';
// import { RootState } from '@_/rStore';
// import { setSession, clearSession } from '@_/rStore/slices/sessionSlice';
// import { cleanStore } from '@_/rStore';

import PageProvider from "@_/components/pageProps";



export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return (<PageProvider pageProps={{}}>
    {children}
  </PageProvider>)
}

// export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
//   // const [session, setSession] = useState(null);
//   const session = useSelector((state: RootState) => state.session);
//   const token = getSessionToken();

//   // useEffect(() => {
//   //   setSession(getSessionToken())
//   // }, []);

  
//   return (<>
//     <h1>Console Layout</h1>
//     <DevBlock obj={session} />

//     {children}
//   </>);
// }
