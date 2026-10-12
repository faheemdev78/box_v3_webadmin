import type { ComposerComponent } from '../../types'
import { CategoryListPreview } from './Preview'
import { CategoryListProps } from './Props'
import { categorySlots, gutterPx, categoryGrid, type CategoryListValues } from './types'

export const catListComponent: ComposerComponent<CategoryListValues> = {
    type: 'cat_list',
    label: 'Category List',
    desc: 'Set the columns and rows',
    category: 'categories',
    placement: 'body',
    defaults: {
        title: { show: true, text: '' },
        show_title: true,
        columns: 4,
        rows: 2,
        gutter: 12,
        theme: '#222222',
        categories: [],
    },
    fields: [],
    Preview: CategoryListPreview,
    Props: CategoryListProps,
    serialize: (values) => {
        const grid = categoryGrid(values)
        const limit = categorySlots(values)
        return {
            title: {
                show: !!values?.title?.show,
                text: values?.title?.text || '',
            },
            show_title: values?.show_title !== false,
            columns: grid.columns,
            rows: grid.rows,
            gutter: gutterPx(values?.gutter),
            theme: values?.theme || '#222222',
            categories: (values?.categories || []).slice(0, limit).filter((item) => item?._id).map((item) => ({
                _id: item._id,
                title: item.title || '',
                slug: item.slug || '',
                picture: item.picture?.url ? {
                    _id: item.picture._id || '',
                    url: item.picture.url,
                    name: item.picture.name || '',
                    thumbnails: item.picture.thumbnails || [],
                } : null,
            })),
        }
    },
}
