'use client'

import React from 'react'
import { Drawer as AntDrawer, ConfigProvider, DrawerProps } from 'antd'
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

type LegacyDrawerProps = DrawerProps & {
  /** @deprecated Use `size` instead (Ant Design 6). Mapped automatically by this wrapper. */
  width?: DrawerProps['width']
  /** @deprecated Use `size` instead (Ant Design 6). Mapped automatically by this wrapper. */
  height?: DrawerProps['height']
}

/**
 * App Drawer wrapper.
 * Ant Design 6 deprecated Drawer `width`/`height` in favor of `size`.
 * This wrapper accepts legacy props and forwards only `size` to AntDrawer.
 */
export function Drawer(props: LegacyDrawerProps){
  const { styles } = useStyle();
  const token = useTheme();
  const { width, height, size, classNames: propClassNames, ...rest } = props;

  // Prefer explicit size; fall back to legacy width/height so call sites keep working.
  const resolvedSize = size ?? width ?? height;

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
    // header: {
    //   color: "white",
    //   backgroundColor: "red",
    //   // borderBottom: `1px solid ${token.colorPrimary}`,
    // },
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
    <AntDrawer 
      closable={{ placement: 'end' }}
      {...rest}
      {...(resolvedSize !== undefined ? { size: resolvedSize as DrawerProps['size'] } : {})}
      classNames={{
        root: 'custom-drawer',
        mask: 'cd-mask',
        section: 'cd-section',
        header: 'cd-header',
        title: 'cd-title',
        extra: 'cd-extra',
        footer: 'cd-footer',
        dragger: 'cd-dragger',
        close: 'cd-close',
        ...propClassNames
      }}
    />
  </ConfigProvider>)
}

export function DrawerFooter({ children }: { children: React.ReactNode }) {
  return (
      <div style={{ border: "0px solid black", position: "absolute", bottom: 0, left: 0, width: "100%", backgroundColor: "#FFFFFF", padding: "10px 20px" }}>
          {children}
      </div>
  )
}
