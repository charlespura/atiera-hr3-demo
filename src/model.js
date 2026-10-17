import { today, dateOffset, daysBetween, uid } from './data.js';

export const employeeName = e => e ? `${e.firstName} ${e.lastName}` : 'Removed employee';
export const findEmployee = (s, id) => s.employees.find(e => e.id === id);
export const claimTotal = c => c.items.reduce((n, i) => n + Number(i.quantity) * Number(i.amount), 0);
export const minutes = t => t ? Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5)) : 0;
export const elapsed = (start, end) => !start || !end ? 0 : (minutes(end) - minutes(start) + 1440) % 1440;
export function workHours(row) {
  return Math.max(0, elapsed(row.clockIn, row.clockOut) - elapsed(row.breakStart, row.breakEnd)) / 60;
}
export function shiftOn(s, employeeId, date) { return s.shifts.find(r => r.employeeId === employeeId && r.date === date); }
export function attendanceIssue(s, row) {
  if (row.resolved) return '';
  if (!row.clockOut && row.date < today()) return 'Missing clock out';
  if (row.clockOut && workHours(row) < 8) return 'Short shift';
  const shift = shiftOn(s, row.employeeId, row.date);
  if (shift && minutes(row.clockIn) > minutes(shift.start) && minutes(row.clockIn) - minutes(shift.start) < 720) return 'Late arrival';
  if (row.clockOut && (!row.breakStart || !row.breakEnd)) return 'Missing break';
  return '';
}
export function leaveBalance(s, employeeId, type, excludeId = '') {
  const config = s.leaveTypes.find(t => t.name === type);
  const custom = s.leaveBalances.find(b => b.employeeId === employeeId && b.type === type);
  const allowance = Number(custom?.allowance ?? config?.allowance ?? 0);
  const used = s.leaves.filter(l => l.id !== excludeId && l.employeeId === employeeId && l.type === type && l.status === 'Approved' && l.start.slice(0, 4) === today().slice(0, 4)).reduce((n, l) => n + daysBetween(l.start, l.end), 0);
  return { allowance, used, remaining: allowance - used };
}
export function requireThat(condition, message) { if (!condition) throw new Error(message); }
function validateAttachment(value, imageOnly = false) {
  if (!value) return;
  requireThat(typeof value === 'object' && typeof value.name === 'string' && typeof value.data === 'string' && /^data:(image\/(png|jpeg|webp)|application\/pdf|text\/plain);base64,/.test(value.data), 'Use a locally uploaded image, PDF or text sample.');
  requireThat(value.data.length <= 2 * 1024 * 1024 * 1.34 + 200, 'Use an attachment smaller than 2 MB.');
  if (imageOnly) requireThat(/^data:image\/(png|jpeg|webp);base64,/.test(value.data), 'Use a PNG, JPG or WebP profile photo.');
}
function validDate(date) { return /^\d{4}-\d{2}-\d{2}$/.test(date || '') && !Number.isNaN(Date.parse(`${date}T12:00:00Z`)) && new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) === date; }
function validTime(time) { return /^([01]\d|2[0-3]):[0-5]\d$/.test(time || ''); }
function activeEmployee(s, id) { const e = findEmployee(s, id); requireThat(e && e.status === 'Active', 'Choose an active employee.'); return e; }
export function audit(s, action, module, detail = '') {
  s.audit.unshift({ id: uid('audit'), date: new Date().toISOString(), actor: 'Charles Pura', action, module, detail });
  s.audit = s.audit.slice(0, 500);
}
export function notify(s, title, message, link = 'dashboard') {
  if (s.settings.inAppEnabled) s.notifications.unshift({ id: uid('notice'), title, message, link, date: new Date().toISOString(), read: false });
  const channels = [];
  if (s.settings.emailEnabled) channels.push('Email');
  if (s.settings.discordEnabled) channels.push('Discord');
  for (const channel of channels) s.messages.unshift({ id: uid('message'), channel, to: channel === 'Email' ? s.settings.emailFrom : `#${s.settings.discordChannel}`, subject: title, body: message, date: new Date().toISOString(), status: 'Queued (demo)' });
  s.messages = s.messages.slice(0, 500);
}
export function clock(s, employeeId, action, method = 'Manual', date = today(), time = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date())) {
  const e = activeEmployee(s, employeeId);
  requireThat(validDate(date) && validTime(time), 'A valid date and time are required.');
  let row = s.attendance.find(a => a.employeeId === employeeId && a.date === date);
  if (action === 'in') {
    requireThat(!row, 'This employee has already clocked in on this date.');
    row = { id: uid('att'), employeeId, date, clockIn: time, clockOut: '', breakStart: '', breakEnd: '', method, remarks: '', review: 'Pending', resolved: false };
    s.attendance.unshift(row);
  } else {
    requireThat(row && !row.clockOut, 'Clock in first, or choose an employee with an open attendance record.');
    if (action === 'break-start') {
      requireThat(!row.breakStart, 'A break has already been recorded.');
      row.breakStart = time;
    } else if (action === 'break-end') {
      requireThat(row.breakStart && !row.breakEnd, 'Start the break first.');
      row.breakEnd = time;
    } else if (action === 'out') {
      requireThat(!row.breakStart || row.breakEnd, 'End the break before clocking out.');
      row.clockOut = time;
    } else throw new Error('Unknown clock action.');
    row.review = 'Pending';
  }
  audit(s, `Clock ${action}`, 'Attendance', `${employeeName(e)} · ${method}`);
  notify(s, action === 'in' ? 'Employee clocked in' : 'Attendance updated', `${employeeName(e)} · ${time} · ${method}`, 'attendance');
  return row;
}
export function saveAttendance(s, data) {
  activeEmployee(s, data.employeeId);
  requireThat(validDate(data.date) && validTime(data.clockIn), 'Enter a valid work date and clock-in time.');
  for (const key of ['clockOut', 'breakStart', 'breakEnd']) requireThat(!data[key] || validTime(data[key]), 'Enter valid attendance times.');
  requireThat(!data.breakEnd || data.breakStart, 'A break end needs a break start.');
  requireThat(!data.clockOut || !data.breakStart || data.breakEnd, 'End the break before clocking out.');
  if (data.clockOut) {
    const total = elapsed(data.clockIn, data.clockOut);
    requireThat(total > 0 && total <= 16 * 60, 'A completed shift must be longer than zero and at most 16 hours. Overnight shifts are supported.');
    if (data.breakStart && data.breakEnd) requireThat(elapsed(data.clockIn, data.breakStart) + elapsed(data.breakStart, data.breakEnd) <= total, 'The break must fall within the shift.');
  }
  requireThat(!s.attendance.some(a => a.id !== data.id && a.employeeId === data.employeeId && a.date === data.date), 'An attendance record already exists for this employee and date.');
  const old = s.attendance.find(a => a.id === data.id);
  const row = { ...old, ...data, id: data.id || uid('att'), method: old?.method || 'Manual', review: 'Pending', resolved: false };
  if (old) s.attendance[s.attendance.indexOf(old)] = row; else s.attendance.unshift(row);
  audit(s, old ? 'Updated attendance' : 'Added attendance', 'Attendance', row.id);
  return row;
}
function checkLeave(s, data) {
  activeEmployee(s, data.employeeId);
  requireThat(s.leaveTypes.some(t => t.name === data.type), 'Choose a configured leave type.');
  requireThat(validDate(data.start) && validDate(data.end) && data.end >= data.start, 'The end date must be on or after the start date.');
  requireThat(data.start.slice(0, 4) === data.end.slice(0, 4), 'Submit separate leave requests for different calendar years.');
  requireThat(daysBetween(data.start, data.end) <= 365, 'Leave cannot exceed one calendar year.');
  requireThat(String(data.reason || '').trim(), 'Enter a reason for the leave.');
  requireThat(!s.leaves.some(l => l.id !== data.id && l.employeeId === data.employeeId && ['Pending', 'Approved'].includes(l.status) && l.start <= data.end && l.end >= data.start), 'This employee already has an overlapping leave request.');
  const currentYear = data.start.slice(0, 4);
  const config = s.leaveTypes.find(t => t.name === data.type);
  const allowance = Number(s.leaveBalances.find(b => b.employeeId === data.employeeId && b.type === data.type)?.allowance ?? config.allowance);
  const used = s.leaves.filter(l => l.id !== data.id && l.employeeId === data.employeeId && l.type === data.type && l.status === 'Approved' && l.start.slice(0, 4) === currentYear).reduce((n, l) => n + daysBetween(l.start, l.end), 0);
  requireThat(daysBetween(data.start, data.end) <= allowance - used, 'The requested days exceed the available leave balance.');
}
export function saveLeave(s, data) {
  const old = s.leaves.find(l => l.id === data.id);
  requireThat(!old || old.status === 'Pending', 'Only pending leave requests can be edited.');
  checkLeave(s, data);
  validateAttachment(data.attachment);
  const row = { ...old, ...data, id: data.id || uid('leave'), status: 'Pending', approvedBy: '', attachment: data.attachment ?? old?.attachment ?? null };
  if (old) s.leaves[s.leaves.indexOf(old)] = row; else s.leaves.unshift(row);
  audit(s, 'Saved leave request', 'Leave', employeeName(findEmployee(s, row.employeeId)));
  notify(s, 'Leave request submitted', `${employeeName(findEmployee(s, row.employeeId))} · ${row.type} · ${daysBetween(row.start, row.end)} day(s)`, 'leaves');
  return row;
}
export function reviewLeave(s, id, status) {
  const row = s.leaves.find(l => l.id === id);
  requireThat(row && ['Pending', 'Approved'].includes(row.status), 'This leave request cannot be changed.');
  requireThat(['Approved', 'Rejected', 'Cancelled'].includes(status), 'Invalid leave decision.');
  requireThat(row.status === 'Pending' || status === 'Cancelled', 'An approved leave can only be cancelled.');
  if (status === 'Approved') checkLeave(s, row);
  row.status = status; row.approvedBy = 'Charles Pura';
  audit(s, `Leave ${status.toLowerCase()}`, 'Leave', id);
  notify(s, `Leave ${status.toLowerCase()}`, `${employeeName(findEmployee(s, row.employeeId))} · ${row.type}`, 'leaves');
}
export function saveClaim(s, data) {
  activeEmployee(s, data.employeeId);
  const old = s.claims.find(c => c.id === data.id);
  requireThat(!old || ['Initiated', 'Submitted'].includes(old.status), 'Only draft and submitted claims can be edited.');
  requireThat(s.events.some(e => e.name === data.event) && validDate(data.date), 'Choose a configured event and valid date.');
  requireThat(data.currency === 'PHP', 'This demo uses PHP currency for consistent budgets.');
  requireThat(Array.isArray(data.items) && data.items.length > 0, 'Add at least one expense.');
  for (const item of data.items) {
    requireThat(s.expenses.some(e => e.name === item.type), 'Choose a configured expense type.');
    requireThat(String(item.description || '').trim(), 'Describe every expense.');
    requireThat(Number.isFinite(Number(item.quantity)) && Number(item.quantity) > 0 && Number.isFinite(Number(item.amount)) && Number(item.amount) > 0, 'Quantities and unit amounts must be greater than zero.');
  }
  requireThat(['Initiated', 'Submitted'].includes(data.status), 'Save the claim as a draft or submitted request.');
  validateAttachment(data.attachment);
  const row = { ...old, ...data, id: data.id || uid('CLM'), attachment: data.attachment ?? old?.attachment ?? null };
  if (old) s.claims[s.claims.indexOf(old)] = row; else s.claims.unshift(row);
  audit(s, 'Saved claim', 'Claims', row.id);
  if (row.status === 'Submitted') notify(s, 'Claim submitted', `${employeeName(findEmployee(s, row.employeeId))} · PHP ${claimTotal(row).toFixed(2)}`, 'claims');
  return row;
}
export function reviewClaim(s, id, status) {
  const row = s.claims.find(c => c.id === id);
  const allowed = { Initiated: ['Submitted', 'Cancelled'], Submitted: ['Approved', 'Rejected', 'Cancelled'], Approved: ['Paid', 'Cancelled'] };
  requireThat(row && allowed[row.status]?.includes(status), 'That claim status transition is not available.');
  if (status === 'Approved') {
    const budget = Number(s.events.find(e => e.name === row.event)?.budget || 0);
    const spent = s.claims.filter(c => c.id !== id && c.event === row.event && ['Approved', 'Paid'].includes(c.status)).reduce((sum, c) => sum + claimTotal(c), 0);
    requireThat(spent + claimTotal(row) <= budget, 'This claim exceeds the remaining event budget. Increase the demo budget in Event Type first.');
  }
  row.status = status;
  audit(s, `Claim ${status.toLowerCase()}`, 'Claims', id);
  notify(s, `Claim ${status.toLowerCase()}`, `${employeeName(findEmployee(s, row.employeeId))} · PHP ${claimTotal(row).toFixed(2)}`, 'claims');
}
export function assignShift(s, data, replace = false) {
  activeEmployee(s, data.employeeId);
  const type = s.shiftTypes.find(t => t.name === data.shiftType);
  const end = data.endDate || data.date;
  requireThat(type && validDate(data.date) && validDate(end) && end >= data.date, 'Choose a shift and valid date range.');
  requireThat(daysBetween(data.date, end) <= 62, 'Assign up to 62 days at a time.');
  const days = Array.from({ length: daysBetween(data.date, end) }, (_, i) => dateOffset(data.date, i));
  for (const date of days) {
    requireThat(!s.leaves.some(l => l.employeeId === data.employeeId && l.status === 'Approved' && l.start <= date && l.end >= date), `This employee is on approved leave on ${date}.`);
    requireThat(replace || !shiftOn(s, data.employeeId, date), `A shift already exists on ${date}. Edit the existing schedule or use a shift request.`);
  }
  for (const date of days) {
    const old = shiftOn(s, data.employeeId, date);
    const row = { id: old?.id || uid('shift'), employeeId: data.employeeId, date, shiftType: type.name, start: type.start, end: type.end, note: data.note || '' };
    if (old) s.shifts[s.shifts.indexOf(old)] = row; else s.shifts.push(row);
  }
  audit(s, 'Assigned shift', 'Shift & Schedule', `${data.employeeId} · ${days.length} day(s)`);
  notify(s, 'Shift assigned', `${employeeName(findEmployee(s, data.employeeId))} · ${type.name} · ${data.date}`, 'schedules');
}
export function saveShiftRequest(s, data) {
  activeEmployee(s, data.employeeId);
  const config = s.requestTypes.find(t => t.name === data.type);
  const behavior = config?.behavior || config?.name;
  requireThat(['Add shift', 'Change shift', 'Remove shift', 'Swap shift'].includes(behavior), 'Choose a supported request type.');
  requireThat(validDate(data.date) && String(data.reason || '').trim(), 'Enter a valid date and reason.');
  if (behavior === 'Swap shift') requireThat(data.targetId && data.targetId !== data.employeeId && findEmployee(s, data.targetId)?.status === 'Active', 'Choose another active employee for the swap.');
  if (['Add shift', 'Change shift'].includes(behavior)) requireThat(s.shiftTypes.some(t => t.name === data.shiftType), 'Choose a configured shift type.');
  const row = { ...data, id: uid('req'), status: 'Pending' };
  s.shiftRequests.unshift(row); audit(s, 'Submitted shift request', 'Shift & Schedule', row.id);
  notify(s, 'Shift request submitted', `${employeeName(findEmployee(s, data.employeeId))} · ${data.type}`, 'shift-requests');
}
export function reviewShiftRequest(s, id, status) {
  const row = s.shiftRequests.find(r => r.id === id);
  requireThat(row?.status === 'Pending' && ['Approved', 'Rejected'].includes(status), 'This shift request has already been reviewed.');
  if (status === 'Approved') {
    activeEmployee(s, row.employeeId);
    const current = shiftOn(s, row.employeeId, row.date);
    const config = s.requestTypes.find(t => t.name === row.type);
    const behavior = config?.behavior || config?.name;
    requireThat(['Add shift', 'Change shift', 'Remove shift', 'Swap shift'].includes(behavior), 'This request type has no configured behavior.');
    if (behavior === 'Add shift') assignShift(s, { ...row, note: row.reason });
    else if (behavior === 'Change shift') { requireThat(current, 'There is no existing shift to change.'); assignShift(s, { ...row, note: row.reason }, true); }
    else if (behavior === 'Remove shift') { requireThat(current, 'There is no existing shift to remove.'); s.shifts = s.shifts.filter(r => r.id !== current.id); }
    else {
      activeEmployee(s, row.targetId);
      const target = shiftOn(s, row.targetId, row.date);
      requireThat(current && target, 'Both employees need a shift on the swap date.');
      requireThat(!s.leaves.some(l => [row.employeeId, row.targetId].includes(l.employeeId) && l.status === 'Approved' && l.start <= row.date && l.end >= row.date), 'An employee is on approved leave on the swap date.');
      [current.employeeId, target.employeeId] = [target.employeeId, current.employeeId];
    }
  }
  row.status = status; audit(s, `Shift request ${status.toLowerCase()}`, 'Shift & Schedule', id);
  notify(s, `Shift request ${status.toLowerCase()}`, row.reason, 'shift-requests');
}
export function autoBalance(s, start) {
  requireThat(validDate(start), 'Choose a valid week start.');
  requireThat(s.shiftTypes.length, 'Create a shift type first.');
  let count = 0;
  const active = s.employees.filter(e => e.status === 'Active');
  for (let d = 0; d < 7; d++) active.forEach((e, i) => {
    const date = dateOffset(start, d);
    if (shiftOn(s, e.id, date) || s.leaves.some(l => l.employeeId === e.id && l.status === 'Approved' && l.start <= date && l.end >= date)) return;
    const type = s.shiftTypes[(i + d) % s.shiftTypes.length];
    s.shifts.push({ id: uid('shift'), employeeId: e.id, date, shiftType: type.name, start: type.start, end: type.end, note: 'Auto balanced (demo)' }); count++;
  });
  audit(s, 'Auto balanced shifts', 'Shift & Schedule', `${count} assignments`);
  notify(s, 'Shift auto balance complete', `${count} unassigned employee-days filled.`, 'schedules');
  return count;
}
export function reviewTimesheet(s, ids, status) {
  requireThat(['Approved', 'Rejected', 'Pending'].includes(status), 'Invalid timesheet status.');
  requireThat(ids.length, 'Select at least one timesheet.');
  const rows = ids.map(id => s.attendance.find(a => a.id === id));
  requireThat(rows.every(Boolean), 'A selected timesheet no longer exists.');
  requireThat(status !== 'Approved' || rows.every(r => r.clockOut && (!r.breakStart || r.breakEnd)), 'Only completed timesheets can be approved.');
  rows.forEach(r => { r.review = status; });
  audit(s, `Timesheets ${status.toLowerCase()}`, 'Timesheet', `${ids.length} record(s)`);
  notify(s, `Timesheets ${status.toLowerCase()}`, `${ids.length} attendance record(s) reviewed by Charles Pura.`, 'timesheets');
}

