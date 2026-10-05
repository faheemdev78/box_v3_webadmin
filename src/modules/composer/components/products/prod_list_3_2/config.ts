import type { ComposerComponent } from '../../types'
import { ProdListPreview } from './Preview'
import { ProdListProps } from './Props'
import type { ProductListValues } from '../types'
import { productInk } from '../theme'
import { serializeComposerProduct } from '../serializeProduct'

export const prodListComponent: ComposerComponent<ProductListValues> = {
    type: 'prod_list_3_2',
    label: 'Product List (3 / 2)',
    desc: 'list 2 by 3',
    category: 'products',
    placement: 'body',
    defaults: {
        title: { show: false, text: '' },
        num_products: '3',
        theme: '#FFFFFF',
        products: [{}, {}, {}],
        all_btn: { show: false, link: '' },
        open_as: 'goto_screen',
    },
    fields: [],
    Preview: ProdListPreview,
    Props: ProdListProps,
    serialize: (values) => ({
        ...values,
        theme: productInk(values?.theme),
        products: (values?.products || []).map((prod) => serializeComposerProduct(prod)),
    }),
}
