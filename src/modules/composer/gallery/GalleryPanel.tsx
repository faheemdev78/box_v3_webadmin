'use client'
import React, { useEffect, useState } from 'react'
import { Alert, Col, Empty, Row, Space, message } from 'antd'
import { useLazyQuery, useMutation } from '@apollo/client/react'
import { Button, Image } from '@/components'
import { catchApolloError, checkApolloRequestErrors } from '@/lib/utill'
import { cdnImageUrl } from '@/lib/cdnImageUrl'
import GALLERY_QUERY from '@/graphql/app_page_gallery/appPageGallery.graphql'
import DELETE_GALLERY from '@/graphql/app_page_gallery/deleteAppPageGallery.graphql'
import type { GalleryAsset } from './uploadGalleryFile'

export function GalleryPanel({ pageId, kind, selectable = false, selectLabel = 'Use', onSelect }: {
    pageId?: string
    kind?: 'picture' | 'video'
    selectable?: boolean
    selectLabel?: string
    onSelect?: (item: GalleryAsset) => void
}) {
    const [items, setItems] = useState<GalleryAsset[]>([])
    const [error, setError] = useState<string | null>(null)
    const [galleryQuery, { loading }] = useLazyQuery<any>(GALLERY_QUERY, { fetchPolicy: 'network-only' })
    const [deleteGallery] = useMutation<any>(DELETE_GALLERY)

    const load = async () => {
        if (!pageId) return
        const filter: Record<string, string> = { _id_parent: pageId }
        if (kind) filter.kind = kind

        const results = await galleryQuery({
            variables: {
                filter: JSON.stringify(filter),
                others: JSON.stringify({ sort: { createdAt: -1 } }),
            },
        })
            .then((response) => checkApolloRequestErrors({ results: response, allowEmpty: true, parseReturn: (row: any) => row?.data?.appPageGallery }))
            .catch(catchApolloError)

        if (!results || results.error) {
            setError(results?.error?.message || 'Unable to load the gallery.')
            return
        }

        const list = Array.isArray(results) ? results : []
        const failed = list.find((item: GalleryAsset & { error?: { message?: string } }) => item?.error?.message)
        if (failed?.error?.message) {
            setError(failed.error.message)
            return
        }
        setError(null)
        setItems(list)
    }

    useEffect(() => {
        load()
    }, [pageId, kind])

    const remove = async (item: GalleryAsset) => {
        if (!item._id) return
        const results = await deleteGallery({ variables: { _id: item._id } })
            .then((response) => response?.data?.deleteAppPageGallery)
            .catch(() => ({ error: { message: 'Unable to delete this gallery item.' } }))

        if (results?.error) {
            message.error(results.error.message)
            return
        }
        setItems((current) => current.filter((entry) => entry._id !== item._id))
    }

    if (!pageId) return <Alert type="warning" title="Save the page before adding gallery files." />
    if (error) return <Alert type="error" title={error} />
    if (!loading && !items.length) return <Empty description={kind ? `No ${kind}s in this gallery` : 'This page gallery is empty'} />

    return (
        <Row gutter={[8, 8]}>
            {items.map((item) => {
                const preview = item.kind === 'picture' ? (item.thumbnails?.[0] || item.url) : ''
                return (
                    <Col span={12} key={item._id || item.url}>
                        <div style={{ border: '1px solid #D0DAE5', borderRadius: 6, overflow: 'hidden', background: '#fff' }}>
                            <div style={{ height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F4F7FA' }}>
                                {item.kind === 'picture' && preview
                                    ? <Image src={cdnImageUrl(preview)} width={160} height={110} alt={item.name || 'picture'} style={{ width: '100%', height: 110, objectFit: 'contain' }} />
                                    : <div>Video</div>}
                            </div>
                            <div style={{ padding: 8 }}>
                                <div style={{ fontSize: 12, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name || item.kind}</div>
                                <Space>
                                    {selectable && <Button size="small" onClick={() => onSelect?.(item)}>{selectLabel}</Button>}
                                    <Button size="small" onClick={() => remove(item)}>Delete</Button>
                                </Space>
                            </div>
                        </div>
                    </Col>
                )
            })}
        </Row>
    )
}
