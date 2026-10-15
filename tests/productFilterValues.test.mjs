import assert from 'node:assert/strict';
import { test } from 'node:test';
import { productFilterToFormValues, productFormValuesToFilter } from '../src/modules/products/components/productFilterValues.js';

test('all product filters survive submission and form reinitialization', () => {
    const values = {
        search: { keywords: '  milk  ' },
        'categories*_id': '507f1f77bcf86cd799439011',
        'type*_id': '507f1f77bcf86cd799439012',
        'brand*_id': '507f1f77bcf86cd799439013',
        status: 'draft',
        temp_sensitivity: 'normal',
        unfit_for_dispatch: 'false',
        out_of_stock: true,
    };
    const filter = productFormValuesToFilter(values);
    assert.deepEqual(filter, {
        search: { keywords: 'milk' },
        'categories._id': values['categories*_id'],
        'type._id': values['type*_id'],
        'brand._id': values['brand*_id'],
        status: 'draft',
        temp_sensitivity: 'normal',
        unfit_for_dispatch: false,
        out_of_stock: true,
    });
    assert.deepEqual(productFilterToFormValues(filter), {
        ...values, search: { keywords: 'milk' },
    });
});

test('cleared fields and disabled stock switch impose no restrictions', () => {
    assert.deepEqual(productFormValuesToFilter({
        search: { keywords: '   ' },
        'categories*_id': undefined,
        'type*_id': null,
        'brand*_id': '',
        status: undefined,
        temp_sensitivity: '',
        unfit_for_dispatch: undefined,
        out_of_stock: false,
    }), {});
    assert.deepEqual(productFilterToFormValues({}), {});
});

test('dispatch Yes and No stay booleans and IDs stay strings', () => {
    for (const value of [true, false, 'true', 'false']) {
        assert.equal(productFormValuesToFilter({ unfit_for_dispatch: value }).unfit_for_dispatch,
            value === true || value === 'true');
    }
    const id = '123456789012345678901234';
    assert.equal(productFormValuesToFilter({ 'type*_id': id })['type._id'], id);
});
