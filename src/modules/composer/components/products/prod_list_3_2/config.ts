import type { ComposerComponent } from '../../types'
import { ProdListPreview } from './Preview'
import { ProdListProps } from './Props'
import { gutterPx, productGrid, type ProductListValues } from '../types'
import { productInk } from '../theme'
import { serializeComposerProduct } from '../serializeProduct'

export const prodListComponent: ComposerComponent<ProductListValues> = {
    type: 'prod_list_3_2',
    label: 'Product List',
    desc: 'Set the columns and rows',
    category: 'products',
    placement: 'body',
    defaults: {
        title: { show: false, text: '' },
        columns: 3,
        rows: 1,
        gutter: 8,
        num_products: '3',
        theme: '#FFFFFF',
        products: [{}, {}, {}],
        all_btn: { show: false, link: '' },
        open_as: 'goto_screen',
    },
    fields: [],
    Preview: ProdListPreview,
    Props: ProdListProps,
    serialize: (values) => {
        const grid = productGrid(values)
        return {
            ...values,
            columns: grid.columns,
            rows: grid.rows,
            gutter: gutterPx(values?.gutter),
            num_products: String(grid.columns * grid.rows),
            theme: productInk(values?.theme),
            products: (values?.products || []).slice(0, grid.columns * grid.rows).map((prod) => serializeComposerProduct(prod)),
        }
    },
}
