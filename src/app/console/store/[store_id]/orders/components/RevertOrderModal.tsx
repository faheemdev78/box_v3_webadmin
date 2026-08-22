'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Input, Modal, Select, Space, Tag, Typography, message } from 'antd'
import { useLazyQuery, useMutation } from '@apollo/client/react'
import { catchApolloError, checkApolloRequestErrors } from '@/lib/utill_apollo'

import GET_AVAILABLE_BASKETS from '@/graphql/baskets/getAvailableBaskets.graphql'
import REVERT_ORDER_STAGE from '@/graphql/order/revertOrderStage.graphql'

const { Text } = Typography
const { TextArea } = Input

type BasketOption = {
  _id: string
  title?: string
  barcode?: string
  color?: string
  status?: string
  currentlyAssigned?: boolean
}

const STAGE_LABELS: Record<string, string> = {
  pending: 'Pending',
  'picking-complete': 'Picking Complete',
  'ready-to-dispatch': 'Ready to Dispatch',
}

export const getRequiredBasketsForRevert = (order: any, targetStage: string): BasketOption[] => {
  if (targetStage === 'ready-to-dispatch') {
    if (order?.processing_stages?.till_verification?.baskets?.length) {
      return order.processing_stages.till_verification.baskets
    }
    return order?.current_order?.baskets || []
  }

  if (targetStage === 'picking-complete') {
    return order?.processing_stages?.picking?.baskets || []
  }

  return []
}

const getBasketCategory = (targetStage: string): 'pickup' | 'dispatch' | null => {
  if (targetStage === 'picking-complete') return 'pickup'
  if (targetStage === 'ready-to-dispatch') return 'dispatch'
  return null
}

