import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const script = readFileSync(new URL('./migrate-manufacturer-pages.js', import.meta.url), 'utf8');

function runMigration(pages, apply = false) {
    const matches = (page, filter) => page.page_type.type === filter['page_type.type']
        && filter['page_type.page_source._id'].$in.includes(page.page_type.page_source._id)
        && !filter['page_type.page_source._id'].$nin.includes(page.page_type.page_source._id);
    vm.runInNewContext(script, {
        process: { env: { APPLY_MIGRATION: apply ? '1' : undefined } },
        print() {},
        db: {
            manufacturers: { distinct: () => ['manufacturer', 'ambiguous'] },
            product_cats: { distinct: () => ['category', 'ambiguous'] },
            app_pages: {
                countDocuments: (filter) => pages.filter((page) => matches(page, filter)).length,
                updateMany: (filter, update) => {
                    const matching = pages.filter((page) => matches(page, filter));
                    matching.forEach((page) => {
                        page.page_type.type = update.$set['page_type.type'];
                        page.page_type.title = update.$set['page_type.title'];
                    });
                    return { modifiedCount: matching.length };
                },
            },
        },
    });
}

function page(source, draft = true, type = 'store_page') {
    return { draft, page_type: { type, title: 'Store Page', page_source: { _id: source } } };
}

test('preview leaves stored pages unchanged', () => {
    const pages = [page('manufacturer'), page('manufacturer', false)];
    const before = structuredClone(pages);
    runMigration(pages);
    assert.deepEqual(pages, before);
});

test('rename includes draft and published copies and preserves category stores', () => {
    const pages = [page('manufacturer'), page('manufacturer', false), page('category'), page('ambiguous'), page('missing'), page('manufacturer', true, 'category_page')];
    runMigration(pages, true);
    assert.deepEqual(pages.map((entry) => entry.page_type.type), [
        'manufacturer_page', 'manufacturer_page', 'store_page', 'store_page', 'store_page', 'category_page',
    ]);
    assert.equal(pages[0].page_type.title, 'Manufacturer Page');
    assert.equal(pages[1].page_type.title, 'Manufacturer Page');
    const after = structuredClone(pages);
    runMigration(pages, true);
    assert.deepEqual(pages, after);
});
