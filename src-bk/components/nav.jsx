'use client'

import React, { useState, useEffect } from 'react'
import Link from "next/link";
import LoginButton from './loginButton';
import { getSessionToken } from "@_/lib/auth";
import { Space } from 'antd';

export function Nav(props) {
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
        <Link href="/">Home</Link>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/server_side">Server Side Page</Link>
        <Link href="/client_side">Client Side Page</Link>
        <Link href="/redux_test">Redux Test</Link>
      </>}
    </Space>


  </>)  

}

export default Nav;