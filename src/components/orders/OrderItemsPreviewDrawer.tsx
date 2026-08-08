'use client'

import { useEffect, useState } from 'react'
import { useLazyQuery } from '@apollo/client/react'
import { Alert, Space, Typography } from 'antd'
import Link from 'next/link'
import { Drawer } from '@/components/drawer'
import { IconButton } from '@/components/button'
import { Loader } from '@/components/loader'
import { OrderItemsTable } from './OrderItemsTable'
import { catchApolloError, checkApolloRequestErrors } from '@/lib/utill_apollo'
import { adminRoot } from '@/configs'
import ORDER from '@/graphql/order/getOrignalOrder.graphql'

const { Text } = Typography

type OrderItemsPreviewDrawerProps = {
  open: boolean
  onClose: () => void
  orderSerial?: string | null
  orderId?: string | null
  storeId?: string | null
}

export function OrderItemsPreviewDrawer({
  open,
  onClose,
  orderSerial,
  orderId,
  storeId,
}: OrderItemsPreviewDrawerProps) {
  const [error, setError] = useState<string | null>(null)
  const [order, setOrder] = useState<any>(null)
  const [getOrignalOrder, { loading }] = useLazyQuery<any>(ORDER, { fetchPolicy: 'network-only' })

  useEffect(() => {
    if (!open || (!orderSerial && !orderId)) return

    let cancelled = false
    ;(async () => {
      setError(null)
      setOrder(null)

      const orFilters: any[] = []
      if (orderSerial) orFilters.push({ serial: orderSerial })
      if (orderId) orFilters.push({ _id: orderId })

      const results = await getOrignalOrder({
        variables: {
          filter: JSON.stringify({ $or: orFilters }),
        },
      })
        .then((r) => checkApolloRequestErrors({
          results: r,
          allowEmpty: false,
          parseReturn: (rr: { data?: { order?: any } }) => rr?.data?.order,
        }))
        .catch(catchApolloError)

      if (cancelled) return

      if (results?.error) {
        setError(results.error.message || 'Failed to load order items')
        return
      }

      setOrder(results)
    })()

    return () => {
      cancelled = true
    }
  }, [open, orderSerial, orderId, getOrignalOrder])

  const originalOrder = order?.original_order
  const items = originalOrder?.items || []
  const totals = originalOrder?.totals || order?.current_order?.totals || null
  const resolvedStoreId = storeId || order?.store?._id
  const detailsHref = order?.serial
    ? (resolvedStoreId
      ? `${adminRoot}/store/${resolvedStoreId}/orders/preview/${order.serial}`
      : `${adminRoot}/orders/preview/${order.serial}`)
    : null

  return (
    <Drawer
      title={
        <Space>
          <span>Order Items{orderSerial ? ` — ${orderSerial}` : ''}</span>
          {detailsHref && (
            <Link href={detailsHref} style={{ fontSize: 13, fontWeight: 400 }}>
              Open full details
            </Link>
          )}
        </Space>
      }
      placement="right"
      size={980}
      open={open}
      onClose={onClose}
      destroyOnHidden
    >
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
      {loading && <Loader loading={true}>Loading order items...</Loader>}
      {!loading && !error && order && (
        <>
          <div style={{ marginBottom: 12 }}>
            <Text type="secondary">
              {items.length} item{items.length === 1 ? '' : 's'}
              {order?.customer?.name ? ` · ${order.customer.name}` : ''}
            </Text>
          </div>
          <OrderItemsTable items={items} totals={totals} />
        </>
      )}
    </Drawer>
  )
}

type OrderItemsPreviewButtonProps = {
  order?: any
  orderSerial?: string
  orderId?: string
  storeId?: string
  size?: 'small' | 'middle' | 'large'
}

export function OrderItemsPreviewButton({
  order,
  orderSerial,
  orderId,
  storeId,
  size = 'small',
}: OrderItemsPreviewButtonProps) {
  const [open, setOpen] = useState(false)
  const serial = orderSerial || order?.serial
  const id = orderId || order?._id
  const resolvedStoreId = storeId || order?.store?._id || order?._id_store

  if (!serial && !id) return null

  return (
    <>
      <IconButton
        size={size}
        icon="eye"
        onClick={() => setOpen(true)}
        tooltip="Preview order items"
      />
      <OrderItemsPreviewDrawer
        open={open}
        onClose={() => setOpen(false)}
        orderSerial={serial}
        orderId={id}
        storeId={resolvedStoreId}
      />
    </>
  )
}

export default OrderItemsPreviewDrawer
