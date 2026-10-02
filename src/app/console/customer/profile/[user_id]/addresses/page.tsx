'use client';

import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';
import { ListyItem, ListyItemMeta } from '@/components/ListyItem';
import { CustomerWrapper } from '@/modules/customers';
import { Alert, Button, Card, Empty, Listy, Space, Tag } from 'antd';
import { EnvironmentOutlined } from '@ant-design/icons';

const CUSTOMER_ADDRESSES = gql`
    query CustomerAddresses($filter: String!) {
        userAddresses(filter: $filter) {
            _id title full_address city { title } delivery_instructions
            geo_point { coordinates } is_default verified error { message }
        }
    }
`;

type Address = {
    _id: string;
    title?: string;
    full_address?: string;
    city?: { title?: string };
    delivery_instructions?: string;
    geo_point?: { coordinates?: number[] };
    is_default?: boolean;
    verified?: boolean;
    error?: { message?: string };
};

function Addresses({ user }: { user: { _id: string } }) {
    const { data, loading, error, refetch } = useQuery<{ userAddresses: Address[] }>(CUSTOMER_ADDRESSES, {
        variables: { filter: JSON.stringify({ _id_user: user._id }) },
        fetchPolicy: 'network-only',
    });
    const addresses = data?.userAddresses || [];
    const errorMessage = error?.message || addresses.find(address => address.error)?.error?.message;

    return (
        <Card title="Delivery Addresses" loading={loading} style={{ marginTop: 16 }}
            extra={<Button onClick={() => { void refetch().catch(() => {}); }} disabled={loading}>Refresh</Button>}>
            {errorMessage ? <Alert title="Unable to load addresses" description={errorMessage} type="error" showIcon />
                : !addresses.length ? <Empty description="No saved addresses" />
                : <Listy styles={{ item: { paddingInline: 0 } }} items={addresses} rowKey="_id"
                    itemRender={(address: Address) => {
                        const coordinates = address.geo_point?.coordinates;
                        const hasPin = coordinates?.length === 2 && coordinates.every(Number.isFinite);
                        return <ListyItem key={address._id}>
                            <ListyItemMeta avatar={<EnvironmentOutlined style={{ fontSize: 24 }} />}
                                title={<Space wrap><strong>{address.title || 'Address'}</strong>
                                    {address.is_default && <Tag color="blue">Default</Tag>}
                                    <Tag color={address.verified ? 'green' : 'default'}>{address.verified ? 'Verified' : 'Not verified'}</Tag>
                                </Space>}
                                description={<>
                                    <div>{address.full_address}</div>
                                    {address.city?.title && <div>{address.city.title}</div>}
                                    {address.delivery_instructions && <div>Delivery instructions: {address.delivery_instructions}</div>}
                                    {hasPin && <a href={`https://www.google.com/maps?q=${coordinates![1]},${coordinates![0]}`} target="_blank" rel="noopener noreferrer">View location on map</a>}
                                </>} />
                        </ListyItem>;
                    }} />}
        </Card>
    );
}

export default function AddressesClient() {
    return <CustomerWrapper render={({ user }) => <Addresses key={user._id} user={user} />} />;
}
