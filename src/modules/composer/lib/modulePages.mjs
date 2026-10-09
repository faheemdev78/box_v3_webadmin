// The composer must read every row. The list endpoint pages by sort_order, and a new row is appended at the end.

export function pageOfModules(modules, page = 1, limit = 10) {
    const sorted = [...modules].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || String(a._id).localeCompare(String(b._id)));
    const start = Math.max(0, (page - 1) * limit);
    return sorted.slice(start, start + limit);
}

export function nextModulePage(pagination, loadedCount) {
    if (!pagination) return null;
    const total = Number(pagination.totalDocs);
    if (Number.isFinite(total) && loadedCount >= total) return null;
    if (pagination.hasNextPage && pagination.nextPage) return pagination.nextPage;
    if (Number.isFinite(total) && loadedCount < total && pagination.page) return pagination.page + 1;
    return null;
}
