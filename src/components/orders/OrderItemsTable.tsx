'use client'

import { Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Avatar } from '@/components/avatar'
import { Icon } from '@/components/icon'
import { ProductItemFlags } from '@/components/ProductItemFlags'
import { useAppSelector } from '@/rStore/hooks'
import { getSettings } from '@/rStore/slices/systemSlice'

const { Text, Title } = Typography

type OrderItemsTableProps = {
  items?: any[] | null
  totals?: any | null
  size?: 'small' | 'middle' | 'large'
  showCardWrapper?: boolean
}

export function OrderItemsTable({
  items = [],
  totals = null,
  size = 'small',
}: OrderItemsTableProps) {
  const settings = useAppSelector(getSettings)

  const formatCurrency = (amount: number) => {
    const safeAmount = Number(amount) || 0
    return `${settings?.currency || 'RS'} ${safeAmount.toFixed(2)}`
  }

  const itemColumns: ColumnsType<any> = [
    {
      title: '#',
      width: 50,
      render: (_: unknown, __: unknown, index: number) => index + 1,
    },
    {
      title: 'Product',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: any) => {
        const thumb = record?.picture?.thumbnails?.[0]
          ? `${process.env.NEXT_PUBLIC_CDN_URL}/${record.picture.thumbnails[0]}`
          : null

        return (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <Avatar size={48} shape="square" src={thumb} icon={<Icon icon="image" />} />
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <strong>{title}</strong>
                <ProductItemFlags item={record} variant="icons" />
              </div>
              {record.barcode && (
                <Text type="secondary" style={{ fontSize: 12 }}>Barcode: {record.barcode}</Text>
              )}
              {record.store_at_order != null && record.store_at_order.available_qty !== undefined && (
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Qty at order time: {record.store_at_order.available_qty}
                    {record.store_at_order.reserved_qty != null
                      ? ` (reserved ${record.store_at_order.reserved_qty})`
                      : ''}
                  </Text>
                </div>
              )}
              {record.categories?.length > 0 && (
                <div style={{ marginTop: 4 }}>
                  {record.categories.map((cat: { _id: string; title: string }, idx: number) => (
                    <Tag key={idx} color="blue" style={{ fontSize: 11 }}>{cat?.title || ''}</Tag>
                  ))}
                </div>
              )}
              {record.attributes?.length > 0 && (
                <div style={{ marginTop: 4 }}>
                  {record.attributes.map((attr: { name?: string; value?: string; title?: string; val?: string }, idx: number) => (
                    <Tag key={idx} style={{ fontSize: 11 }}>
                      {attr?.name || attr?.title || ''}: {attr?.value || attr?.val || ''}
                    </Tag>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      },
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      align: 'right',
      render: (price: number, record: any) => (
        <div>
          {record.price_was && record.price_was > price && (
            <div>
              <Text delete type="secondary" style={{ fontSize: 12 }}>{formatCurrency(record.price_was)}</Text>
            </div>
          )}
          <div><strong>{formatCurrency(price)}</strong></div>
        </div>
      ),
    },
    {
      title: 'Qty',
      dataIndex: 'qty',
      key: 'qty',
      width: 70,
      align: 'center',
      render: (qty: number) => <strong>{qty}</strong>,
    },
    {
      title: 'Subtotal',
      dataIndex: 'subtotal',
      key: 'subtotal',
      width: 100,
      align: 'right',
      render: (subtotal: number) => <strong>{formatCurrency(subtotal)}</strong>,
    },
    {
      title: 'Tax',
      dataIndex: 'tax_amount',
      key: 'tax_amount',
      width: 100,
      align: 'right',
      render: (tax_amount: number, record: any) => (
        <div>
          <div>{formatCurrency(tax_amount)}</div>
          {record.tax && (
            <Text type="secondary" style={{ fontSize: 11 }}>
              {record.tax.type} @ {record.tax.rate}%
            </Text>
          )}
        </div>
      ),
    },
    {
      title: 'Discount',
      dataIndex: 'discount_amount',
      key: 'discount_amount',
      width: 100,
      align: 'right',
      render: (discount_amount: number, record: any) => (
        <div>
          {discount_amount > 0 ? (
            <>
              <div style={{ color: '#52c41a' }}>-{formatCurrency(discount_amount)}</div>
              {record.vouchers?.length > 0 && (
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {record.vouchers.map((v: { title: string }) => v.title).join(', ')}
                </Text>
              )}
            </>
          ) : (
            <Text type="secondary">-</Text>
          )}
        </div>
      ),
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      width: 120,
      align: 'right',
      render: (total: number) => <strong style={{ fontSize: 15 }}>{formatCurrency(total)}</strong>,
    },
  ]

  const rows = items || []
  const summaryTotals = totals || {}

  return (
    <Table
      columns={itemColumns}
      dataSource={rows}
      rowKey={(record) => String(record._id_product || record.barcode || record.title)}
      pagination={false}
      size={size}
      bordered
      scroll={{ x: 900 }}
      summary={() => (
        <Table.Summary.Row>
          <Table.Summary.Cell index={0} colSpan={2} align="right">You Saved</Table.Summary.Cell>
          <Table.Summary.Cell index={1} align="right">
            <Text style={{ color: '#52c41a' }}>-{formatCurrency(summaryTotals.saved || 0)}</Text>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={2} align="center">{summaryTotals?.totalQuantity || 0}</Table.Summary.Cell>
          <Table.Summary.Cell index={3} align="right">{formatCurrency(summaryTotals?.subtotal || 0)}</Table.Summary.Cell>
          <Table.Summary.Cell index={4} align="right">{summaryTotals?.taxRate || 0}%</Table.Summary.Cell>
          <Table.Summary.Cell index={5} align="right">
            {summaryTotals?.discountTotal > 0 && (
              <Text style={{ color: '#52c41a' }}>-{formatCurrency(summaryTotals.discountTotal)}</Text>
            )}
          </Table.Summary.Cell>
          <Table.Summary.Cell index={6} align="right">
            <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
              {formatCurrency(summaryTotals?.grandTotal || 0)}
            </Title>
          </Table.Summary.Cell>
        </Table.Summary.Row>
      )}
    />
  )
}

export default OrderItemsTable
