'use client'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useLazyQuery, useMutation } from '@apollo/client/react'
import {
  Alert, Card, Checkbox, DatePicker, Input, InputNumber, Modal, Space, Table, Tag,
  Typography, message, Button as AntButton,
} from 'antd'
import {
  CheckCircleOutlined, ClockCircleOutlined, DollarOutlined, HistoryOutlined,
  ShoppingOutlined, WarningOutlined,
} from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import { PageHeader } from '@/template'
import { Button, Drawer, usePageProps } from '@/components'
import { Page } from '@/template/page'
import { catchApolloError, checkApolloRequestErrors } from '@/lib/utill_apollo'
import { useAppSelector } from '@/rStore/hooks'
import { getSettings } from '@/rStore/slices/systemSlice'

import GET_DRIVERS_WITH_PENDING_SETTLEMENT from '@/graphql/drivers/getDriversWithPendingSettlement.graphql'
import GET_DRIVER_ORDERS from '@/graphql/drivers/getDriverOrders.graphql'
import CLEAR_ORDER from '@/graphql/drivers/clearDriverOrderCollection.graphql'
import CLEAR_ORDERS_BULK from '@/graphql/drivers/clearDriverOrderCollectionBulk.graphql'
import GET_SETTLEMENT_HISTORY from '@/graphql/drivers/getDriverSettlementHistory.graphql'

const { Text } = Typography
const { RangePicker } = DatePicker
const MONEY_EPS = 0.009

type PendingOrder = {
  _id: string
  serial: string
  current_stage: string
  is_cod: boolean
  amount_collected: number
  amount_deposited?: number
  amount_remaining?: number
  cod_deposited?: boolean
  baskets_count: number
  baskets_received?: boolean
  baskets?: Array<{ _id?: string; barcode?: string; title?: string; color?: string }>
  customer?: { _id?: string; name?: string; phone?: string; email?: string }
  pending_clearance?: boolean
}

type DriverSettlement = {
  driver: { _id: string; name: string; phone: string; email: string }
  session?: {
    _id: string
    session_started_at: string
    driver_wallet: {
      total_cod_collected: number
      deposited_amount: number
      pending_deposit: number
      is_settled: boolean
    }
    baskets_assigned: string[]
    baskets_returned: string[]
    all_baskets_returned: boolean
  } | null
  total_cod_collected: number
  deposited_amount: number
  pending_deposit: number
  delivered_orders_count: number
  pending_orders: PendingOrder[]
}

type RowDraft = {
  amount: number
  basketsReceived: boolean
}

function money(currency: string, n: number) {
  return `${currency} ${Number(n || 0).toFixed(2)}`
}

function remainingOf(order: PendingOrder) {
  if (!order.is_cod) return 0
  if (typeof order.amount_remaining === 'number') return Math.max(0, Number(order.amount_remaining))
  return Math.max(0, Number(order.amount_collected || 0) - Number(order.amount_deposited || 0))
}

function willFullyClear(order: PendingOrder, draft: RowDraft) {
  const basketsOk = draft.basketsReceived || !!order.baskets_received
  if (!order.is_cod) return basketsOk
  const cumulative = Number(order.amount_deposited || 0) + Number(draft.amount || 0)
  const collected = Number(order.amount_collected || 0)
  return basketsOk && (collected - cumulative) <= MONEY_EPS
}

function confirmAsync(options: Parameters<typeof Modal.confirm>[0]): Promise<boolean> {
  return new Promise((resolve) => {
    Modal.confirm({
      ...options,
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
    })
  })
}

