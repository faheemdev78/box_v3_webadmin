'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { ConfigProvider, Input, Modal, Tree } from 'antd'
import { gql } from '@apollo/client'
import { useLazyQuery } from '@apollo/client/react'
import { useForm } from 'react-final-form'
import get from 'lodash/get'
import { Button } from '@/components'
import { catchApolloError, checkApolloRequestErrors } from '@/lib/utill'
import LIST_CATS from '@/graphql/product_cat/productCats.graphql'
import LIST_BRANDS from '@/graphql/brand/brands.graphql'
import type { CategoryTile } from './types'
// import cssStyles from '../catModal.module.scss'


const LIST_PAGES = gql`query appPages($filter: String, $others: String) {
    appPages(filter: $filter, others: $others) {
        _id
        title
        slug
        draft
    }
}`

// const CATEGORY_HOME_CATEGORIES = gql`
//   query CategoryHomeCategories($filter: String) {
//     productCats(filter: $filter) {
//       _id title _id_parent_cat status icon icon_img icon_img_thumb
//     }
//   }
// `;

type CatRow = CategoryTile & { _id: string; parent_cat_title?: string; draft?: boolean }

export type CategoryHomeCategory = {
    _id: string;
    title: string;
    _id_parent_cat?: string | null;
    status?: string | null;
    icon?: string | null;
    icon_img?: string | null;
    icon_img_thumb?: string | null;
};
export type CategoryHomeCategoryNode = CategoryHomeCategory & {
    sub_cats: CategoryHomeCategoryNode[];
};

function categoryHomeTree(
    categories: CategoryHomeCategory[],
    parentId?: string | null
): CategoryHomeCategoryNode[] {

    if (!Array.isArray(categories) || !categories.length) {
        return [];
    }

    // Create lookup maps
    const categoryMap = new Map<string, CategoryHomeCategory>();
    const childrenMap = new Map<string, CategoryHomeCategory[]>();

    // First pass: index all categories
    for (const category of categories) {
        if (!category?._id || category.status === 'offline') {
            continue;
        }

        categoryMap.set(String(category._id), category);
    }

    // Second pass: group categories under their parents
    for (const category of categoryMap.values()) {

        if (!category._id_parent_cat) {
            continue;
        }

        const parentKey = String(category._id_parent_cat);

        // Only attach categories whose parent exists and is online
        if (!categoryMap.has(parentKey)) {
            continue;
        }

        const siblings = childrenMap.get(parentKey) || [];

        siblings.push(category);

        childrenMap.set(parentKey, siblings);
    }

    // Recursively construct the tree
    const buildChildren = (
        id: string,
        visited: Set<string> = new Set()
    ): CategoryHomeCategoryNode[] => {

        if (visited.has(id)) {
            return [];
        }

        const nextVisited = new Set(visited);
        nextVisited.add(id);

        return (childrenMap.get(id) || [])
            .filter(category => !nextVisited.has(String(category._id)))
            .map(category => ({
                ...category,
                sub_cats: buildChildren(String(category._id), nextVisited),
                children: buildChildren(String(category._id), nextVisited),
            }));
    };

    // If parentId is provided, return its children
    if (parentId) {

        const parent = categoryMap.get(String(parentId));

        if (!parent) {
            return [];
        }

        return buildChildren(String(parentId));
    }

    // Otherwise return the complete tree starting from root categories
    return [...categoryMap.values()]
        .filter(category => !category._id_parent_cat)
        .map(category => ({
            ...category,
            sub_cats: buildChildren(String(category._id)),
            children: buildChildren(String(category._id)),
        }));
}

