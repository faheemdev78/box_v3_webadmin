'use client'

import React, { useState, useEffect } from 'react'
import { __error } from '@_/lib/consoleHelper';
import { Alert, Col, Divider, Row, Space } from 'antd';
import { Button, DevBlock, Loader, StatusTag, usePageProps } from '@_/components';
import StoreWrapper from '@/modules/store/storeWrapper';
import { Page } from '@_/template/page';
import Card from 'antd/es/card/Card';
import { PageHeader } from '@_/template';
import { publishStatus } from '@_/configs';


interface StoreHome_Props {
  // children: React.ReactNode;
  store: object;
  onStatusUpdate?: Function;
}

function StoreHome({ store, onStatusUpdate }: StoreHome_Props) {

  const pageProps = usePageProps()
  console.log("pageProps: ", pageProps)


  return (<>
    <PageHeader title={store.title} 
        sub={<>
            <StatusTag value={store.status} editable={true} options={publishStatus} onSubmit={onStatusUpdate} />
            <div>{store.code}</div>
        </>}
      >            
    </PageHeader>


    <Page>
      <Card>
        <Row>
          <Col span={12}><b>Address: </b><span>{store.address}, {store.location.title}</span></Col>
          <Col span={12} align="right"><b>Location:</b> {JSON.stringify(store?.center?.coordinates)}</Col>
        </Row>

        {store?.description?.length > 0 && <div>
          <h3>Description</h3>
          {store?.description?.map((item, i) => (<p key={i}>{item}</p>))}
        </div>}

        <Divider>SEO Info</Divider>
        <Row gutter={[10, 10]}>
          <Col>Slug: {store.slug}</Col>
          <Col>seo_title: {store.seo_title}</Col>
          <Col>seo_desc: {store.seo_desc}</Col>
          <Col>img_thumb: {store.img_thumb}</Col>
        </Row>

      </Card>
    </Page>

    {/* <DevBlock obj={store} title="Store" /> */}

  </>)
}

export default function Wrapper(props){
  return (<StoreWrapper {...props} render={({ store, onStatusUpdate }) => (<StoreHome onStatusUpdate={onStatusUpdate} store={store} {...props} />)} />)
}
