// Page schedule status is derived from the stored instants and the clock passed in.
// "scheduled" means the start has not arrived. "active" means now is inside the window.
// "expired" means the end has already passed. A missing bound does not invent a window.
export function pageScheduleStatus(from: unknown, to: unknown, now: unknown = new Date()) {
    const startMs = instantMs(from);
    const endMs = instantMs(to);
    const nowMs = instantMs(now);
    if (nowMs == null) return null;
    if (startMs == null && endMs == null) return null;
    if (endMs != null && nowMs > endMs) return 'expired';
    if (startMs != null && nowMs < startMs) return 'scheduled';
    return 'active';
}

export function instantMs(value: any): number | null {
    if (value == null || value === '') return null;
    if (value instanceof Date) return finiteMs(value.getTime());
    if (typeof value === 'number') return finiteMs(value);
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return null;
        if (/^\d{11,}$/.test(trimmed)) return finiteMs(Number(trimmed));
        const parsed = Date.parse(trimmed);
        return finiteMs(parsed);
    }
    if (typeof value === 'object') {
        if (value.$date != null) return instantMs(value.$date);
        if (value._isAMomentObject && typeof value.valueOf === 'function') return finiteMs(value.valueOf());
        if (value.$d instanceof Date) return instantMs(value.$d);
        if (typeof value.toDate === 'function') {
            const date = value.toDate();
            if (date && date !== value) return instantMs(date);
        }
        if (typeof value.valueOf === 'function') {
            const inner = value.valueOf();
            if (inner !== value) return instantMs(inner);
        }
    }
    return null;
}

function finiteMs(value: unknown) {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
}
