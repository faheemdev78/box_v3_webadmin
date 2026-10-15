// Final Form treats dots as nested fields; use * for MongoDB paths in the form.
export const productFilterToFormValues = (filter = {}) => {
    const values = { ...filter }
    for (const path of ['categories._id', 'type._id', 'brand._id']) {
        if (values[path] !== undefined) {
            values[path.replaceAll('.', '*')] = values[path]
            delete values[path]
        }
    }
    if (values.unfit_for_dispatch === true || values.unfit_for_dispatch === false) {
        values.unfit_for_dispatch = String(values.unfit_for_dispatch)
    }
    return values
}

export const productFormValuesToFilter = (values = {}) => {
    const filter = {}
    for (const [key, value] of Object.entries(values)) {
        if (value === undefined || value === null || value === '') continue
        if (key === 'unfit_for_dispatch') {
            if (value === true || value === 'true') filter[key] = true
            else if (value === false || value === 'false') filter[key] = false
        } else if (key === 'out_of_stock') {
            if (value === true || value === 1) filter[key] = true
        } else if (key === 'search') {
            const keywords = value?.keywords?.trim()
            if (keywords) filter.search = { ...value, keywords }
        } else {
            filter[key.replaceAll('*', '.')] = value
        }
    }
    return filter
}
