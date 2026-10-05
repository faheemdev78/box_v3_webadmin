'use client'
import React from 'react'
import { Modal } from 'antd'
import { Field, useForm } from 'react-final-form'
import { ProductListSelector } from '@/modules/products/components'
import type { ComposerProduct } from './types'

export function ProductSelectModal({ open, onClose, fieldName, limit, padTo }: {
    open: boolean
    onClose: () => void
    fieldName: string
    limit: number
    padTo?: number
}) {
    const form = useForm()
    const max = Math.max(1, Number(limit) || 1)

    return (
        <Modal title="Select products" onCancel={onClose} footer={false} open={open} width="1000px" destroyOnHidden>
            <Field<ComposerProduct[]> name={fieldName} subscription={{ value: true }}>
                {(products) => (
                    <ProductListSelector
                        selected_products={(products.input.value || []).filter((item) => item?._id)}
                        limit={max}
                        onSubmit={(selected: ComposerProduct[]) => {
                            const picked = (selected || []).slice(0, max)
                            const next = padTo && padTo > 0
                                ? Array.from({ length: padTo }, (_, index) => picked[index] || {})
                                : picked
                            form.change(fieldName, next)
                            onClose()
                        }}
                    />
                )}
            </Field>
        </Modal>
    )
}
