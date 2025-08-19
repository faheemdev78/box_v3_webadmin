'use client'

import React, { useState, useEffect } from 'react'
import Link from "next/link";
import LoginButton from './loginButton';
import { getSessionToken } from "@_/lib/auth";
import { Space } from 'antd';
import { adminRoot } from '@_/configs';

export function TopNav(props) {
  let token = getSessionToken();
  const [loggedin, setLoggedin] = useState(null)

  useEffect(() => {
    if (token && token.length > 1){
      setLoggedin(true);
    }
  }, [token])

  
  return (<>

    <Space direction="horizontal" className='width-100' split="|">
      <LoginButton />
      {(loggedin) && <>
        <Link href={`/`}>Home</Link>
        <Link href={`${adminRoot}`}>Console</Link>
      </>}
    </Space>


  </>)  

}

export default TopNav;