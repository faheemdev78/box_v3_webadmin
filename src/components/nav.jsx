'use client'

import React, { useState, useEffect } from 'react'
import Link from "next/link";
import LoginButton from './loginButton';
import { getSessionToken } from "@/lib/auth";
import { Space } from 'antd';
import { adminRoot } from '@/configs';

function TopNav(props) {
  let token = getSessionToken();
  const [loggedin, setLoggedin] = useState<boolean>(false)

  useEffect(() => {
    if (token && token.length > 1){
      setLoggedin(true);
    }
  }, [token, setLoggedin])

  
  return (<>
    <Space orientation="horizontal" className='width-100' separator="|">
      <LoginButton />
      {(loggedin) && <>
        <Link href={`/`}>Home</Link>
        <Link href={`${adminRoot}`}>Console</Link>
      </>}
    </Space>
  </>)  

}

export { TopNav }

export default TopNav;