export function RevertOrderModal({
  open,
  order,
  targetStage,
  storeId,
  onClose,
  onSuccess,
}: {
  open: boolean
  order: any
  targetStage: string
  storeId: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedBasketIds, setSelectedBasketIds] = useState<string[]>([])
  const initializedRef = useRef(false)

  const [getAvailableBaskets, { data: availableBasketsData, loading: loadingBaskets, error: basketsQueryError }] = useLazyQuery<any>(GET_AVAILABLE_BASKETS, {
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
  })
  const [revertOrderStage, { loading: reverting }] = useMutation<any>(REVERT_ORDER_STAGE)

  const stageName = STAGE_LABELS[targetStage] || targetStage
  const basketCategory = getBasketCategory(targetStage)
  const basketLabel = basketCategory === 'pickup' ? 'picker' : basketCategory === 'dispatch' ? 'dispatch' : ''
  const originalBaskets = useMemo(() => getRequiredBasketsForRevert(order, targetStage), [order, targetStage])
  const requiredCount = originalBaskets.length
  const needsBaskets = Boolean(basketCategory) && requiredCount > 0
  const assignedBasketIds = useMemo(
    () => new Set((order?.current_order?.baskets || []).map((basket: BasketOption) => String(basket?._id)).filter(Boolean)),
    [order]
  )

  const availableBaskets: BasketOption[] = availableBasketsData?.getAvailableBaskets?.baskets || []

  const keepableOriginals = useMemo(() => {
    return originalBaskets.filter((basket) => {
      const id = String(basket?._id || '')
      if (!id) return false
      if (assignedBasketIds.has(id)) return true
      return availableBaskets.some((available) => String(available._id) === id)
    })
  }, [assignedBasketIds, availableBaskets, originalBaskets])

  const unavailableOriginals = useMemo(() => {
    const keepableIds = new Set(keepableOriginals.map((basket) => String(basket._id)))
    return originalBaskets.filter((basket) => basket?._id && !keepableIds.has(String(basket._id)))
  }, [keepableOriginals, originalBaskets])

  const selectOptions = useMemo(() => {
    const options = new Map<string, { value: string; label: string }>()

    keepableOriginals.forEach((basket) => {
      const id = String(basket._id)
      const assigned = assignedBasketIds.has(id)
      options.set(id, {
        value: id,
        label: `${basket.title || basket.barcode || id}${assigned ? ' (currently assigned)' : ''}`,
      })
    })

    availableBaskets.forEach((basket) => {
      const id = String(basket._id)
      if (options.has(id)) return
      options.set(id, {
        value: id,
        label: `${basket.title || basket.barcode || id}${basket.barcode && basket.title ? ` — ${basket.barcode}` : ''}`,
      })
    })

    return Array.from(options.values())
  }, [assignedBasketIds, availableBaskets, keepableOriginals])

  useEffect(() => {
    if (!open) {
      initializedRef.current = false
      setReason('')
      setNotes('')
      setSelectedBasketIds([])
      return
    }

    if (!needsBaskets || !storeId || !basketCategory) return

    getAvailableBaskets({
      variables: {
        _id_store: storeId,
        category: basketCategory,
        limit: 100,
      },
    })
  }, [basketCategory, getAvailableBaskets, needsBaskets, open, storeId])

  useEffect(() => {
    if (!open || !needsBaskets || initializedRef.current || loadingBaskets) return
    initializedRef.current = true
    setSelectedBasketIds(keepableOriginals.map((basket) => String(basket._id)))
  }, [keepableOriginals, loadingBaskets, needsBaskets, open])

  const handleConfirm = async () => {
    if (!reason.trim()) {
      message.warning('Please provide a reason for reverting')
      return
    }

    if (needsBaskets && selectedBasketIds.length !== requiredCount) {
      message.warning(`Please select exactly ${requiredCount} ${basketLabel} basket(s)`)
      return
    }

    const processedResult = await revertOrderStage({
      variables: {
        input: {
          _id_order: order._id,
          target_stage: targetStage,
          reason: reason.trim(),
          notes: notes.trim() || undefined,
          ...(needsBaskets ? { basket_ids: selectedBasketIds } : {}),
        },
      },
    })
      .then((r) => checkApolloRequestErrors({
        results: r,
        allowEmpty: false,
        parseReturn: (rr: any) => rr?.data?.revertOrderStage,
      }))
      .catch(catchApolloError)

    if (processedResult?.error) {
      message.error(processedResult.error.details || processedResult.error.message || 'Failed to revert order')
      return
    }

    if (processedResult?.success) {
      message.success(`Order ${order.serial} has been reverted to ${stageName}`)
      onSuccess()
      onClose()
    }
  }

  return (
    <Modal
      title={`Revert to ${stageName}`}
      open={open}
      onOk={handleConfirm}
      onCancel={onClose}
      confirmLoading={reverting}
      okText="Confirm Revert"
      okButtonProps={{
        danger: true,
        disabled: needsBaskets && (loadingBaskets || selectedBasketIds.length !== requiredCount),
      }}
      width={640}
      destroyOnHidden
    >
      <Space orientation="vertical" style={{ width: '100%' }} size="large">
        <Alert
          title="Warning"
          description={
            <div>
              <p>You are about to revert order <strong>{order?.serial}</strong> to <strong>{stageName}</strong>.</p>
              <ul style={{ marginLeft: 20, marginBottom: 0 }}>
                {targetStage === 'pending' && (
                  <>
                    <li>Reset the order to its original state</li>
                    <li>Clear all processing stages and data</li>
                    <li>Release any locks and assigned resources</li>
                  </>
                )}
                {targetStage === 'picking-complete' && (
                  <>
                    <li>Restore order data from after picking was completed</li>
                    <li>Clear till verification and delivery stages</li>
                    <li>Attach the selected picker baskets to this order</li>
                  </>
                )}
                {targetStage === 'ready-to-dispatch' && (
                  <>
                    <li>Restore order data from after till verification</li>
                    <li>Clear delivery stage</li>
                    <li>Attach the selected dispatch baskets to this order</li>
                  </>
                )}
              </ul>
            </div>
          }
          type="warning"
          showIcon
        />

        {needsBaskets && (
          <div>
            {(basketsQueryError || availableBasketsData?.getAvailableBaskets?.error) && (
              <Alert
                style={{ marginBottom: 12 }}
                type="error"
                showIcon
                title="Failed to load available baskets"
                description={basketsQueryError?.message || availableBasketsData?.getAvailableBaskets?.error?.message}
              />
            )}
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              Previous {basketLabel} baskets
            </Text>
            <Space wrap>
              {originalBaskets.map((basket) => {
                const keepable = keepableOriginals.some((item) => String(item._id) === String(basket._id))
                return (
                  <Tag key={String(basket._id)} color={keepable ? 'green' : 'red'}>
                    {basket.title || basket.barcode}
                    {keepable ? '' : ' (unavailable)'}
                  </Tag>
                )
              })}
            </Space>
            {unavailableOriginals.length > 0 && (
              <Alert
                style={{ marginTop: 12 }}
                type="info"
                showIcon
                title="Replacement baskets required"
                description={`Select ${requiredCount} available ${basketLabel} basket(s). Previously used baskets that are still free or assigned to this order can be kept.`}
              />
            )}

            <div style={{ marginTop: 16 }}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                Select {requiredCount} {basketLabel} basket{requiredCount === 1 ? '' : 's'}
                <Text type="secondary"> ({selectedBasketIds.length} of {requiredCount} selected)</Text>
              </Text>
              <Select
                mode="multiple"
                allowClear
                showSearch
                loading={loadingBaskets}
                style={{ width: '100%' }}
                placeholder={`Select ${requiredCount} available ${basketLabel} basket(s)`}
                value={selectedBasketIds}
                options={selectOptions}
                optionFilterProp="label"
                onChange={(ids: string[]) => {
                  if (ids.length > requiredCount) {
                    message.warning(`Select exactly ${requiredCount} ${basketLabel} basket(s)`)
                    return
                  }
                  setSelectedBasketIds(ids)
                }}
                notFoundContent={loadingBaskets ? 'Loading baskets...' : `No available ${basketLabel} baskets found`}
              />
              {!loadingBaskets && selectOptions.length < requiredCount && (
                <Alert
                  style={{ marginTop: 12 }}
                  type="error"
                  showIcon
                  title="Not enough baskets available"
                  description={`This order needs ${requiredCount} ${basketLabel} basket(s), but only ${selectOptions.length} are currently available. Free some baskets and try again.`}
                />
              )}
            </div>
          </div>
        )}

        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
            Reason for Reverting <span style={{ color: 'red' }}>*</span>
          </label>
          <Input
            placeholder="Enter reason for reverting (required)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={200}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
            Additional Notes (Optional)
          </label>
          <TextArea
            placeholder="Enter any additional notes or comments"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            maxLength={500}
          />
        </div>
      </Space>
    </Modal>
  )
}
