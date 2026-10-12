const FIELD_LABELS: Record<string, string> = {
    title: 'Page title',
    p_limit: 'Pagination limit',
    description: 'Page description',
    scheduled_from: 'Schedule from',
    scheduled_to: 'Schedule to',
    status: 'Status',
    schedule_start: 'Schedule start',
    schedule_end: 'Schedule end',
    'styles.padding.top': 'Padding top',
    'styles.padding.right': 'Padding right',
    'styles.padding.bottom': 'Padding bottom',
    'styles.padding.left': 'Padding left',
    'values.title.text': 'Title',
    'values.columns': 'Columns',
    'values.rows': 'Rows',
    'values.gutter': 'Gutter',
    'values.navigation': 'Navigation',
    'values.autoplay': 'Auto play',
    'values.theme': 'Text color',
    'values.height': 'Height',
    'values.text': 'Text',
};

export function collectFormErrors(errors: unknown, prefix = ''): { path: string; message: string }[] {
    const list: { path: string; message: string }[] = [];
    if (errors == null || errors === false) return list;
    if (typeof errors === 'string' || typeof errors === 'number') {
        if (prefix) list.push({ path: prefix, message: String(errors) });
        return list;
    }
    if (Array.isArray(errors)) {
        errors.forEach((item, index) => {
            const next = prefix ? `${prefix}[${index}]` : `[${index}]`;
            list.push(...collectFormErrors(item, next));
        });
        return list;
    }
    if (typeof errors === 'object') {
        Object.keys(errors as Record<string, unknown>).forEach((key) => {
            const next = prefix ? `${prefix}.${key}` : key;
            list.push(...collectFormErrors((errors as Record<string, unknown>)[key], next));
        });
    }
    return list;
}

export function describeFormErrors(errors: unknown, values?: { rows?: { data?: { label?: string; desc?: string } }[] }) {
    return collectFormErrors(errors).map(({ path, message }) => ({
        path,
        detail: describeOne(path, message, values),
    }));
}

function describeOne(path: string, message: string, values?: { rows?: { data?: { label?: string; desc?: string } }[] }) {
    const row = rowContext(path, values);
    const field = fieldLabel(row ? row.rest : path);
    const problem = /^required$/i.test(String(message).trim())
        ? `${field} is required.`
        : `${field}: ${message}`;
    return row ? `Row ${row.index + 1} (${row.name}) — ${problem}` : problem;
}

function rowContext(path: string, values?: { rows?: { data?: { label?: string; desc?: string } }[] }) {
    const match = String(path).match(/^rows\[(\d+)\]\.?(.*)$/);
    if (!match) return null;
    const index = Number(match[1]);
    const row = values?.rows?.[index];
    const name = row?.data?.label || row?.data?.desc || 'Block';
    return { index, name, rest: match[2] || '' };
}

function fieldLabel(rest: string) {
    if (!rest) return 'This block';
    if (FIELD_LABELS[rest]) return FIELD_LABELS[rest];
    const product = rest.match(/^values\.products\[(\d+)\]/);
    if (product) return `Product ${Number(product[1]) + 1}`;
    const asset = rest.match(/^values\.assets\[(\d+)\]/);
    if (asset) return `Picture ${Number(asset[1]) + 1}`;
    const cleaned = rest
        .replace(/^values\./, '')
        .replace(/\[(\d+)\]/g, (_, n) => ` ${Number(n) + 1}`)
        .replace(/[._]/g, ' ')
        .trim();
    if (!cleaned) return 'This field';
    return cleaned.replace(/\b\w/g, (letter) => letter.toUpperCase());
}
