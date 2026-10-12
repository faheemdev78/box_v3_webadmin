import assert from 'node:assert/strict';
import test from 'node:test';
import { describeFormErrors } from './formErrors.ts';

test('names the row, the block, and the missing field', () => {
    const errors = {
        rows: [
            null,
            {
                status: 'Required',
                values: { title: { text: 'Required' } },
                styles: { padding: { top: 'Required' } },
            },
        ],
    };
    const values = {
        rows: [
            { data: { label: 'Banner' } },
            { data: { label: 'Product list' } },
        ],
    };

    const lines = describeFormErrors(errors, values).map((item) => item.detail);
    assert.deepEqual(lines, [
        'Row 2 (Product list) — Status is required.',
        'Row 2 (Product list) — Title is required.',
        'Row 2 (Product list) — Padding top is required.',
    ]);
});

test('keeps a non-required message and names page fields', () => {
    const lines = describeFormErrors({
        p_limit: 'Should be greater than 0',
        title: 'Required',
    }, {}).map((item) => item.detail);

    assert.deepEqual(lines, [
        'Pagination limit: Should be greater than 0',
        'Page title is required.',
    ]);
});
