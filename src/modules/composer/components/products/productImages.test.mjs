import assert from 'node:assert/strict';
import test from 'node:test';
import { composerImageFit, composerImageObjectFit, composerProductImage } from './types.ts';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const source = readFileSync(new URL('./serializeProduct.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText
    .replace("from './types'", `from '${new URL('./types.ts', import.meta.url).href}'`);
const { serializeComposerProduct } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

test('custom images take precedence and reset restores the main image', () => {
    const product = { _id: 'a', picture: { url: 'main.jpg', thumbnails: ['main-thumb.jpg'] } };
    assert.equal(composerProductImage(product), 'main-thumb.jpg');
    assert.equal(composerProductImage({ ...product, custom_picture: { url: 'custom.jpg' } }), 'custom.jpg');
    assert.equal(composerProductImage({ ...product, custom_picture: { url: 'custom.jpg', thumbnails: ['custom-thumb.jpg'] } }), 'custom-thumb.jpg');
    assert.equal(composerProductImage({ ...product, custom_picture: null }), 'main-thumb.jpg');
    assert.equal(composerProductImage({ ...product, custom_picture: {} }), 'main-thumb.jpg');
    assert.equal(composerProductImage(), '');
});

test('saving retains overrides separately and strips gallery metadata', () => {
    const saved = serializeComposerProduct({ _id: 'a', picture: { url: 'main.jpg' }, custom_picture: { url: 'custom.jpg', thumbnails: ['thumb.jpg'], __typename: 'Gallery' }, store: { price: 12 } });
    assert.equal(saved.picture.url, 'main.jpg');
    assert.equal(saved.custom_picture.url, 'custom.jpg');
    assert.equal(saved.custom_picture.__typename, undefined);
    assert.equal(saved.price, 12);
    assert.deepEqual(serializeComposerProduct({}), {});
});


test('per-product image fit serializes with a safe default and maps to web CSS', () => {
    for (const [mode, css] of [['contain', 'contain'], ['cover', 'cover'], ['stretch', 'fill'], ['center', 'scale-down']]) {
        assert.equal(serializeComposerProduct({ _id: 'a', image_fit: mode }).image_fit, mode);
        assert.equal(composerImageObjectFit(mode), css);
    }
    assert.equal(composerImageFit('invalid'), 'contain');
    assert.equal(serializeComposerProduct({ _id: 'b' }).image_fit, 'contain');
});
