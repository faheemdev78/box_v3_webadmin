'use client'

import React, { useEffect, useState } from 'react'
import { Button, Select, Space, Upload } from 'antd'
import { Field, useForm, useFormState } from 'react-final-form'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Label } from '@/components/form'
import { solidIcon, solidIconOptions } from './solidIcons'

function IconChoice({ name }: { name?: string | null }) {
    const icon = solidIcon(name)
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {icon && <FontAwesomeIcon icon={icon} fixedWidth />}
            <span>{name}</span>
        </span>
    )
}

export function CategoryIcon({ name, iconImg, size = 16, color }: { name?: string | null; iconImg?: string | null; size?: number; color?: string }) {
    if (iconImg) {
        return <img src={iconImg} alt="" width={size} height={size} style={{ objectFit: 'contain', display: 'block' }} />
    }
    const icon = solidIcon(name)
    if (!icon) return null
    return <FontAwesomeIcon icon={icon} color={color} style={{ fontSize: size, width: size }} />
}

function SvgPreview({ file, url }: { file?: File | null; url?: string | null }) {
    const [localUrl, setLocalUrl] = useState<string | null>(null)

    useEffect(() => {
        if (!file) {
            setLocalUrl(null)
            return
        }
        const next = URL.createObjectURL(file)
        setLocalUrl(next)
        return () => URL.revokeObjectURL(next)
    }, [file])

    const src = localUrl || url
    if (!src) return null
    return <img src={src} alt="" width={48} height={48} style={{ objectFit: 'contain', display: 'block' }} />
}

export function IconSelect() {
    const form = useForm()
    const values = useFormState({ subscription: { values: true } }).values as {
        icon_source?: string
        icon_img?: string | null
        icon_file?: File | null
    }
    const source = values.icon_source === 'svg' ? 'svg' : 'awesome'

    return (
        <div>
            <Label>Icon</Label>
            <Space orientation="vertical" style={{ width: '100%' }}>
                <Select
                    style={{ width: '100%' }}
                    value={source}
                    options={[
                        { value: 'awesome', label: 'Font Awesome' },
                        { value: 'svg', label: 'Upload SVG' },
                    ]}
                    onChange={(value) => form.change('icon_source', value)}
                />

                {source === 'awesome' && (
                    <Field name="icon">
                        {({ input }) => (
                            <Select
                                showSearch
                                allowClear
                                virtual
                                style={{ width: '100%' }}
                                placeholder="Search icons"
                                value={input.value || undefined}
                                options={solidIconOptions}
                                optionFilterProp="label"
                                listHeight={320}
                                onChange={(value) => input.onChange(value || null)}
                                optionRender={(option) => <IconChoice name={String(option.value || '')} />}
                                labelRender={(option) => <IconChoice name={String(option.value || '')} />}
                            />
                        )}
                    </Field>
                )}

                {source === 'svg' && (
                    <Field name="icon_file">
                        {({ input }) => (
                            <Space align="center">
                                <SvgPreview file={input.value} url={values.icon_img} />
                                <Upload
                                    accept=".svg,image/svg+xml"
                                    maxCount={1}
                                    showUploadList={false}
                                    beforeUpload={(file) => {
                                        input.onChange(file)
                                        return false
                                    }}
                                >
                                    <Button>{input.value || values.icon_img ? 'Replace SVG' : 'Choose SVG'}</Button>
                                </Upload>
                                {(input.value || values.icon_img) && (
                                    <Button
                                        onClick={() => {
                                            input.onChange(null)
                                            form.change('icon_img', null)
                                        }}
                                    >
                                        Clear
                                    </Button>
                                )}
                            </Space>
                        )}
                    </Field>
                )}
            </Space>
        </div>
    )
}
