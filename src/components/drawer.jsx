'use client'

import React from 'react'
import { Drawer as AntDrawer, ConfigProvider } from 'antd'
import { createStyles, useTheme } from 'antd-style';

const useStyle = createStyles(({ token }) => ({
  'custom-drawer-body': {
    // background: token.blue1,
  },
  'custom-drawer-mask': {
    // boxShadow: `inset 0 0 15px #fff`,
  },
  'custom-drawer-header': {
    // background: token.green1,
    background: "#2D3E51",
    color: "white",
  },
  // 'my-drawer-footer': {
  //   color: token.colorPrimary,
  // },
  'custom-drawer-content': {
    // borderLeft: '2px dotted #333',
  },
}));


export function Drawer(props){
  const { styles } = useStyle();
  const token = useTheme();

  const classNames = {
    body: styles['custom-drawer-body'],
    mask: styles['custom-drawer-mask'],
    header: styles['custom-drawer-header'],
    // footer: styles['custom-drawer-footer'],
    content: styles['custom-drawer-content'],
  };

  const drawerStyles = {
    mask: {
      backdropFilter: 'blur(2px)',
    },
    content: {
      // boxShadow: '-10px 0 10px #666',
    },
    header: {
      color: "white",
      // borderBottom: `1px solid ${token.colorPrimary}`,
    },
    body: {
      fontSize: token.fontSizeLG,
    },
    // footer: {
    //   borderTop: `1px solid ${token.colorBorder}`,
    // },
  };


  return (<ConfigProvider
    drawer={{
      classNames,
      styles: drawerStyles,
    }}
  >
    <AntDrawer {...props} />
  </ConfigProvider>)
}

export function DrawerFooter({ children }) {
  return (
      <div style={{ border: "0px solid black", position: "absolute", bottom: 0, left: 0, width: "100%", backgroundColor: "#FFFFFF", padding: "10px 20px" }}>
          {children}
      </div>
  )
}
