import assert from 'node:assert/strict'
import test from 'node:test'
import { settleCoverPosition, stepToSlide, wrapOffset } from './coverflowMotion.ts'

test('offsets wrap so the row never runs out of pictures', () => {
    assert.equal(wrapOffset(0, 5, 3), 1)
    assert.equal(wrapOffset(2, 5, 3), 0)
    assert.equal(stepToSlide(5, 0, 3), 6)
})

test('a leftward flick advances, and the index can keep climbing', () => {
    assert.equal(settleCoverPosition(4, -40, -0.8, 120), 5)
    assert.equal(settleCoverPosition(20, -200, -0.2, 120), 22)
})

test('a small nudge without a flick stays on the current picture', () => {
    assert.equal(settleCoverPosition(3, 6, 0, 120), 3)
    assert.equal(settleCoverPosition(3, 30, 0.1, 120), 3)
})
