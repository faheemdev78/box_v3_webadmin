'use client'

import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types';
import { Popconfirm, Alert, message, Row, Col, Divider, Radio, Modal, Space, Tag } from 'antd';
import { useMutation, useLazyQuery } from '@apollo/client';
import { __error } from '@_/lib/consoleHelper';
import { Table, Loader, Button, Avatar, DataGrid, Icon, IconButton, DeleteButton } from '@_/components';
import { ProductBarcodeFilter, ProductGridItem, ProductFilter } from './components'
import Link from 'next/link';
import { adminRoot } from '@_/configs';
import { useRouter } from 'next/navigation';
import security from '@_/lib/security';
import { PageHeader } from '@_/template';
import { Page } from '@_/template/page';
import { useDispatch, useSelector } from 'react-redux';

import RECORD_DELETE from '@_/graphql/product/deleteProduct.graphql'

const defaultProps = {
  pageView: "list",
  columns: ['title', 'variations_count', 'barcode', 'status', 'actions']
};


export const ProductsList = ({ pagination, parseEditLink, pageView = defaultProps.pageView, columns = defaultProps.columns, loading, filter, dataSource, fetchData, busy, setBusy, searchFilterConfig, ...props }) => {
  const router = useRouter()
  const session = useSelector((state) => state.session);

  const [deleteProduct, deleteProduct_results] = useMutation(RECORD_DELETE); // { data, loading, error }

  const changeView = (to) => setState({ ...state, pageView: to });

  const handleDelete = async (_id) => {
    setBusy(true)

    let resutls = await deleteProduct({ variables: { _id } })
      .then(r => (r?.data?.deleteProduct))
      .catch(error => {
        console.log(__error("ERROR"), error);
        return { error: { message:"Unable to delete record"}}
      })

    setBusy(false)
    if (resutls && resutls.error){
      message.error((resutls && resutls?.error?.message) || "Invalid response!")
      return false;
    }

    message.success("Deleted");
    handleTableChange(pagination);
  }

  const handleTableChange = (pagination, filters, sorter) => {
    fetchData({
      pagination:{
        pageSize: pagination.pageSize,
        current: pagination.page,
      }
    })
  };

  const renderGridItem = React.forwardRef((args, ref) => {
    return <ProductGridItem {...args}
      onEditClick={(record) => router.push(`${adminRoot}/product/${record._id}/view`)}
      onDeleteClick={handleDelete}
    />
  })

  // if (status=='loading') return <Loader loading={true} />

  const canDelete = security.verifyRole('104.5', session.user.permissions);
  const isStoreUser = !!(session?.user?.store?._id);

  const _columns = [
    // { title: 'ID', dataIndex: '_id', key:'_id', width: 80, align: 'left' },
    { title: 'Name', dataIndex: 'title', key:'title', render: (text, record) => {
        return (<Row gutter={16}>
          <Col><Avatar size={40} shape="square" src={record?.picture?.thumbnails ? `${process.env.NEXT_PUBLIC_CDN_ASSETS}/${record?.picture?.thumbnails[0]}` : null} icon={<Icon icon="image" />} /></Col>
          <Col>
            <Link href={parseEditLink ? parseEditLink(record) : `${adminRoot}/product/${record._id}/view`}>{record.title}</Link>
            <div style={{ fontSize: "0.9em", color: "#AAA" }}>ID: {record._id}</div>
          </Col>
        </Row>)
      }
    },
    { title: 'Barcode', dataIndex: 'barcode', key:'barcode', align: 'left', width: 250 },
    { title: 'Variations', dataIndex: 'variations_count', key:'variations_count', width: 80, align: 'center' },
    { title: 'Price', dataIndex: ['store', 'price'], key:'store_price', width: 80, align: 'center' },
    { title: 'Qty', dataIndex: ['store', 'available_qty'], key:'store_qty', width: 80, align: 'center' },
    { title: 'Reserved', dataIndex: ['store', 'reserved_qty'], key:'store_reserved_qty', width: 80, align: 'center' },
    { title: 'Global Status', dataIndex: 'status', key:'status', width: 100, align: 'center', render: (txt, rec) => (<Tag color={txt == 'online' ? 'green' : 'red'}>{txt}</Tag>) },
    { title: 'Store Status', dataIndex: ['store', 'status'], key:'store_status', width: 100, align: 'center', render: (txt, rec) => (<Tag color={txt == 'online' ? 'green' : 'red'}>{txt}</Tag>) },
    {
      title: 'Actions', dataIndex: 'actions', key:'actions', align: 'right', width: 100,
      render: (text, record) => {
        return (<Space>
          {/* <IconButton onClick={() => props.onEditRecord(record)} icon="pen" /> */}
          {/* <IconButton onClick={() => router.push(`${adminRoot}/product/${record._id}/view`)} icon="pen" /> */}
          {canDelete && <DeleteButton disabled={(record.variations_count > 0)} onClick={() => handleDelete(record._id)} />}
        </Space>)
      },
    },
  ].filter(o => (columns.includes(o.key)));


  return (<>
    <PageHeader 
      title={<>{props.title || "Product Catalogue"} {props.titlePostfix}</>}
      sub={<div>{pagination ? `Total ${pagination.total || 0} records found` : null}</div>}
      ><>
        <Space split="|">
          {!props.hideAddProduct && <Button type="link" color="orange"><Link href={`${adminRoot}/product/new`}>Add New Product</Link></Button>}
          <Radio.Group size="small" value={pageView} buttonStyle="solid" onChange={({ target }) => changeView(target.value)}>
            <Radio.Button value="list"><Icon icon='th-list' /></Radio.Button>
            <Radio.Button disabled value="grid"><Icon icon='th-large' /></Radio.Button>
          </Radio.Group>
        </Space>
      </>
    </PageHeader>

    {/* {!(props.hideListHeader === true) && <ListHeader
      title={<>{props.title || "Product Catalogue"} {props.titlePostfix}</>}
      sub={pagination ? `Total ${pagination.total || 0} records found` : null}
      right={<Space split="|">
          {!props.hideAddProduct && <>
            <Link href={`${adminRoot}/product/new`}>Add New Product</Link>
          </>}
          <Radio.Group size="small" value={pageView} buttonStyle="solid" onChange={({ target }) => changeView(target.value)}>
            <Radio.Button value="list"><Icon icon='th-list' /></Radio.Button>
            <Radio.Button disabled value="grid"><Icon icon='th-large' /></Radio.Button>
          </Radio.Group>
      </Space>}
    />} */}

    <Page>
      {!(searchFilterConfig && searchFilterConfig.hide===true) && <Row>
        <Col flex="auto">
          <ProductFilter exclude={props?.searchFilterConfig?.exclude} onChange={fetchData} defaultValue={filter} />
        </Col>
        <Col flex="350px" style={{ paddingLeft: 20 }}>
          <ProductBarcodeFilter onEditClick={(record) => router.push(`${adminRoot}/product/${record._id}/view`)} />
        </Col>
      </Row>}

      {pageView == "grid" && <>
        <DataGrid
          // debug={true}
          loading={busy}
          GridItem={renderGridItem}
          dataSource={dataSource || null}
          total={(pagination && pagination.total) || 0}
          pageSize={(pagination && pagination.pageSize)}
          current={(pagination && pagination.current) || 1}
          onChange={handleTableChange}
        />
      </>}

      {pageView == "list" && <Table bordered
        loading={loading || busy}
        columns={_columns}
        dataSource={dataSource || null}
        total={(pagination && pagination.total) || 0}
        pagination={pagination || false}
        pageSize={(pagination && pagination.pageSize)}
        current={(pagination && pagination.current) || 1}
        rowClassName={(record => {
          return record.status == 'offline' ? 'disabled-table-row' : "";
        })}
        onChange={({ current, pageSize }) => handleTableChange({page: current, pageSize })}
      />}
    </Page>

  </>)

}
// ProductsList.defaultProps = {
//   pageView: "list",
//   columns: ['title', 'variations_count', 'barcode', 'price', 'available_qty', 'reserved_for_order', 'status', 'actions']
// };
ProductsList.propTypes = {
  pagination: PropTypes.shape({
    defaultCurrent: PropTypes.number,
    current: PropTypes.number,
    defaultPageSize: PropTypes.number,
    pageSize: PropTypes.number,
    pageSizeOptions: PropTypes.arrayOf(PropTypes.number),
    hideOnSinglePage: PropTypes.bool,
    responsive: PropTypes.bool,
    showLessItems: PropTypes.bool,
    showQuickJumper: PropTypes.bool,
    showSizeChanger: PropTypes.bool,
    showTitle: PropTypes.bool,
    size: PropTypes.number,
    total: PropTypes.number,
  }),
  pageView: PropTypes.string,
  filter: PropTypes.object,
  data: PropTypes.array,
  fetchData: PropTypes.func,
  setBusy: PropTypes.func,
  busy: PropTypes.bool,
  columns: PropTypes.arrayOf(PropTypes.string),
  hideListHeader: PropTypes.bool,
  parseEditLink: PropTypes.func,
  searchFilterConfig: PropTypes.shape({
    exclude: PropTypes.array,
    hide: PropTypes.bool,
  })
}

export default ProductsList;
