'use client'

import React, { ReactNode } from 'react'; 
import { Card, Space, Typography } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Button } from '@/components';

const { Title, Text } = Typography;


export function ErrorComp({ title, description, buttons }: { title:string, description:string, buttons?:ReactNode }){
  return (<div style={{ textAlign: 'center', padding: '100px 0' }}><Card><Space orientation="vertical">
    <ExclamationCircleOutlined style={{ fontSize: 48, color: '#ff4d4f' }} />
    <Title level={4}>{title}</Title>
    <Text>{description}</Text>
    <Space>
      <Button onClick={() => window.location.reload()}>Reload Page</Button>
      {buttons}
      {/* <Button type="primary" onClick={() => router.push(`${adminRoot}/store/${store_id}/till-verification`)}>Back to Queue</Button> */}
    </Space>
  </Space></Card></div>)
}
