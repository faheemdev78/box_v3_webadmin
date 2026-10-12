import assert from 'node:assert/strict';
import test from 'node:test';
import { pageScheduleStatus } from './scheduleStatus.ts';

const from = '2026-09-10T10:00:00.000Z';
const to = '2026-09-10T12:00:00.000Z';

test('a page is scheduled until the from time arrives', () => {
    assert.equal(pageScheduleStatus(from, to, new Date('2026-09-10T09:59:00.000Z')), 'scheduled');
});

test('a page is active from the start instant through the end instant', () => {
    assert.equal(pageScheduleStatus(from, to, new Date(from)), 'active');
    assert.equal(pageScheduleStatus(from, to, new Date('2026-09-10T11:00:00.000Z')), 'active');
    assert.equal(pageScheduleStatus(from, to, new Date(to)), 'active');
});

test('a page is expired once the to time has passed', () => {
    assert.equal(pageScheduleStatus(from, to, new Date('2026-09-10T12:00:01.000Z')), 'expired');
});

test('missing dates do not invent a status', () => {
    assert.equal(pageScheduleStatus(null, null, new Date(from)), null);
    assert.equal(pageScheduleStatus(undefined, '', new Date(from)), null);
});

test('timestamps and extended date objects still place the page', () => {
    const fromMs = new Date(from).getTime();
    const toMs = new Date(to).getTime();
    const now = new Date('2026-09-10T11:00:00.000Z');
    assert.equal(pageScheduleStatus(fromMs, toMs, now), 'active');
    assert.equal(pageScheduleStatus(String(fromMs), String(toMs), now), 'active');
    assert.equal(pageScheduleStatus({ $date: from }, { $date: to }, now), 'active');
});

test('one bound still places the page', () => {
    const now = new Date('2026-09-10T11:00:00.000Z');
    assert.equal(pageScheduleStatus(from, null, new Date('2026-09-10T09:00:00.000Z')), 'scheduled');
    assert.equal(pageScheduleStatus(from, null, now), 'active');
    assert.equal(pageScheduleStatus(null, to, now), 'active');
    assert.equal(pageScheduleStatus(null, to, new Date('2026-09-10T13:00:00.000Z')), 'expired');
});
