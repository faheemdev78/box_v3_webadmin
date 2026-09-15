'use client';

import { ListyItem, ListyItemMeta } from '@/components/ListyItem';
import { CustomerWrapper } from '@/modules/customers';
import { Alert, Card, Col, Divider, Row, Table, Tag, Statistic, Listy, Timeline, Descriptions, Space, Button } from 'antd';
import { EnvironmentOutlined } from '@ant-design/icons';
import Link from 'next/link';

// Dummy Data
const DUMMY_ADDRESSES = [
    {
        _id: 'addr_1',
        label: 'Home',
        address_line1: '123 Main Street',
        address_line2: 'Apt 4B',
        city: 'San Francisco',
        state: 'CA',
        zip: '94102',
        country: 'USA',
        is_default: true,
        coordinates: { lat: 37.7749, lng: -122.4194 }
    },
    {
        _id: 'addr_2',
        label: 'Office',
        address_line1: '456 Market Street',
        address_line2: 'Suite 200',
        city: 'San Francisco',
        state: 'CA',
        zip: '94105',
        country: 'USA',
        is_default: false,
        coordinates: { lat: 37.7849, lng: -122.4094 }
    },
    {
        _id: 'addr_3',
        label: 'Parents House',
        address_line1: '789 Oak Avenue',
        address_line2: '',
        city: 'Oakland',
        state: 'CA',
        zip: '94612',
        country: 'USA',
        is_default: false,
        coordinates: { lat: 37.8044, lng: -122.2712 }
    }
];



function Addresses({ user, session, refresh }: { user: any; session: any; refresh: () => void }) {
    if (!session || !session?.user?._id) return <Alert title="Error" description="Invalid user session" showIcon type='error' />

    return (<>

        <Card title="Delivery Addresses" variant='outlined' style={{ marginTop: 16 }}>
            <Listy
                styles={{ item: { paddingInline: 0 } }}
                items={DUMMY_ADDRESSES}
                rowKey="_id"
                itemRender={(address: any) => (
                    <ListyItem
                        key={address._id || address.label}
                        actions={[
                            <span key="default">{address.is_default ? <Tag color="blue">Default</Tag> : <a>Set Default</a>}</span>,
                            <a key="edit">Edit</a>,
                            <a key="delete" style={{ color: 'red' }}>Delete</a>
                        ]}
                    >
                        <ListyItemMeta
                            avatar={<EnvironmentOutlined style={{ fontSize: 24 }} />}
                            title={<strong>{address.label}</strong>}
                            description={
                                <>
                                    <div>{address.address_line1}</div>
                                    {address.address_line2 && <div>{address.address_line2}</div>}
                                    <div>{address.city}, {address.state} {address.zip}</div>
                                    <div>{address.country}</div>
                                </>
                            }
                        />
                    </ListyItem>
                )}
            />
        </Card>

    </>)
}

export default function AddressesClient() {
    return (
        <CustomerWrapper
            render={({ user, session, refresh }: { user: any; session: any; refresh: () => void }) => (
                <Addresses user={user} session={session} refresh={refresh} />
            )}
        />
    );
}
