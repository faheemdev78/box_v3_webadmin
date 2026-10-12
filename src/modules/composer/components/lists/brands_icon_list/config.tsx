import type { ComposerComponent } from '../../types'
import { catIconListComponent } from '../../categories/cat_icon_list/config'
import { CategoryListPreview } from '../../categories/cat_list/Preview'
import { CategoryListProps } from '../../categories/cat_list/Props'
import type { CategoryListValues } from '../../categories/cat_list/types'

const { categories: _categories, ...defaults } = catIconListComponent.defaults

export const brandsIconListComponent: ComposerComponent<CategoryListValues> = {
    ...catIconListComponent,
    type: 'brands_icon_list',
    label: 'Brands Icon List',
    category: 'lists',
    desc: 'Grid using the icons saved on each brand',
    defaults: { ...defaults, brands: [] },
    Preview: ({ item }) => <CategoryListPreview item={item} useCategoryIcons entity="brand" />,
    Props: ({ item }) => <CategoryListProps item={item} useCategoryIcons entity="brand" />,
    serialize: (values) => {
        const { categories, ...serialized } = catIconListComponent.serialize?.({ ...values, categories: values?.brands }) as CategoryListValues
        return { ...serialized, brands: categories || [] }
    },
}
