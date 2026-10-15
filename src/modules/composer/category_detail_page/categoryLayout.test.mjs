import assert from 'node:assert/strict';
import test from 'node:test';
import { categoryDetailCategoryIds, categoryDetailLayout } from './categoryLayout.ts';

const categories = [
    { _id: 'sweets', title: 'Sweets & Chocolates' },
    { _id: 'chocolates', title: 'Chocolates', _id_parent_cat: 'sweets' },
    { _id: 'gift-packs', title: 'Gift Packs', _id_parent_cat: 'sweets' },
    { _id: 'milk-chocolate', title: 'Milk Chocolate', _id_parent_cat: 'chocolates' },
    { _id: 'toys', title: 'Toys' },
];

test('parent canvas lists direct children with two product columns', () => {
    const layout = categoryDetailLayout(categories, 'sweets');
    assert.equal(layout.columns, 2);
    assert.deepEqual(layout.subcategories.map((category) => category._id), ['chocolates', 'gift-packs']);
});

test('leaf category canvas uses three product columns without a sidebar', () => {
    assert.deepEqual(categoryDetailLayout(categories, 'toys'), { columns: 3, subcategories: [] });
    assert.deepEqual(categoryDetailLayout(categories), { columns: 3, subcategories: [] });
});

test('parent and subcategory product scopes include descendants without unrelated categories', () => {
    assert.deepEqual(categoryDetailCategoryIds(categories, 'sweets'), ['sweets', 'chocolates', 'gift-packs', 'milk-chocolate']);
    assert.deepEqual(categoryDetailCategoryIds(categories, 'chocolates'), ['chocolates', 'milk-chocolate']);
    assert.deepEqual(categoryDetailCategoryIds(categories), []);
});

test('malformed category cycles do not hang the canvas or duplicate product scopes', () => {
    const cycle = [
        { _id: 'a', title: 'A', _id_parent_cat: 'b' },
        { _id: 'b', title: 'B', _id_parent_cat: 'a' },
    ];
    assert.deepEqual(categoryDetailCategoryIds(cycle, 'a'), ['a', 'b']);
});
