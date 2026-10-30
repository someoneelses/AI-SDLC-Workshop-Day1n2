import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateNextDueDate,generateCalendarGrid,describeDue,parseSingapore,parseExportTimestamp,singaporeDateKey} from '../../lib/timezone';
test('daily and weekly recurrence cross the year in Singapore time',()=>{assert.equal(calculateNextDueDate('2026-12-31T09:00','daily'),'2027-01-01T09:00:00');assert.equal(calculateNextDueDate('2026-12-31T09:00','weekly'),'2027-01-07T09:00:00')});
test('monthly and yearly recurrence clamp invalid dates',()=>{assert.equal(calculateNextDueDate('2024-01-31T09:00','monthly'),'2024-02-29T09:00:00');assert.equal(calculateNextDueDate('2023-01-31T09:00','monthly'),'2023-02-28T09:00:00');assert.equal(calculateNextDueDate('2024-02-29T09:00','yearly'),'2025-02-28T09:00:00')});
test('calendar grids contain complete weeks, leap day and adjacent months',()=>{const feb=generateCalendarGrid(2024,2);assert.equal(feb.length%7,0);assert.ok(feb.some(d=>d.date==='2024-02-29'));assert.equal(generateCalendarGrid(2026,2).length,35);assert.equal(generateCalendarGrid(2026,5).length,42)});
test('due descriptions classify overdue and upcoming times',()=>{const now=parseSingapore('2026-10-30T10:00');assert.equal(describeDue('2026-10-30T09:00',now).level,'overdue');assert.equal(describeDue('2026-10-30T10:30',now).level,'urgent');assert.equal(describeDue('2026-11-10T10:00',now).level,'later')});
test('due descriptions keep their classifications and Singapore labels at time boundaries',()=>{
  const now=parseSingapore('2026-10-30T10:00');
  const soon=describeDue('2026-10-31T09:59',now);
  const upcoming=describeDue('2026-10-31T10:00',now);
  const later=describeDue('2026-11-06T10:00',now);
  assert.equal(soon.level,'soon');assert.match(soon.text,/SGT/);
  assert.equal(upcoming.level,'upcoming');assert.match(upcoming.text,/SGT/);
  assert.deepEqual(later,{text:'Due 2026-11-06 10:00 (SGT)',level:'later'});
});
test('invalid calendar dates are rejected',()=>{assert.ok(Number.isNaN(parseSingapore('2025-02-29T12:00').getTime()));assert.ok(Number.isNaN(parseSingapore('2026-04-31T12:00').getTime()));assert.ok(Number.isNaN(parseSingapore('2026-01-01T25:00').getTime()))});
test('export timestamps preserve the instant and reject invalid dates',()=>{assert.equal(parseExportTimestamp('2020-01-01 00:00:00'),'2020-01-01 00:00:00');assert.equal(parseExportTimestamp('2020-01-01T08:00:00+08:00'),'2020-01-01 00:00:00');assert.equal(parseExportTimestamp('2020-02-30T00:00:00Z'),null)});
test('calendar day uses Singapore for offset-based dates',()=>{assert.equal(singaporeDateKey('2099-02-15T17:30:00Z'),'2099-02-16');assert.equal(singaporeDateKey('2099-02-15T17:30'),'2099-02-15')});
