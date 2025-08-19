'use client'
import React, { useState, useEffect } from 'react'
import { useMutation, useLazyQuery } from '@apollo/client';
import { Alert, Col, message, Popconfirm, Row, Space, Card } from 'antd';
import { EditOutlined, EllipsisOutlined, SettingOutlined } from '@ant-design/icons';
import { Button, IconButton, Loader, PageHeading, StatusTag, Table } from '@_/components';
import { adminRoot, defaultPageSize } from '@_/configs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import LIST_DATA from '@_/graphql/stores/stores.graphql'


const { Meta } = Card;


export default function StoresBoxList(props) {
    const [error, setError] = useState(false)

    const [get_stores, { called, loading, data }] = useLazyQuery(LIST_DATA);

    useEffect(() => {
        if (called || loading) return;
        fetchData()
    }, [props])

    const fetchData = async (args = {}) => {
        const results = await get_stores({
            variables: {
                // filter: JSON.stringify({ status: "online" }),
                others: JSON.stringify({})
            }
        })
            .then(r => (r?.data?.stores))
            .catch(err => {
                console.log(__error("Error: "), err)
                return { error: { message: "Invalid response!" } }
            })

        if (results && results.error) {
            setError((results && results?.error?.message) || "No records found!")
            return false;
        }

        return results;
    }

    if (loading) return <Loader loading={true}>Fetching online stores...</Loader>

    return (<>
        {(error || !data || !data?.stores[0]?._id) && <Alert message={error || "No stores available"} tyoe="error" showIcon />}

        <Row>
            <Col flex="auto"><PageHeading>Stores</PageHeading></Col>
            <Col>
                <Space split="|">
                    <Link href={`${adminRoot}/stores`}>Show All Stores</Link>
                    <Link href={`${adminRoot}/stores/new`}>Add new Store</Link>
                </Space>
            </Col>
        </Row>


        <Row gutter={[20, 20]}>
            {data && data.stores.map((store, i) => {
                return (<Col key={i}>
                    <Card
                        style={{ width: 300 }}
                        cover={<h3>{store.title}</h3>}
                        actions={[
                            <Link href={`${adminRoot}/store/${store._id}`} key='details'>View</Link>,
                            // <SettingOutlined key="setting" />,
                            // <EditOutlined key="edit" />,
                            <EllipsisOutlined key="ellipsis" />,
                        ]}
                    >
                        <div><StatusTag value={store.status} /></div>
                        {/* <Meta
                        avatar={<Avatar src="https://api.dicebear.com/7.x/miniavs/svg?seed=8" />}
                        title="Card title"
                        description="This is the description"
                    /> */}
                    </Card>
                </Col>)
            })}
        </Row>

    </>)

}

