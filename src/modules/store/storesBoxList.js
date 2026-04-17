'use client'
import React, { useState, useEffect } from 'react'
import { useMutation, useLazyQuery } from '@apollo/client/react';
import { Alert, Col, message, Popconfirm, Row, Space, Card } from 'antd';
import { EditOutlined, EllipsisOutlined, SettingOutlined } from '@ant-design/icons';
import { Button, IconButton, Loader, PageHeading, StatusTag, Table } from '@/components';
import { adminRoot, defaultPageSize } from '@/configs';
// import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { catchApolloError, checkApolloRequestErrors } from '@/lib/utill_apollo';

import LIST_DATA from '@/graphql/stores/stores.graphql'

const { Meta } = Card;


function StoresBoxList(props) {
    const [error, setError] = useState(false)

    const [get_stores, { called, loading, data }] = useLazyQuery(LIST_DATA, { fetchPolicy: "no-cache" });

    const fetchData = async (args = {}) => {
        const results = await get_stores({
            variables: {
                // filter: JSON.stringify({ status: "online" }),
                others: JSON.stringify({})
            }
        })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr) => rr?.data?.stores }))
            .catch(catchApolloError)


        if (results && results.error) {
            setError((results && results?.error?.message) || "No records found!")
            return false;
        }

        return results;
    }

    useEffect(() => {
        if (called || loading) return;
        fetchData()
        
    }, [props])

    if (loading) return <Loader loading={true}>Fetching online stores...</Loader>

    return (<>
        {(error || !data || !data?.stores[0]?._id) && <Alert title="Error" description={error || "No stores available"} tyoe="error" showIcon />}

        <Row>
            <Col flex="auto"><PageHeading>Stores</PageHeading></Col>
            <Col>
                <Space separator="|">
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

export default StoresBoxList
