export type DetailCategory = {
    _id: string
    _id_parent_cat?: string | null
    title: string
    icon_img_thumb?: string | null
    icon_img?: string | null
}

export function categoryDetailLayout(categories: DetailCategory[], categoryId?: string) {
    const subcategories = categoryId
        ? categories.filter((category) => category._id_parent_cat === categoryId && category._id !== categoryId)
        : []
    return { subcategories, columns: subcategories.length ? 2 : 3 }
}

// Include products assigned anywhere beneath the selected category.
export function categoryDetailCategoryIds(categories: DetailCategory[], categoryId?: string): string[] {
    if (!categoryId) return []
    const ids = new Set([categoryId])
    const pending = [categoryId]
    while (pending.length) {
        const parent = pending.pop()
        for (const category of categories) {
            if (category._id_parent_cat !== parent || ids.has(category._id)) continue
            ids.add(category._id)
            pending.push(category._id)
        }
    }
    return [...ids]
}
