import test from 'node:test';
import assert from 'node:assert/strict';
import { seedState, today, dateOffset, daysBetween } from '../src/data.js';
import * as m from '../src/model.js';
import { routes, entities } from '../src/routes.js';

const future = n => dateOffset(today(), n);
const leave = (extra = {}) => ({ employeeId: 'emp-1', type: 'Vacation Leave', start: future(35), end: future(36), reason: 'Fictional holiday', ...extra });
const claim = (extra = {}) => ({ employeeId: 'emp-1', event: 'Training', date: today(), currency: 'PHP', status: 'Submitted', notes: 'Sample', priority: 'Medium', items: [{ type: 'Meals', description: 'Demo lunch', quantity: 2, amount: 150 }], ...extra });

test('all routes have unique IDs and original screen mappings', () => {
  assert.equal(new Set(routes.map(r => r.id)).size, routes.length);
  assert.ok(routes.length >= 55);
  assert.ok(routes.every(r => r.source && r.group));
  routes.filter(r => r.kind === 'entity').forEach(r => assert.ok(entities[r.entity]));
});
test('seed keeps Charles Pura and uses fictional contact addresses', () => {
  const s = seedState(); assert.equal(m.employeeName(m.findEmployee(s, 'emp-1')), 'Charles Pura');
  assert.equal(s.users.find(u => u.id === 'user-1').username, 'admin');
  assert.ok(s.employees.every(e => e.email.endsWith('@example.com')));
});
test('date helpers handle month and year boundaries', () => {
  assert.equal(dateOffset('2026-12-31', 1), '2027-01-01');
  assert.equal(daysBetween('2026-10-30', '2026-11-02'), 4);
});
test('face and NFC clock actions share a single attendance and timesheet record', () => {
  const s = seedState(); const before = s.attendance.length;
  m.clock(s, 'emp-1', 'in', 'Face recognition (demo)', today(), '08:00');
  m.clock(s, 'emp-1', 'break-start', 'NFC (demo)', today(), '12:00');
  m.clock(s, 'emp-1', 'break-end', 'NFC (demo)', today(), '13:00');
  const row = m.clock(s, 'emp-1', 'out', 'Face recognition (demo)', today(), '17:00');
  assert.equal(s.attendance.length, before + 1); assert.equal(m.workHours(row), 8);
  assert.equal(row.review, 'Pending'); assert.ok(s.notifications.length > 2); assert.ok(s.messages.length > 0);
});
test('duplicate clock-in and invalid break order are blocked', () => {
  const s = seedState(); m.clock(s, 'emp-1', 'in', 'Manual', today(), '08:00');
  assert.throws(() => m.clock(s, 'emp-1', 'in'), /already/);
  assert.throws(() => m.clock(s, 'emp-1', 'break-end'), /Start the break/);
  m.clock(s, 'emp-1', 'break-start', 'Manual', today(), '12:00');
  assert.throws(() => m.clock(s, 'emp-1', 'out'), /End the break/);
});
test('inactive employees cannot clock in', () => { assert.throws(() => m.clock(seedState(), 'emp-11', 'in'), /active employee/); });
test('manual attendance handles overnight shifts and rejects impossible times', () => {
  const s = seedState();
  const row = m.saveAttendance(s, { employeeId: 'emp-1', date: future(20), clockIn: '22:00', clockOut: '07:00', breakStart: '02:00', breakEnd: '03:00' });
  assert.equal(m.workHours(row), 8);
  assert.throws(() => m.saveAttendance(s, { employeeId: 'emp-1', date: future(21), clockIn: '99:00' }), /valid/);
  assert.throws(() => m.saveAttendance(s, { employeeId: 'emp-1', date: '2026-02-30', clockIn: '08:00' }), /valid/);
});
test('attendance edits reset timesheet review and anomaly resolution', () => {
  const s = seedState(); const row = s.attendance.find(a => a.clockOut); row.review = 'Approved'; row.resolved = true;
  const changed = m.saveAttendance(s, { ...row, remarks: 'Adjusted times' });
  assert.equal(changed.review, 'Pending'); assert.equal(changed.resolved, false);
});
test('completed timesheets support bulk approval; incomplete sets are atomic', () => {
  const s = seedState(); const complete = s.attendance.filter(a => a.clockOut).slice(0, 3);
  m.reviewTimesheet(s, complete.map(a => a.id), 'Approved'); assert.ok(complete.every(a => a.review === 'Approved'));
  const open = s.attendance.find(a => !a.clockOut); const other = s.attendance.find(a => a.clockOut && a.review === 'Pending');
  assert.throws(() => m.reviewTimesheet(s, [other.id, open.id], 'Approved'), /completed/);
  assert.equal(other.review, 'Pending');
});
test('leave approval deducts days and cancellation restores the balance', () => {
  const s = seedState(); const row = m.saveLeave(s, leave());
  assert.equal(m.leaveBalance(s, 'emp-1', 'Vacation Leave').remaining, 15);
  m.reviewLeave(s, row.id, 'Approved'); assert.equal(m.leaveBalance(s, 'emp-1', 'Vacation Leave').remaining, 13);
  m.reviewLeave(s, row.id, 'Cancelled'); assert.equal(m.leaveBalance(s, 'emp-1', 'Vacation Leave').remaining, 15);
});
test('overlapping and overdrawn leave requests are blocked', () => {
  const s = seedState(); m.saveLeave(s, leave());
  assert.throws(() => m.saveLeave(s, leave({ start: future(36), end: future(37) })), /overlapping/);
  assert.throws(() => m.saveLeave(s, leave({ start: future(40), end: future(60) })), /balance/);
});
test('pending leave is revalidated at approval after another request uses balance', () => {
  const s = seedState();
  const first = m.saveLeave(s, leave({ start: future(30), end: future(39) }));
  const second = m.saveLeave(s, leave({ start: future(45), end: future(54) }));
  m.reviewLeave(s, first.id, 'Approved'); assert.throws(() => m.reviewLeave(s, second.id, 'Approved'), /balance/);
  assert.equal(second.status, 'Pending');
});
test('claims calculate item totals and enforce approval → paid transitions', () => {
  const s = seedState(); const row = m.saveClaim(s, claim()); assert.equal(m.claimTotal(row), 300);
  assert.throws(() => m.reviewClaim(s, row.id, 'Paid'), /transition/);
  m.reviewClaim(s, row.id, 'Approved'); m.reviewClaim(s, row.id, 'Paid'); assert.equal(row.status, 'Paid');
  assert.throws(() => m.saveClaim(s, { ...row, notes: 'Change paid record' }), /edited/);
});
test('claim approval respects committed event budget and rejection releases no funds', () => {
  const s = seedState(); s.events.find(e => e.name === 'Training').budget = 200;
  const row = m.saveClaim(s, claim()); assert.throws(() => m.reviewClaim(s, row.id, 'Approved'), /budget/);
  m.reviewClaim(s, row.id, 'Rejected'); assert.equal(row.status, 'Rejected');
});
test('claim line items require positive amounts and supported currency', () => {
  const s = seedState();
  assert.throws(() => m.saveClaim(s, claim({ items: [{ type: 'Meals', description: 'Demo', quantity: 0, amount: 100 }] })), /greater than zero/);
  assert.throws(() => m.saveClaim(s, claim({ currency: 'USD' })), /PHP/);
});
test('shift assignments block duplicates and approved leave', () => {
  const s = seedState(); const data = { employeeId: 'emp-1', shiftType: 'Morning', date: future(35) };
  m.assignShift(s, data); assert.throws(() => m.assignShift(s, data), /already exists/);
  const row = m.saveLeave(s, leave({ start: future(40), end: future(41) })); m.reviewLeave(s, row.id, 'Approved');
  assert.throws(() => m.assignShift(s, { ...data, date: future(40) }), /approved leave/);
});
test('multi-day assignment checks every date before making changes', () => {
  const s = seedState(); m.assignShift(s, { employeeId: 'emp-1', shiftType: 'Morning', date: future(36) });
  const before = s.shifts.length;
  assert.throws(() => m.assignShift(s, { employeeId: 'emp-1', shiftType: 'Morning', date: future(35), endDate: future(37) }), /already exists/);
  assert.equal(s.shifts.length, before); assert.equal(m.shiftOn(s, 'emp-1', future(35)), undefined);
});
test('shift request approval changes or removes the actual schedule', () => {
  const s = seedState(); m.assignShift(s, { employeeId: 'emp-1', shiftType: 'Morning', date: future(35) });
  m.saveShiftRequest(s, { employeeId: 'emp-1', date: future(35), type: 'Change shift', shiftType: 'Afternoon', reason: 'Demo appointment' });
  m.reviewShiftRequest(s, s.shiftRequests[0].id, 'Approved'); assert.equal(m.shiftOn(s, 'emp-1', future(35)).shiftType, 'Afternoon');
  m.saveShiftRequest(s, { employeeId: 'emp-1', date: future(35), type: 'Remove shift', reason: 'Demo removal' });
  m.reviewShiftRequest(s, s.shiftRequests[0].id, 'Approved'); assert.equal(m.shiftOn(s, 'emp-1', future(35)), undefined);
});
test('swap approvals exchange both schedules', () => {
  const s = seedState();
  m.assignShift(s, { employeeId: 'emp-1', shiftType: 'Morning', date: future(35) });
  m.assignShift(s, { employeeId: 'emp-2', shiftType: 'Night', date: future(35) });
  m.saveShiftRequest(s, { employeeId: 'emp-1', targetId: 'emp-2', type: 'Swap shift', date: future(35), reason: 'Demo swap' });
  m.reviewShiftRequest(s, s.shiftRequests[0].id, 'Approved');
  assert.equal(m.shiftOn(s, 'emp-1', future(35)).shiftType, 'Night'); assert.equal(m.shiftOn(s, 'emp-2', future(35)).shiftType, 'Morning');
});
test('custom request types use their configured behavior', () => {
  const s = seedState(); m.saveEntity(s, 'requestTypes', { name: 'Extra assignment', behavior: 'Add shift', description: 'Sample' });
  m.saveShiftRequest(s, { employeeId: 'emp-1', type: 'Extra assignment', date: future(35), shiftType: 'Night', reason: 'Demo' });
  m.reviewShiftRequest(s, s.shiftRequests[0].id, 'Approved'); assert.equal(m.shiftOn(s, 'emp-1', future(35)).shiftType, 'Night');
});
test('auto balance preserves existing assignments and approved leave', () => {
  const s = seedState(); const row = m.saveLeave(s, leave({ start: future(35), end: future(36) })); m.reviewLeave(s, row.id, 'Approved');
  const existing = structuredClone(s.shifts[0]); const n = m.autoBalance(s, future(35)); assert.ok(n > 0);
  assert.deepEqual(s.shifts.find(sh => sh.id === existing.id), existing); assert.equal(m.shiftOn(s, 'emp-1', future(35)), undefined);
  assert.equal(new Set(s.shifts.map(sh => `${sh.employeeId}-${sh.date}`)).size, s.shifts.length);
});
test('configuration renames keep references consistent', () => {
  const s = seedState(); const dept = s.departments.find(d => d.name === 'Front Office');
  m.saveEntity(s, 'departments', { ...dept, name: 'Guest Services' });
  assert.ok(s.employees.filter(e => ['emp-2', 'emp-7'].includes(e.id)).every(e => e.department === 'Guest Services'));
  assert.ok(s.positions.some(p => p.department === 'Guest Services'));
  const expense = s.expenses.find(e => e.name === 'Meals'); m.saveEntity(s, 'expenses', { ...expense, name: 'Food' });
  assert.ok(s.claims.some(c => c.items.some(i => i.type === 'Food')));
});
test('employee codes and NFC tags stay unique and positions match departments', () => {
  const s = seedState(); const row = { ...s.employees[1], id: undefined, code: 'TEST-1' };
  assert.throws(() => m.saveEntity(s, 'employees', row), /NFC/);
  assert.throws(() => m.saveEntity(s, 'employees', { ...row, nfc: '', department: 'Finance' }), /position/);
});
test('linked records and administrator are protected from deletion', () => {
  const s = seedState(); assert.throws(() => m.deleteEntity(s, 'employees', 'emp-1'), /administrator/);
  assert.throws(() => m.deleteEntity(s, 'users', 'user-1'), /administrator/);
  assert.throws(() => m.deleteEntity(s, 'employees', 'emp-2'), /linked/);
  assert.throws(() => m.deleteEntity(s, 'events', s.events.find(e => e.name === 'Training').id), /used/);
});
test('unlinked demo employee can be created, edited and deleted', () => {
  const s = seedState(); const e = m.saveEntity(s, 'employees', { ...s.employees[1], id: undefined, firstName: 'Test', code: 'DEMO-TEST', nfc: '' });
  m.saveEntity(s, 'employees', { ...e, lastName: 'Example' }); assert.equal(m.findEmployee(s, e.id).lastName, 'Example');
  m.deleteEntity(s, 'employees', e.id); assert.equal(m.findEmployee(s, e.id), undefined);
});
test('notification preferences control queues and delivery is simulated', () => {
  const s = seedState(); s.settings.emailEnabled = false; s.settings.inAppEnabled = false;
  const before = s.notifications.length; m.notify(s, 'Test', 'Fictional notification');
  assert.equal(s.notifications.length, before); assert.equal(s.messages.length, 1); assert.equal(s.messages[0].channel, 'Discord');
  assert.equal(m.processMessages(s), 1); assert.equal(s.messages[0].status, 'Delivered (demo)'); assert.equal(m.processMessages(s), 0);
});
test('budget and allowance edits cannot undercut existing approvals', () => {
  const s = seedState();
  const event = s.events.find(e => e.name === 'Team Building');
  assert.throws(() => m.saveEntity(s, 'events', { ...event, budget: 1 }), /lower than/);
  const leaveType = s.leaveTypes.find(t => t.name === 'Sick Leave');
  assert.throws(() => m.saveEntity(s, 'leaveTypes', { ...leaveType, allowance: 0 }), /lower than/);
});
test('API submissions cannot turn attachments into external network requests', () => {
  const s = seedState();
  assert.throws(() => m.saveClaim(s, claim({ attachment: { name: 'remote.pdf', data: 'https://example.com/real.pdf' } })), /locally uploaded/);
  assert.throws(() => m.saveLeave(s, leave({ attachment: { name: 'script.html', data: 'data:text/html;base64,SGk=' } })), /locally uploaded/);
});
test('admin account cannot be reassigned to another employee', () => {
  const s = seedState(); const admin = s.users.find(u => u.id === 'user-1');
  assert.throws(() => m.saveEntity(s, 'users', { ...admin, employeeId: 'emp-8' }), /Charles Pura/);
});
test('account creation and timesheet reviews feed the reference summary and notification UI', () => {
  const s = seedState();
  const user = m.saveEntity(s, 'users', { employeeId: 'emp-8', username: 'demo-amelia', email: 'amelia.ramos@example.com', role: 'Employee', status: 'Active', timezone: 'Asia/Manila', locale: 'en-PH' });
  assert.equal(user.createdAt.slice(0, 10), new Date().toISOString().slice(0, 10));
  assert.equal(user.verified, false);
  const row = s.attendance.find(a => a.clockOut);
  m.reviewTimesheet(s, [row.id], 'Approved');
  assert.equal(s.notifications[0].link, 'timesheets');
  assert.equal(s.notifications[0].title, 'Timesheets approved');
});
