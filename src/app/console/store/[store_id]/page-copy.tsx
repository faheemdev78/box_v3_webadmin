'use client'

import { __error } from '@/lib/consoleHelper';
import { Alert, Col, Divider, Row, Space } from 'antd';
import { Button, DevBlock, Loader, StatusTag, usePageProps } from '@/components';
import StoreWrapper from '@/modules/store/storeWrapper';
import { Page } from '@/template/page';
import Card from 'antd/es/card/Card';
import { PageHeader } from '@/template';
import { publishStatus } from '@/configs';


interface StoreHome_Props {
  store: any;
  onStatusUpdate?: (values: any) => Promise<string | undefined>;
}

function StoreHome({ store, onStatusUpdate }: StoreHome_Props) {
  const pageProps = usePageProps() as any


  return (<>
    <PageHeader title={store.title} 
        sub={<>
            <StatusTag value={store.status} editable={true} options={publishStatus} onSubmit={onStatusUpdate || (async() => store.status)} />
            <div>{store.code}</div>
        </>}
      >            
    </PageHeader>


    <Page>
      <Card>
        <Row>
          <Col span={12}><b>Address: </b><span>{store.address}, {store.location.title}</span></Col>
          <Col span={12} style={{ textAlign: "right" }}><b>Location:</b> {JSON.stringify(store?.center?.coordinates)}</Col>
        </Row>

        {store?.description?.length > 0 && <div>
          <h3>Description</h3>
          {store?.description?.map((item: any, i: number) => (<p key={i}>{item}</p>))}
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

function Wrapper(props: any){
  return (<StoreWrapper {...props} render={({ store, onStatusUpdate }: { store: any; onStatusUpdate: any }) => (<StoreHome onStatusUpdate={onStatusUpdate} store={store} {...props} />)} />)
}

export default Wrapper;
