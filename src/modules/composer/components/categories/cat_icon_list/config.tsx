import type { ComposerComponent } from '../../types'
import { catListComponent } from '../cat_list/config'
import { CategoryListPreview } from '../cat_list/Preview'
import { CategoryListProps } from '../cat_list/Props'
import { categorySlots, type CategoryListValues } from '../cat_list/types'

export const catIconListComponent: ComposerComponent<CategoryListValues> = {
    ...catListComponent,
    type: 'cat_icon_list',
    label: 'Category Icon List',
    desc: 'Grid using the icons saved on each category',
    Preview: ({ item }) => <CategoryListPreview item={item} useCategoryIcons />,
    Props: ({ item }) => <CategoryListProps item={item} useCategoryIcons />,
    serialize: (values) => ({
        ...(catListComponent.serialize?.(values) as CategoryListValues),
        categories: (values?.categories || []).slice(0, categorySlots(values)).filter((item) => item?._id).map((item) => ({
            _id: item._id,
            title: item.title || '',
            slug: item.slug || '',
            icon: item.icon || null,
            icon_img: item.icon_img || null,
            icon_img_thumb: item.icon_img_thumb || null,
        })),
    }),
}
