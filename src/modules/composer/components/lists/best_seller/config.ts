import type { ComposerComponent } from '../../types'
import { catListComponent } from '../../categories/cat_list/config'
import type { CategoryListValues } from '../../categories/cat_list/types'

export const bestSellerComponent: ComposerComponent<CategoryListValues> = {
    ...catListComponent,
    type: 'box_list',
    label: 'Best Seller',
    category: 'lists',
}