const nameReferences = {
  departments: [['employees', 'department'], ['positions', 'department']], positions: [['employees', 'position']],
  leaveTypes: [['leaves', 'type'], ['leaveBalances', 'type']], shiftTypes: [['shifts', 'shiftType'], ['shiftRequests', 'shiftType']],
  events: [['claims', 'event']], expenses: [], roles: [['users', 'role']], requestTypes: [['shiftRequests', 'type']], statusTypes: []
};
export function saveEntity(s, entity, data) {
  requireThat(Array.isArray(s[entity]), 'Unknown data collection.');
  const old = s[entity].find(r => r.id === data.id);
  const row = { ...old, ...data, id: data.id || uid(entity) };
  if (nameReferences[entity]) {
    requireThat(String(row.name || '').trim(), 'Enter a name.');
    row.name = row.name.trim();
    requireThat(!s[entity].some(r => r.id !== row.id && r.name.toLowerCase() === row.name.toLowerCase()), 'This name already exists.');
    if (entity === 'roles' && old?.name === 'Admin') requireThat(row.name === 'Admin', 'Keep the Admin role for the demo login.');
    if (entity === 'statusTypes' && old && ['Pending', 'Approved', 'Rejected', 'Cancelled'].includes(old.name)) requireThat(row.name === old.name, 'Keep the built-in workflow status name. Its description can be edited.');
    if (old && old.name !== row.name) {
      for (const [collection, key] of nameReferences[entity]) s[collection].forEach(r => { if (r[key] === old.name) r[key] = row.name; });
      if (entity === 'expenses') s.claims.forEach(c => c.items.forEach(i => { if (i.type === old.name) i.type = row.name; }));
    }
  }
  for (const key of ['allowance', 'budget', 'salary', 'radius']) if (key in row) requireThat(Number.isFinite(Number(row[key])) && Number(row[key]) >= 0, `${key} must be a non-negative number.`);
  if (entity === 'leaveTypes') requireThat(Number.isFinite(Number(row.allowance)) && Number(row.allowance) >= 0, 'Enter a non-negative annual allowance.');
  if (entity === 'events') requireThat(Number.isFinite(Number(row.budget)) && Number(row.budget) >= 0, 'Enter a non-negative event budget.');
  if (entity === 'leaveTypes' && old) {
    for (const employee of s.employees) {
      if (s.leaveBalances.some(b => b.employeeId === employee.id && b.type === row.name)) continue;
      requireThat(Number(row.allowance) >= leaveBalance(s, employee.id, row.name).used, 'The default allowance cannot be lower than days already approved for an employee.');
    }
  }
  if (entity === 'events' && old) {
    const committed = s.claims.filter(c => c.event === row.name && ['Approved', 'Paid'].includes(c.status)).reduce((sum, c) => sum + claimTotal(c), 0);
    requireThat(Number(row.budget) >= committed, 'The event budget cannot be lower than approved and paid claims.');
  }
  if (entity === 'shiftTypes') requireThat(validTime(row.start) && validTime(row.end) && row.start !== row.end, 'Enter different, valid shift start and end times.');
  if (entity === 'requestTypes') requireThat(['Add shift', 'Change shift', 'Remove shift', 'Swap shift'].includes(row.behavior), 'Choose the behavior for this request type.');
  if (entity === 'employees') {
    requireThat(row.firstName?.trim() && row.lastName?.trim() && row.code?.trim(), 'Employee code, first name and last name are required.');
    requireThat(!s.employees.some(e => e.id !== row.id && e.code.toLowerCase() === row.code.toLowerCase()), 'That employee code already exists.');
    requireThat(!row.nfc || !s.employees.some(e => e.id !== row.id && e.nfc === row.nfc), 'That NFC tag is assigned to another employee.');
    requireThat(s.departments.some(d => d.name === row.department) && s.positions.some(p => p.name === row.position && p.department === row.department), 'Choose a position belonging to the selected department.');
    requireThat(validDate(row.hireDate) && (!row.birthDate || validDate(row.birthDate)), 'Enter valid employee dates.');
    requireThat(['Active', 'Inactive'].includes(row.status) && ['Full-time', 'Part-time', 'Contract'].includes(row.employment), 'Choose a valid employee status and employment type.');
    requireThat(Number.isFinite(Number(row.salary)) && Number(row.salary) >= 0 && row.email, 'Enter a salary and example employee email.');
    validateAttachment(row.photo, true);
    if (row.id === 'emp-1') requireThat(row.firstName === 'Charles' && row.lastName === 'Pura' && row.status === 'Active', 'Keep Charles Pura as the active demo administrator.');
  }
  if (entity === 'positions') requireThat(s.departments.some(d => d.name === row.department), 'Choose a configured department.');
  if (entity === 'holidays') requireThat(validDate(row.date) && row.name?.trim(), 'Enter a holiday name and valid date.');
  if (entity === 'locations') requireThat(row.name?.trim() && Number(row.latitude) >= -90 && Number(row.latitude) <= 90 && Number(row.longitude) >= -180 && Number(row.longitude) <= 180 && Number(row.radius) > 0, 'Enter valid coordinates and a radius greater than zero.');
  if (entity === 'leaveBalances') {
    requireThat(findEmployee(s, row.employeeId) && s.leaveTypes.some(t => t.name === row.type), 'Choose an employee and leave type.');
    requireThat(!s.leaveBalances.some(b => b.id !== row.id && b.employeeId === row.employeeId && b.type === row.type), 'Edit the existing allowance for this employee and leave type.');
    requireThat(Number(row.allowance) >= leaveBalance(s, row.employeeId, row.type).used, 'The allowance cannot be lower than the approved days already used.');
  }
  if (entity === 'users') {
    requireThat(findEmployee(s, row.employeeId), 'Choose an employee.');
    requireThat(row.username?.trim() && s.roles.some(r => r.name === row.role), 'Enter a username and configured role.');
    requireThat(row.email && ['Active', 'Inactive'].includes(row.status), 'Enter an example email and valid account status.');
    requireThat(!s.users.some(u => u.id !== row.id && (u.username.toLowerCase() === row.username.toLowerCase() || u.employeeId === row.employeeId)), 'This username or employee already has an account.');
    if (row.id === 'user-1') requireThat(row.username === 'admin' && row.role === 'Admin' && row.status === 'Active' && row.employeeId === 'emp-1', 'The demo administrator must remain Charles Pura, active, with username admin.');
    if (!old) { row.verified = false; row.createdAt = new Date().toISOString(); }
  }
  if (row.email) requireThat(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email), 'Enter a valid email address.');
  if (old) s[entity][s[entity].indexOf(old)] = row; else s[entity].unshift(row);
  audit(s, old ? 'Updated record' : 'Created record', entity, row.name || row.code || row.username || row.id);
  return row;
}
export function deleteEntity(s, entity, id) {
  const row = s[entity]?.find(r => r.id === id);
  requireThat(row, 'This record no longer exists.');
  requireThat(!(entity === 'employees' && id === 'emp-1') && !(entity === 'users' && id === 'user-1') && !(entity === 'roles' && row.name === 'Admin'), 'The demo administrator cannot be deleted.');
  if (entity === 'statusTypes') requireThat(!['Pending', 'Approved', 'Rejected', 'Cancelled'].includes(row.name), 'Built-in workflow statuses cannot be deleted.');
  if (entity === 'employees') requireThat(!['attendance', 'shifts', 'leaves', 'claims', 'users', 'leaveBalances', 'shiftRequests'].some(c => s[c].some(r => r.employeeId === id || r.targetId === id)), 'This employee has linked records. Set their status to Inactive instead.');
  for (const [collection, key] of nameReferences[entity] || []) requireThat(!s[collection].some(r => r[key] === row.name), 'This configuration is used by existing records. Update those records first.');
  if (entity === 'expenses') requireThat(!s.claims.some(c => c.items.some(i => i.type === row.name)), 'This expense type is used by an existing claim.');
  s[entity] = s[entity].filter(r => r.id !== id);
  audit(s, 'Deleted record', entity, row.name || row.code || id);
}
export function queueMessage(s, data) {
  requireThat(['Email', 'Discord'].includes(data.channel), 'Choose Email or Discord.');
  requireThat(data.to?.trim() && data.subject?.trim() && data.body?.trim(), 'Recipient, subject and message are required.');
  if (data.channel === 'Email') requireThat(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.to), 'Enter a valid example email address.');
  s.messages.unshift({ ...data, id: uid('message'), status: 'Queued (demo)', date: new Date().toISOString() });
  audit(s, 'Queued demo message', data.channel, data.subject);
}
export function processMessages(s, channel = '') {
  let count = 0;
  s.messages.forEach(m => { if ((!channel || m.channel === channel) && m.status === 'Queued (demo)') { m.status = 'Delivered (demo)'; m.deliveredAt = new Date().toISOString(); count++; } });
  audit(s, 'Processed simulated outbox', channel || 'Integrations', `${count} message(s)`);
  return count;
}
