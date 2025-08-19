'use client'
import React from 'react'
import { Col, Row, Space } from 'antd'
import { Button } from '@_/components'
import { signOut } from 'next-auth/react'



export default function ComposerHeader({ title = null, onBackPress, right }) {
  return (<>
      <div style={{ backgroundColor: "#2D3E51", height: "45px", overflow: "hidden", display: "block", padding:"5px" }}>
          <Row align="middle">
              <Col span={8}>{onBackPress && <Button onClick={onBackPress} size="small">Back</Button>}</Col>
              <Col span={8} align="center" style={{ color:"white" }}>{title}</Col>
              <Col span={8} align="right">
                <Space>
                    <div id="composer-header-right" />
                    {/* {right} */}
                    <Button size="small" onClick={() => signOut({ callbackUrl: "/auth/signin" })}>Sign Out</Button>
                  </Space>
            </Col>
          </Row>
      </div>

  </>)
}
