'use client'

import { useState, type ReactNode } from 'react'
import { gql } from '@apollo/client'
import { useQuery } from '@apollo/client/react'
import { Alert, Checkbox, Dropdown, Empty, Input, Popover, Spin } from 'antd'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faArrowUpFromBracket, faSearch, faAngleDown, faSliders, faArrowDownWideShort, faImage } from '@fortawesome/free-solid-svg-icons'
import { cdnImageUrl } from '@/lib/cdnImageUrl'
import { ProdListPreview } from '../components/products/prod_list_3_2/Preview'
import { serializeComposerProduct } from '../components/products/serializeProduct'
import PRODUCTS_QUERY from '@/graphql/product/productsQuery.graphql'
import { categoryDetailCategoryIds, categoryDetailLayout, type DetailCategory } from './categoryLayout'
import styles from './CategoryDetailPageComposer.module.scss'

const CATEGORIES_QUERY = gql`
    query CategoryDetailComposerCategories {
        productCats(filter: "{}") {
            _id title _id_parent_cat icon_img icon_img_thumb
        }
    }
`

type PageSource = { _id?: string; title?: string }

export function CategoryDetailPageCanvas({ source, children }: { source?: PageSource; children: ReactNode }) {
    const [selection, setSelection] = useState<{ parent?: string; child: string } | null>(null)
    const [searchOpen, setSearchOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [address, setAddress] = useState('Your current address')
    const [sort, setSort] = useState('title')
    const [discountOnly, setDiscountOnly] = useState(false)
    const [shareMessage, setShareMessage] = useState('')
    const categoriesQuery = useQuery<{ productCats: DetailCategory[] }>(CATEGORIES_QUERY)
    const categories = categoriesQuery.data?.productCats || []
    const { subcategories, columns } = categoryDetailLayout(categories, source?._id)
    const selectedId = selection?.parent === source?._id && subcategories.some((category) => category._id === selection?.child)
        ? selection?.child
        : source?._id
    const categoryIds = categoryDetailCategoryIds(categories, selectedId)
    const productsQuery = useQuery<any>(PRODUCTS_QUERY, {
        skip: !source?._id || categoriesQuery.loading || !!categoriesQuery.error,
        variables: {
            limit: 12,
            page: 1,
            filter: JSON.stringify({ 'categories._id': { $in: categoryIds } }),
            others: JSON.stringify({ sort: { title: 1 } }),
        },
    })
    const loading = categoriesQuery.loading || productsQuery.loading
    const error = categoriesQuery.error?.message || productsQuery.error?.message || productsQuery.data?.productsQuery?.error?.message
    const products = (productsQuery.data?.productsQuery?.edges || [])
        .map(serializeComposerProduct)
        .filter((product: any) => (!search.trim() || product.title?.toLowerCase().includes(search.trim().toLowerCase()))
            && (!discountOnly || (product.price_was != null && product.price != null && product.price_was > product.price)))
        .sort((a: any, b: any) => sort === 'price_up'
            ? (a.price ?? Infinity) - (b.price ?? Infinity)
            : sort === 'price_down' ? (b.price ?? -Infinity) - (a.price ?? -Infinity)
                : (a.title || '').localeCompare(b.title || ''))

    return <div className={styles.canvas} aria-label="Store page canvas">
        <header className={styles.storeHeader}>
            <button type="button" className={styles.roundButton} aria-label="Back to parent category" onClick={() => { setSelection(null); setSearch('') }}>
                <FontAwesomeIcon icon={faArrowLeft} />
            </button>
            <Popover trigger="click" content={<Input aria-label="Preview delivery address" value={address} onChange={(event) => setAddress(event.target.value)} />}>
                <button type="button" className={styles.addressButton}>
                    <strong>{source?.title || 'Category'}</strong>
                    <span><b>Delivering to:</b> {address}<FontAwesomeIcon icon={faAngleDown} /></span>
                </button>
            </Popover>
            <button type="button" className={styles.roundButton} aria-label="Search products" aria-expanded={searchOpen} onClick={() => setSearchOpen(!searchOpen)}><FontAwesomeIcon icon={faSearch} /></button>
            <Popover content={shareMessage || 'Copy page link'} trigger="click">
                <button type="button" className={styles.roundButton} aria-label="Copy page link" onClick={async () => {
                    try { await navigator.clipboard.writeText(window.location.href); setShareMessage('Page link copied') }
                    catch { setShareMessage('Unable to copy page link') }
                }}><FontAwesomeIcon icon={faArrowUpFromBracket} /></button>
            </Popover>
        </header>
        {searchOpen && <div className={styles.search}><Input autoFocus allowClear placeholder="Search products" aria-label="Search store products" value={search} onChange={(event) => setSearch(event.target.value)} /></div>}
        <div className={styles.storeBody}>
            {subcategories.length > 0 && <nav className={styles.categoryRail} aria-label="Subcategories">
                {subcategories.map((category) => <button
                    type="button"
                    key={category._id}
                    className={`${styles.categoryButton} ${selectedId === category._id ? styles.activeCategory : ''}`}
                    aria-pressed={selectedId === category._id}
                    onClick={() => setSelection(selectedId === category._id ? null : { parent: source?._id, child: category._id })}
                >
                    <span className={styles.categoryImage}>
                        {category.icon_img_thumb || category.icon_img
                            ? <img src={cdnImageUrl(category.icon_img_thumb || category.icon_img || '')} alt="" />
                            : <FontAwesomeIcon icon={faImage} />}
                    </span>
                    <span>{category.title}</span>
                </button>)}
            </nav>}
            <div className={styles.storeContent}>
                <div className={styles.filterBar}>
                    <Popover trigger="click" content={<Checkbox checked={discountOnly} onChange={(event) => setDiscountOnly(event.target.checked)}>Discounted products only</Checkbox>}>
                        <button type="button" className={discountOnly ? styles.activeFilter : ''}><FontAwesomeIcon icon={faSliders} /> Filters <FontAwesomeIcon icon={faAngleDown} /></button>
                    </Popover>
                    <Dropdown trigger={['click']} menu={{ selectedKeys: [sort], onClick: ({ key }) => setSort(key), items: [{ key: 'title', label: 'Name' }, { key: 'price_up', label: 'Price: low to high' }, { key: 'price_down', label: 'Price: high to low' }] }}>
                        <button type="button"><FontAwesomeIcon icon={faArrowDownWideShort} /> Sort <FontAwesomeIcon icon={faAngleDown} /></button>
                    </Dropdown>
                    <button type="button" onClick={() => setSort(sort === 'price_up' ? 'price_down' : 'price_up')}>Price <FontAwesomeIcon icon={faAngleDown} /></button>
                </div>
                <div className={styles.bannerArea}>{children}</div>
                <div className={styles.productArea}>
                    {error ? <Alert type="error" title="Unable to load canvas content" description={error} />
                        : loading ? <div className={styles.loading}><Spin /></div>
                            : products.length ? Array.from({ length: Math.ceil(products.length / (columns * 4)) }, (_, index) => <ProdListPreview key={index} item={{ values: {
                                products: products.slice(index * columns * 4, (index + 1) * columns * 4),
                                columns,
                                rows: 4,
                                gutter: 12,
                                theme: '#333333',
                            } }} />)
                                : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={search || discountOnly ? 'No matching products' : 'No products in this category'} />}
                </div>
            </div>
        </div>
    </div>
}