export function CategorySelectModal({ open, onClose, fieldName, limit, entity = 'category' }: {
    entity?: 'category' | 'brand' | 'page'
    open: boolean
    onClose: () => void
    fieldName: string
    limit: number
}) {
    const form = useForm()
    const selectionLabel = entity === 'page' ? 'pages' : entity === 'brand' ? 'brands' : 'categories'
    const queryName = entity === 'page' ? 'appPages' : entity === 'brand' ? 'brands' : 'productCats'
    const [loadCats, { loading }] = useLazyQuery<any>(entity === 'page' ? LIST_PAGES : entity === 'brand' ? LIST_BRANDS : LIST_CATS, { fetchPolicy: 'network-only' })
    const [rows, setRows] = useState<CatRow[]>([])
    const [error, setError] = useState('')
    const [query, setQuery] = useState('')
    const [picked, setPicked] = useState<CatRow[]>([])

    useEffect(() => {
        if (!open) return
        const current = (get(form.getState().values, fieldName) || []) as CategoryTile[]
        setPicked(current.filter((item) => item?._id).map((item) => ({
            _id: item._id as string,
            title: item.title,
            slug: item.slug,
            icon: item.icon,
            icon_img: item.icon_img,
            icon_img_thumb: item.icon_img_thumb,
        })))
        setQuery('')
        setError('')
        loadCats(entity === 'page' ? { variables: { filter: JSON.stringify({ draft: false }) } } : undefined)
            .then((response) => checkApolloRequestErrors({ results: response, allowEmpty: true, parseReturn: (row: any) => row?.data?.[queryName] }))
            .then((results) => {
                if (!results || results.error) {
                    setError(results?.error?.message || `Unable to load ${selectionLabel}.`)
                    return
                }
                const list = Array.isArray(results) ? results : []
                
                const _list = categoryHomeTree(list.map(item=>({ ...item, key:item._id })));
                setRows(_list.filter((item: CatRow & { status?: string }) => item?._id && item?.title && item.status !== 'offline' && (entity !== 'page' || item.draft !== true)))

                // setRows(list.filter((item: CatRow & { status?: string }) => item?._id && item?.title && item.status !== 'offline' && (entity !== 'page' || item.draft !== true)))
            })
            .catch((err) => {
                const parsed = catchApolloError(err)
                setError(parsed?.error?.message || `Unable to load ${selectionLabel}.`)
            })
    }, [open, fieldName, entity])

    const visible = useMemo(() => {
        const needle = query.trim().toLowerCase()
        if (!needle) return rows
        return rows.filter((item) => `${item.title || ''} ${entity === 'page' ? item.slug || '' : item.parent_cat_title || ''}`.toLowerCase().includes(needle))
    }, [query, rows, entity])


    const toggle = (item: CatRow) => {
        setPicked((current) => {
            if (current.some((row) => row._id === item._id)) return current.filter((row) => row._id !== item._id)
            if (current.length >= limit) return current
            return [...current, item]
        })
    }

    const save = () => {
        const previous = (get(form.getState().values, fieldName) || []) as CategoryTile[]
        const next = picked.slice(0, limit).map((pickedItem) => {
            const item = rows.find((row) => row._id === pickedItem._id) || pickedItem
            const existing = previous.find((row) => row?._id === item._id)
            return {
                _id: item._id,
                title: item.title || existing?.title || '',
                slug: item.slug || existing?.slug || '',
                icon: item.icon || null,
                icon_img: item.icon_img || null,
                icon_img_thumb: item.icon_img_thumb || null,
                picture: existing?.picture || null,
            }
        })
        form.change(fieldName, next)
        onClose()
    }

    // function renderList(list:any[]){
    //     return (<div>
    //         {list.map((item) => {
    //             const selected = picked.some((row) => row._id === item._id)
    //             const blocked = !selected && picked.length >= limit;

    //             // if (item?.sub_cats?.length) {
    //             //     console.log("has sub cats: ");
    //             // }

    //             return (<div key={item._id}>
    //                 <div
    //                     className={cssStyles.selectable_list_item}
    //                     // type="button"
    //                     disabled={blocked}
    //                     onClick={() => toggle(item)}
    //                     style={{
    //                         // border: selected ? '1px solid #1677ff' : '1px solid #e5e7eb',
    //                         // background: selected ? '#e6f4ff' : '#fff',
    //                         // cursor: blocked ? 'not-allowed' : 'pointer',
    //                     }}
    //                 >
    //                     <div>{item.title}</div>
    //                     {entity === 'page'
    //                         ? item.slug && <div style={{ color: '#888', fontSize: 12 }}>{item.slug}</div>
    //                         : item.parent_cat_title && <div style={{ color: '#888', fontSize: 12 }}>{item.parent_cat_title}</div>}
    //                 </div>

    //                 {item?.sub_cats?.length && <div className={cssStyles.selectable_list_item_sub_container}>{renderList(item.sub_cats)}</div>}
    //             </div>)
    //         })}
    //     </div>)
    // }

    // const onListItemSelect = (selectedKeys, info) => {
    //     console.log('selected', selectedKeys, info);
    // };
    const onListItemCheck = (checkedKeys, info) => {
        // console.log('onCheck', checkedKeys, info);
        toggle(info.node)
    };

    

    return (
        <Modal
            title={`Select ${selectionLabel} (${picked.length} / ${limit})`}
            open={open}
            onCancel={onClose}
            width={720}
            destroyOnHidden
            footer={(<>
                <Button htmlType="button" onClick={onClose}>Cancel</Button>
                <Button htmlType="button" type="primary" onClick={save}>Save</Button>
            </>)}
        >
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${selectionLabel}`} style={{ marginBottom: 12 }} />
            {error && <div style={{ color: '#cf1322', marginBottom: 8 }}>{error}</div>}
            {loading && <div style={{ color: '#666' }}>Loading {selectionLabel}…</div>}

            <ConfigProvider
                theme={{
                    components: {
                        Tree: {
                            /* here are your component tokens */
                            nodeSelectedBg: '#00FF00'
                        },
                    },
                }}
            >
                <Tree
                    selectable={false}
                    autoExpandParent={true}
                    defaultExpandAll
                    // defaultExpandParent={true}
                    checkable
                    // checkedKeys
                    checkStrictly
                    multiple={true}
                    // defaultExpandedKeys={[]} //{['0-0-0', '0-0-1']}
                    // defaultSelectedKeys={picked && picked?.map(o=>(o._id))} //{['0-0-1']}
                    defaultCheckedKeys={picked && picked?.map(o=>(o._id))} //{['0-0-1']}
                    showLine={true}
                    showIcon={false}
                    // onSelect={onListItemSelect}
                    onCheck={onListItemCheck}
                    treeData={visible}
                />

            </ConfigProvider>

            {/* <div style={{ maxHeight: 420, overflow: 'auto' }}>{renderList(visible)}</div> */}
        </Modal>
    )
}
