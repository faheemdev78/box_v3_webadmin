// 'use client'
// import "@/styles/global.scss";
// import { use, useEffect, useState } from "react";
// import { getSessionToken } from "@/lib/auth";
// import { DevBlock } from "@/components";
// import { useDispatch, useSelector } from 'react-redux';
// import { RootState } from '@/rStore';
// import { setSession, clearSession } from '@/rStore/slices/sessionSlice';
// import { cleanStore } from '@/rStore';

import PageProvider from "@/components/pageProps";



function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return (<PageProvider pageProps={{}}>
    {children}
  </PageProvider>)
}

export default ConsoleLayout;

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
