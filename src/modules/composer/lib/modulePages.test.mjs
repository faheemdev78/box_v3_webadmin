import assert from 'node:assert/strict';
import test from 'node:test';
import { nextModulePage, pageOfModules } from './modulePages.mjs';

test('the first composer page drops a row appended after the page size', () => {
    const modules = Array.from({ length: 11 }, (_, sort_order) => ({
        _id: `row-${sort_order}`,
        sort_order,
    }));

    const firstPage = pageOfModules(modules, 1, 10);
    assert.equal(firstPage.some((row) => row._id === 'row-10'), false);
    assert.equal(firstPage.length, 10);
    assert.equal(firstPage[0]._id, 'row-0');

    const reloaded = [
        ...pageOfModules(modules, 1, 10),
        ...pageOfModules(modules, 2, 10),
    ];
    assert.equal(reloaded.some((row) => row._id === 'row-10'), true);
});

test('module paging stops once every saved row is loaded', () => {
    assert.equal(nextModulePage({ hasNextPage: true, nextPage: 2, totalDocs: 11, page: 1 }, 10), 2);
    assert.equal(nextModulePage({ hasNextPage: false, totalDocs: 11, page: 2 }, 11), null);
    assert.equal(nextModulePage({ hasNextPage: false, totalDocs: 3, page: 1 }, 3), null);
    assert.equal(nextModulePage(null, 0), null);
});
