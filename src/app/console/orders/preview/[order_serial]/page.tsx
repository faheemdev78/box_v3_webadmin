'use client'

import { useEffect } from 'react';
import { Alert } from 'antd';
import { useParams, useRouter } from 'next/navigation';
import { useLazyQuery } from '@apollo/client/react';
import { Loader } from '@/components';
import { adminRoot } from '@/configs';
import { catchApolloError, checkApolloRequestErrors } from '@/lib/utill_apollo';
import ORDER from '@/graphql/order/getOrignalOrder.graphql';

function OrderPreviewRedirectPage() {
  const router = useRouter();
  const { order_serial } = useParams();
  const [getOrignalOrder, { called, loading, data, error }] = useLazyQuery<any>(ORDER, { fetchPolicy: 'network-only' });

  useEffect(() => {
    if (!order_serial || called) return;

    const orderIdentifier = Array.isArray(order_serial) ? order_serial[0] : order_serial;
    getOrignalOrder({
      variables: {
        filter: JSON.stringify({
          $or: [
            { serial: orderIdentifier },
            { _id: orderIdentifier },
          ],
        }),
      },
    })
      .then((r) => checkApolloRequestErrors({
        results: r,
        allowEmpty: false,
        parseReturn: (rr: { data?: { order?: any } }) => rr?.data?.order,
      }))
      .catch(catchApolloError);
  }, [order_serial, called, getOrignalOrder]);

  useEffect(() => {
    const order = data?.order;
    const orderIdentifier = Array.isArray(order_serial) ? order_serial[0] : order_serial;

    if (!order || !orderIdentifier) return;
    const storeId = order?.store?._id || order?._id_store;
    if (!storeId) return;

    router.replace(`${adminRoot}/store/${storeId}/orders/preview/${orderIdentifier}`);
  }, [data, order_serial, router]);

  if (loading || !called) return <Loader loading={true} />;

  if (error) {
    return <Alert type="error" showIcon message="Unable to open order preview" description={error.message} />;
  }

  if (!data?.order) {
    return <Alert type="error" showIcon message="Order not found" description="Unable to resolve store for this order." />;
  }

  return <Loader loading={true} />;
}

export default OrderPreviewRedirectPage;
