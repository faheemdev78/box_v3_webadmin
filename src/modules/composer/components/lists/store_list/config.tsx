import type { ComposerComponent } from '../../types'
import { catListComponent } from '../../categories/cat_list/config'
import { CategoryListPreview } from '../../categories/cat_list/Preview'
import { CategoryListProps } from '../../categories/cat_list/Props'
import type { CategoryListValues } from '../../categories/cat_list/types'

const { categories: _categories, ...defaults } = catListComponent.defaults

export const storeListComponent: ComposerComponent<CategoryListValues> = {
    ...catListComponent,
    type: 'shop_by_store',
    label: 'Store List',
    category: 'lists',
    desc: 'Grid of pages with custom pictures',
    defaults: { ...defaults, pages: [] },
    Preview: ({ item }) => <CategoryListPreview item={item} entity="page" />,
    Props: ({ item }) => <CategoryListProps item={item} entity="page" />,
    serialize: (values) => {
        const { categories, ...serialized } = catListComponent.serialize?.({ ...values, categories: values?.pages }) as CategoryListValues
        return { ...serialized, pages: categories || [] }
    },
}