function DriverSettlements() {
  const settings = useAppSelector(getSettings)
  const currency = settings?.currency || ''
  const { store } = usePageProps() as unknown as { store: any }

  const [drivers, setDrivers] = useState<DriverSettlement[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const [selectedDriver, setSelectedDriver] = useState<DriverSettlement | null>(null)
  const [deliverablesOpen, setDeliverablesOpen] = useState(false)
  const [deliverables, setDeliverables] = useState<PendingOrder[]>([])
  const [deliverablesLoading, setDeliverablesLoading] = useState(false)
  const [sessionMissing, setSessionMissing] = useState(false)
  const [resolvedSessionId, setResolvedSessionId] = useState<string | null>(null)
  const [rowDrafts, setRowDrafts] = useState<Record<string, RowDraft>>({})
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [clearing, setClearing] = useState(false)

  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyDriver, setHistoryDriver] = useState<DriverSettlement | null>(null)
  const [historyRows, setHistoryRows] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyTotal, setHistoryTotal] = useState(0)
  const [historyPage, setHistoryPage] = useState(1)
  const [historySerial, setHistorySerial] = useState('')
  const [historyRange, setHistoryRange] = useState<[Dayjs | null, Dayjs | null] | null>(null)

  const [getDrivers] = useLazyQuery<any>(GET_DRIVERS_WITH_PENDING_SETTLEMENT, { fetchPolicy: 'network-only' })
  const [getDriverOrders] = useLazyQuery<any>(GET_DRIVER_ORDERS, { fetchPolicy: 'network-only' })
  const [getHistory] = useLazyQuery<any>(GET_SETTLEMENT_HISTORY, { fetchPolicy: 'network-only' })
  const [clearOrder] = useMutation<any>(CLEAR_ORDER)
  const [clearOrdersBulk] = useMutation<any>(CLEAR_ORDERS_BULK)

  const fetchDrivers = useCallback(async () => {
    setLoading(true)
    const result = await getDrivers({ variables: { _id_store: store._id } })
      .then((r) => checkApolloRequestErrors({
        results: r,
        allowEmpty: true,
        parseReturn: (rr: any) => rr?.data?.getDriversWithPendingSettlement,
      }))
      .catch(catchApolloError)

    if (result && !result.error) {
      setDrivers(Array.isArray(result) ? result : [])
    } else if (result?.error) {
      message.error(result.error.message || 'Failed to load drivers')
    }
    setLoading(false)
  }, [getDrivers, store._id])

  useEffect(() => {
    fetchDrivers()
  }, [fetchDrivers])

  const loadDeliverables = async (driver: DriverSettlement): Promise<PendingOrder[]> => {
    const result = await getDriverOrders({
      variables: {
        _id_driver: driver.driver._id,
        _id_session: driver.session?._id || undefined,
      },
    })
      .then((r) => checkApolloRequestErrors({
        results: r,
        allowEmpty: true,
        parseReturn: (rr: any) => rr?.data?.getDriverOrders,
      }))
      .catch(catchApolloError)

    if (result && !result.error) {
      const orders: PendingOrder[] = result.orders || []
      const sessionId = result.session?._id || null
      setSessionMissing(!!result.session_missing || !sessionId)
      setResolvedSessionId(sessionId)
      if (sessionId && result.session) {
        setSelectedDriver((prev) => (prev ? {
          ...prev,
          session: result.session,
        } : prev))
      }
      setDeliverables(orders)
      const drafts: Record<string, RowDraft> = {}
      orders.forEach((o) => {
        drafts[o._id] = {
          amount: o.is_cod ? remainingOf(o) : 0,
          basketsReceived: !!o.baskets_received,
        }
      })
      setRowDrafts(drafts)
      return orders
    }

    if (result?.error) {
      message.error(result.error.message || 'Failed to load deliverables')
    }
    setDeliverables([])
    setSessionMissing(true)
    setResolvedSessionId(null)
    return []
  }

  const openDeliverables = async (driver: DriverSettlement) => {
    if (Number(driver.delivered_orders_count || 0) <= 0) {
      message.info('No pending deliverables for this driver')
      return
    }

    setSelectedDriver(driver)
    setDeliverablesOpen(true)
    setSelectedRowKeys([])
    setSessionMissing(false)
    setResolvedSessionId(driver.session?._id || null)
    setDeliverablesLoading(true)
    await loadDeliverables(driver)
    setDeliverablesLoading(false)
  }

  const closeDeliverables = () => {
    setDeliverablesOpen(false)
    setSelectedDriver(null)
    setSelectedRowKeys([])
    setDeliverables([])
    setSessionMissing(false)
    setResolvedSessionId(null)
  }

  const refreshAfterMutation = async (fullyCleared: boolean) => {
    if (!selectedDriver) return
    setDeliverablesLoading(true)
    const orders = await loadDeliverables(selectedDriver)
    setDeliverablesLoading(false)
    await fetchDrivers()

    if (orders.length === 0) {
      const name = selectedDriver.driver.name
      closeDeliverables()
      message.success(`All clear for ${name}`)
    } else if (fullyCleared) {
      // keep drawer open with remaining orders
    }
  }

  const updateDraft = (orderId: string, patch: Partial<RowDraft>) => {
    setRowDrafts((prev) => ({
      ...prev,
      [orderId]: { ...prev[orderId], ...patch },
    }))
  }

  const validateRow = (order: PendingOrder, draft?: RowDraft) => {
    if (!draft) return 'Missing deposit details'
    const basketsOk = draft.basketsReceived || !!order.baskets_received
    if (order.is_cod) {
      if (Number(draft.amount) < 0) return 'Enter a valid deposit amount'
      if (Number(draft.amount) <= 0 && !basketsOk) {
        return 'Enter a deposit amount and/or confirm baskets received'
      }
    } else if (!basketsOk) {
      return 'Confirm baskets received before clearing'
    }
    return null
  }

  const confirmMismatchIfNeeded = async (order: PendingOrder, draft: RowDraft) => {
    if (!order.is_cod) return true
    const prev = Number(order.amount_deposited || 0)
    const thisAmt = Number(draft.amount || 0)
    const cumulative = prev + thisAmt
    const collected = Number(order.amount_collected || 0)
    if (Math.abs(cumulative - collected) <= MONEY_EPS) return true

    return confirmAsync({
      title: 'Deposit amount mismatch',
      okText: 'Continue anyway',
      cancelText: 'Cancel',
      content: (
        <div>
          <p>
            Receivable for #{order.serial}: <strong>{money(currency, collected)}</strong>
          </p>
          <p>Previously deposited: {money(currency, prev)}</p>
          <p>This deposit: {money(currency, thisAmt)}</p>
          <p>
            Cumulative after this: <strong>{money(currency, cumulative)}</strong>
            {' '}(remaining {money(currency, Math.max(0, collected - cumulative))})
          </p>
          <p style={{ marginBottom: 0 }}>
            The order stays open until the full receivable is deposited and baskets are confirmed.
          </p>
        </div>
      ),
    })
  }

  const confirmClearAction = async (order: PendingOrder, draft: RowDraft) => {
    const full = willFullyClear(order, draft)
    return confirmAsync({
      title: full ? 'Clear order' : 'Record deposit',
      okText: full ? 'Clear order' : 'Record',
      cancelText: 'Cancel',
      content: (
        <div>
          <p><strong>Order #{order.serial}</strong> — {order.customer?.name || 'Customer'}</p>
          {order.is_cod ? (
            <>
              <p>Receivable: {money(currency, order.amount_collected)}</p>
              <p>Already deposited: {money(currency, order.amount_deposited || 0)}</p>
              <p>This deposit: {money(currency, draft.amount || 0)}</p>
            </>
          ) : (
            <p>Prepaid — no COD</p>
          )}
          <p>
            Baskets received:{' '}
            {(draft.basketsReceived || order.baskets_received) ? 'Yes' : 'No'}
            {order.baskets_count ? ` (${order.baskets_count})` : ''}
          </p>
          <p style={{ marginBottom: 0 }}>
            {full
              ? 'This will complete the order and remove it from pending clearance.'
              : 'This will log the update; the order stays pending until fully settled.'}
          </p>
        </div>
      ),
    })
  }

  const handleClearOne = async (order: PendingOrder) => {
    if (!selectedDriver?.driver?._id) return
    const draft = rowDrafts[order._id]
    const validationError = validateRow(order, draft)
    if (validationError) {
      message.warning(validationError)
      return
    }

    if (!(await confirmMismatchIfNeeded(order, draft!))) return
    if (!(await confirmClearAction(order, draft!))) return

    setClearing(true)
    const result = await clearOrder({
      variables: {
        input: {
          _id_session: resolvedSessionId || selectedDriver.session?._id || undefined,
          _id_driver: selectedDriver.driver._id,
          _id_order: order._id,
          amount_deposited: order.is_cod ? Number(draft!.amount || 0) : 0,
          baskets_received: !!(draft!.basketsReceived || order.baskets_received),
        },
      },
    })
      .then((r) => checkApolloRequestErrors({
        results: r,
        allowEmpty: false,
        parseReturn: (rr: any) => rr?.data?.clearDriverOrderCollection,
      }))
      .catch(catchApolloError)

    setClearing(false)

    if (result?.success) {
      message.success(result.success.message || `Order #${order.serial} updated`)
      await refreshAfterMutation(!!result.is_fully_cleared)
    } else if (result?.error) {
      message.error(result.error.details || result.error.message || 'Clear failed')
    }
  }

  const handleClearSelected = async () => {
    if (!selectedDriver?.driver?._id || selectedRowKeys.length === 0) return

    const items = selectedRowKeys.map((key) => {
      const order = deliverables.find((o) => o._id === key)
      const draft = rowDrafts[String(key)]
      return { order, draft, key: String(key) }
    })

    for (const item of items) {
      const err = validateRow(item.order!, item.draft)
      if (err) {
        message.warning(`#${item.order?.serial || item.key}: ${err}`)
        return
      }
    }

    for (const item of items) {
      if (!(await confirmMismatchIfNeeded(item.order!, item.draft!))) return
    }

    const fullCount = items.filter((i) => willFullyClear(i.order!, i.draft!)).length
    const ok = await confirmAsync({
      title: 'Clear selected orders',
      okText: 'Continue',
      content: (
        <div>
          <p>{items.length} order(s) selected.</p>
          <p style={{ marginBottom: 0 }}>
            {fullCount} will fully clear; {items.length - fullCount} will record a partial update.
          </p>
        </div>
      ),
    })
    if (!ok) return

    setClearing(true)
    const result = await clearOrdersBulk({
      variables: {
        _id_session: resolvedSessionId || selectedDriver.session?._id || undefined,
        _id_driver: selectedDriver.driver._id,
        items: items.map(({ order, draft }) => ({
          _id_order: order!._id,
          amount_deposited: order!.is_cod ? Number(draft!.amount || 0) : 0,
          baskets_received: !!(draft!.basketsReceived || order!.baskets_received),
        })),
      },
    })
      .then((r) => checkApolloRequestErrors({
        results: r,
        allowEmpty: false,
        parseReturn: (rr: any) => rr?.data?.clearDriverOrderCollectionBulk,
      }))
      .catch(catchApolloError)

    setClearing(false)

    if (result?.success) {
      message.success(result.success.message || 'Selected orders updated')
      setSelectedRowKeys([])
      await refreshAfterMutation(Number(result.cleared_count || 0) > 0)
    } else if (result?.error) {
      message.error(result.error.details || result.error.message || 'Bulk clear failed')
    }
  }

  const fetchHistory = async (
    driver: DriverSettlement,
    page = 1,
    filters?: { serial?: string; range?: [Dayjs | null, Dayjs | null] | null },
  ) => {
    setHistoryDriver(driver)
    setHistoryOpen(true)
    setHistoryPage(page)
    setHistoryLoading(true)

    const serial = filters?.serial ?? historySerial
    const range = filters?.range !== undefined ? filters.range : historyRange

    const result = await getHistory({
      variables: {
        _id_store: store._id,
        _id_driver: driver.driver._id,
        limit: 20,
        page,
        order_serial: serial?.trim() || undefined,
        date_from: range?.[0] ? range[0].startOf('day').toISOString() : undefined,
        date_to: range?.[1] ? range[1].endOf('day').toISOString() : undefined,
      },
    })
      .then((r) => checkApolloRequestErrors({
        results: r,
        allowEmpty: true,
        parseReturn: (rr: any) => rr?.data?.getDriverSettlementHistory,
      }))
      .catch(catchApolloError)

    if (result && !result.error) {
      setHistoryRows(result.edges || [])
      setHistoryTotal(result.totalCount || 0)
    } else if (result?.error) {
      message.error(result.error.message || 'Failed to load history')
      setHistoryRows([])
      setHistoryTotal(0)
    }
    setHistoryLoading(false)
  }

  const openHistory = async (driver: DriverSettlement) => {
    setHistorySerial('')
    setHistoryRange(null)
    await fetchHistory(driver, 1, { serial: '', range: null })
  }

  const searchedDrivers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return drivers
    return drivers.filter((record) => {
      const name = record.driver.name?.toLowerCase() || ''
      const phone = record.driver.phone?.toLowerCase() || ''
      const email = record.driver.email?.toLowerCase() || ''
      return name.includes(q) || phone.includes(q) || email.includes(q)
    })
  }, [drivers, searchTerm])

  const driverColumns = [
    {
      title: 'Driver',
      key: 'driver',
      render: (record: DriverSettlement) => (
        <div>
          <div style={{ fontWeight: 600 }}>{record.driver.name}</div>
          <div style={{ fontSize: 12, color: '#888' }}>{record.driver.phone}</div>
        </div>
      ),
    },
    {
      title: 'Session',
      key: 'session',
      render: (record: DriverSettlement) => (
        record.session?.session_started_at
          ? new Date(record.session.session_started_at).toLocaleString()
          : <Text type="secondary">No session</Text>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      align: 'center' as const,
      render: (record: DriverSettlement) => {
        const pending = Number(record.delivered_orders_count || 0) > 0
        if (!pending) return <Tag color="default">Clear</Tag>
        if (!record.session?._id) {
          return <Tag color="error" icon={<WarningOutlined />}>Stuck — no session</Tag>
        }
        return <Tag color="warning" icon={<ClockCircleOutlined />}>Pending clearance</Tag>
      },
    },
    {
      title: 'Pending Orders',
      key: 'orders',
      align: 'center' as const,
      render: (record: DriverSettlement) => {
        const count = Number(record.delivered_orders_count || 0)
        if (count <= 0) return <Text type="secondary">0</Text>
        return (
          <Tag color="blue" icon={<ShoppingOutlined />}>
            {count} orders
          </Tag>
        )
      },
    },
    {
      title: 'Pending COD',
      key: 'cod',
      align: 'right' as const,
      render: (record: DriverSettlement) => {
        const pending = Number(record.pending_deposit || 0)
        if (pending <= 0) return <Text type="secondary">No COD</Text>
        return (
          <Tag color="error" icon={<DollarOutlined />}>
            {money(currency, pending)}
          </Tag>
        )
      },
    },
    {
      title: 'Baskets',
      key: 'baskets',
      align: 'center' as const,
      render: (record: DriverSettlement) => {
        if (!record.session) return <Text type="secondary">—</Text>
        const assigned = record.session.baskets_assigned?.length || 0
        const returned = record.session.baskets_returned?.length || 0
        return (
          <Tag color={record.session.all_baskets_returned ? 'success' : 'warning'} icon={<ClockCircleOutlined />}>
            {returned}/{assigned}
          </Tag>
        )
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center' as const,
      render: (record: DriverSettlement) => {
        const canOpen = Number(record.delivered_orders_count || 0) > 0
        return (
          <Space>
            <AntButton
              type="primary"
              size="small"
              disabled={!canOpen}
              onClick={() => openDeliverables(record)}
            >
              Open
            </AntButton>
            <AntButton size="small" icon={<HistoryOutlined />} onClick={() => openHistory(record)}>
              History
            </AntButton>
          </Space>
        )
      },
    },
  ]

  const deliverableColumns = [
    {
      title: 'Order',
      key: 'order',
      render: (order: PendingOrder) => (
        <div>
          <div style={{ fontWeight: 600 }}>#{order.serial}</div>
          <div style={{ fontSize: 12, color: '#888' }}>{order.customer?.name || 'Customer'}</div>
        </div>
      ),
    },
    {
      title: 'COD',
      key: 'expected',
      render: (order: PendingOrder) => (
        order.is_cod ? (
          <div>
            <div>{money(currency, order.amount_collected)}</div>
            <div style={{ fontSize: 11, color: '#888' }}>
              Deposited {money(currency, order.amount_deposited || 0)}
              {' · '}
              Due {money(currency, remainingOf(order))}
            </div>
          </div>
        ) : (
          <Tag>Prepaid</Tag>
        )
      ),
    },
    {
      title: 'Amount to deposit',
      key: 'amount',
      width: 180,
      render: (order: PendingOrder) => (
        order.is_cod ? (
          <Space.Compact style={{ width: '100%' }}>
            <Input style={{ width: 56 }} value={currency} disabled />
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              precision={2}
              value={rowDrafts[order._id]?.amount ?? remainingOf(order)}
              onChange={(v) => updateDraft(order._id, { amount: Number(v || 0) })}
            />
          </Space.Compact>
        ) : (
          <Text type="secondary">0</Text>
        )
      ),
    },
    {
      title: 'Baskets',
      key: 'baskets',
      render: (order: PendingOrder) => (
        <div>
          <Tag color={order.baskets_received ? 'success' : 'default'}>
            {order.baskets_count || 0} baskets
            {order.baskets_received ? ' ✓' : ''}
          </Tag>
          <div style={{ fontSize: 11, color: '#999', maxWidth: 160 }}>
            {(order.baskets || []).map((b) => b.barcode || b.title).filter(Boolean).join(', ') || '—'}
          </div>
        </div>
      ),
    },
    {
      title: 'Baskets received',
      key: 'received',
      align: 'center' as const,
      render: (order: PendingOrder) => (
        <Checkbox
          checked={!!(rowDrafts[order._id]?.basketsReceived || order.baskets_received)}
          disabled={!!order.baskets_received}
          onChange={(e) => updateDraft(order._id, { basketsReceived: e.target.checked })}
        />
      ),
    },
    {
      title: 'Action',
      key: 'action',
      align: 'center' as const,
      render: (order: PendingOrder) => {
        const draft = rowDrafts[order._id] || {
          amount: remainingOf(order),
          basketsReceived: !!order.baskets_received,
        }
        const full = willFullyClear(order, draft)
        return (
          <AntButton
            type="primary"
            size="small"
            loading={clearing}
            icon={<CheckCircleOutlined />}
            onClick={() => handleClearOne(order)}
          >
            {full ? 'Clear' : 'Record'}
          </AntButton>
        )
      },
    },
  ]

  const historyColumns = [
    {
      title: 'Date',
      dataIndex: 'createdAt',
      render: (v: string) => (v ? new Date(v).toLocaleString() : '—'),
    },
    {
      title: 'Order',
      dataIndex: 'order_serial',
      render: (v: string) => (v ? `#${v}` : '—'),
    },
    {
      title: 'Receivable',
      dataIndex: 'amount_collected',
      render: (v: number, row: any) => {
        const collected = Number(v || 0)
        const deposited = Number(row.amount_deposited || 0)
        const cumulative = Number(row.cumulative_deposited || deposited)
        const mismatch = collected > 0 && Math.abs(cumulative - collected) > MONEY_EPS
        return (
          <div>
            <div>{money(currency, collected)}</div>
            {mismatch && (
              <Tag color="warning" style={{ marginTop: 2 }}>
                Cumul. {money(currency, cumulative)}
              </Tag>
            )}
          </div>
        )
      },
    },
    {
      title: 'This deposit',
      dataIndex: 'amount_deposited',
      render: (v: number, row: any) => (
        <div>
          <div>{money(currency, v)}</div>
          {row.cumulative_deposited != null && (
            <div style={{ fontSize: 11, color: '#888' }}>
              Total {money(currency, row.cumulative_deposited)}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Baskets',
      dataIndex: 'baskets_received',
      render: (v: boolean) => (v ? <Tag color="success">Confirmed</Tag> : <Tag>No</Tag>),
    },
    {
      title: 'Type',
      dataIndex: 'entry_type',
      render: (v: string, row: any) => {
        if (row.is_final_clearance) return <Tag color="success">Cleared</Tag>
        if (v === 'baskets') return <Tag>Baskets</Tag>
        return <Tag color="processing">Partial</Tag>
      },
    },
    {
      title: 'Cleared by',
      dataIndex: 'cleared_by',
      render: (u: any) => u?.name || u?.email || '—',
    },
  ]

  return (
    <>
      <PageHeader title="Driver Settlements">
        <Button onClick={fetchDrivers} loading={loading}>Refresh</Button>
      </PageHeader>

      <Page>
        <Card>
          <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
            <Alert
              type="info"
              showIcon
              title="Office collection"
              description="All store drivers are listed (pending clearance on top). Partial COD deposits are allowed; an order fully clears only when the full receivable is deposited and baskets are confirmed."
            />

            <Input
              allowClear
              placeholder="Search by driver name, phone, or email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            {searchedDrivers.length === 0 && !loading ? (
              <Alert
                title="No drivers found"
                description="There are no drivers for this store."
                type="info"
                showIcon
              />
            ) : (
              <Table
                dataSource={searchedDrivers}
                columns={driverColumns}
                rowKey={(record) => record.session?._id || record.driver._id}
                loading={loading}
                pagination={{ pageSize: 25, showSizeChanger: true }}
                onRow={(record) => ({
                  onClick: (e) => {
                    const target = e.target as HTMLElement
                    if (target.closest('button')) return
                    if (Number(record.delivered_orders_count || 0) <= 0) return
                    openDeliverables(record)
                  },
                  style: {
                    cursor: Number(record.delivered_orders_count || 0) > 0 ? 'pointer' : 'default',
                  },
                })}
              />
            )}
          </Space>
        </Card>

        <Drawer
          title={selectedDriver ? `Deliverables — ${selectedDriver.driver.name}` : 'Deliverables'}
          size={1020}
          open={deliverablesOpen}
          onClose={closeDeliverables}
          extra={(
            <Space>
              <AntButton
                icon={<HistoryOutlined />}
                onClick={() => selectedDriver && openHistory(selectedDriver)}
              >
                History
              </AntButton>
              <AntButton
                type="primary"
                disabled={selectedRowKeys.length === 0}
                loading={clearing}
                icon={<CheckCircleOutlined />}
                onClick={handleClearSelected}
              >
                Update selected ({selectedRowKeys.length})
              </AntButton>
            </Space>
          )}
        >
          {selectedDriver && (
            <Space orientation="vertical" size="middle" style={{ width: '100%', marginBottom: 16 }}>
              {sessionMissing && (
                <Alert
                  type="warning"
                  showIcon
                  icon={<WarningOutlined />}
                  title="Stuck orders — no delivery session"
                  description="These delivered orders are still locked to the driver but no work session was found. You can still record deposits and clear them; wallet session totals may not update."
                />
              )}
              {!sessionMissing && selectedDriver.session?.session_started_at && (
                <Alert
                  type="info"
                  showIcon
                  title="Using delivery session"
                  description={`Clearing against session started ${new Date(selectedDriver.session.session_started_at).toLocaleString()} (active or past).`}
                />
              )}
              <Space wrap>
                <Tag icon={<ShoppingOutlined />} color="blue">
                  {deliverables.length} pending
                </Tag>
                <Tag icon={<DollarOutlined />} color="orange">
                  COD due: {money(currency, selectedDriver.pending_deposit || 0)}
                </Tag>
                <Tag icon={<WarningOutlined />} color="default">
                  Session baskets {selectedDriver.session?.baskets_returned?.length || 0}/
                  {selectedDriver.session?.baskets_assigned?.length || 0}
                </Tag>
              </Space>
            </Space>
          )}

          <Table
            dataSource={deliverables}
            columns={deliverableColumns}
            rowKey="_id"
            loading={deliverablesLoading}
            pagination={false}
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys,
            }}
            locale={{ emptyText: 'No delivered orders pending clearance' }}
          />
        </Drawer>

        <Drawer
          title={historyDriver ? `Settlement history — ${historyDriver.driver.name}` : 'History'}
          size={900}
          open={historyOpen}
          onClose={() => {
            setHistoryOpen(false)
            setHistoryDriver(null)
          }}
        >
          <Space style={{ marginBottom: 16, width: '100%' }} wrap>
            <Input
              allowClear
              placeholder="Filter by order serial"
              style={{ width: 200 }}
              value={historySerial}
              onChange={(e) => setHistorySerial(e.target.value)}
              onPressEnter={() => historyDriver && fetchHistory(historyDriver, 1)}
            />
            <RangePicker
              value={historyRange}
              onChange={(v) => setHistoryRange(v as [Dayjs | null, Dayjs | null] | null)}
            />
            <AntButton
              type="primary"
              onClick={() => historyDriver && fetchHistory(historyDriver, 1)}
            >
              Apply
            </AntButton>
            <AntButton
              onClick={() => {
                setHistorySerial('')
                setHistoryRange(null)
                if (historyDriver) fetchHistory(historyDriver, 1, { serial: '', range: null })
              }}
            >
              Reset
            </AntButton>
          </Space>

          <Table
            dataSource={historyRows}
            columns={historyColumns}
            rowKey="_id"
            loading={historyLoading}
            pagination={{
              current: historyPage,
              pageSize: 20,
              total: historyTotal,
              onChange: (page) => historyDriver && fetchHistory(historyDriver, page),
            }}
            locale={{ emptyText: 'No settlement history yet' }}
          />
        </Drawer>
      </Page>
    </>
  )
}

export default DriverSettlements
