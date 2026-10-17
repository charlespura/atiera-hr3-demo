export const VERSION = 1;
export function today() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
export function dateOffset(date, days) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
export function daysBetween(start, end) {
  return Math.round((new Date(`${end}T00:00:00Z`) - new Date(`${start}T00:00:00Z`)) / 86400000) + 1;
}
export function uid(prefix = 'record') { return `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`; }
export function seedState(day = today()) {
  const employees = [
    ['Charles', 'Pura', 'Human Resources', 'HR Administrator', 42000],
    ['Maya', 'Santos', 'Front Office', 'Front Desk Associate', 24000],
    ['Ethan', 'Reyes', 'Housekeeping', 'Room Attendant', 22000],
    ['Sofia', 'Cruz', 'Food & Beverage', 'Restaurant Supervisor', 32000],
    ['Liam', 'Navarro', 'Kitchen', 'Chef de Partie', 30000],
    ['Isabella', 'Flores', 'Finance', 'Accountant', 35000],
    ['Noah', 'Garcia', 'Front Office', 'Front Desk Associate', 24000],
    ['Amelia', 'Ramos', 'Housekeeping', 'Room Attendant', 22000],
    ['Lucas', 'Torres', 'Food & Beverage', 'Service Associate', 23000],
    ['Aria', 'Rivera', 'Kitchen', 'Commis Chef', 25000],
    ['Oliver', 'Lim', 'Security', 'Security Officer', 24000],
    ['Chloe', 'Castillo', 'Human Resources', 'HR Associate', 27000]
  ].map(([firstName, lastName, department, position, salary], i) => ({
    id: `emp-${i + 1}`, code: `ATI-${String(i + 1).padStart(4, '0')}`, firstName, lastName, department, position, salary,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`, phone: '0900 000 0000',
    address: 'Demo City, Philippines', hireDate: dateOffset(day, -30 - i * 17), birthDate: `199${i % 9}-05-15`,
    gender: i % 2 ? 'Female' : 'Male', employment: 'Full-time', status: i === 10 ? 'Inactive' : 'Active',
    nfc: `DEMO-NFC-${String(i + 1).padStart(3, '0')}`, photo: ''
  }));
  const attendance = [];
  for (let d = -14; d <= 0; d++) {
    employees.filter(e => e.status === 'Active' && (e.id !== 'emp-1' || d < 0)).forEach((e, i) => {
      if ((i + d + 28) % 11 === 0) return;
      const late = (i + d + 28) % 9 === 0;
      const incomplete = d === -2 && i === 3;
      attendance.push({ id: `att-${d + 14}-${e.id}`, employeeId: e.id, date: dateOffset(day, d), clockIn: late ? '08:25' : '08:00', clockOut: d === 0 || incomplete ? '' : '17:00', breakStart: d === 0 ? '' : '12:00', breakEnd: d === 0 ? '' : '13:00', method: i % 2 ? 'Face recognition (demo)' : 'NFC (demo)', remarks: late ? 'Late arrival' : '', review: 'Pending', resolved: false });
    });
  }
  const shifts = [];
  for (let d = -14; d < 14; d++) employees.filter(e => e.status === 'Active').forEach((e, i) => {
    if ((i + d + 28) % 8 === 0) return;
    shifts.push({ id: `shift-${d + 14}-${e.id}`, employeeId: e.id, date: dateOffset(day, d), shiftType: i % 4 === 0 ? 'Afternoon' : 'Morning', start: i % 4 === 0 ? '14:00' : '08:00', end: i % 4 === 0 ? '23:00' : '17:00', note: '' });
  });
  return {
    version: VERSION, seededOn: day, employees, attendance, shifts,
    users: employees.slice(0, 7).map((e, i) => ({ id: `user-${i + 1}`, employeeId: e.id, username: i === 0 ? 'admin' : e.firstName.toLowerCase(), email: e.email, role: i === 0 ? 'Admin' : i === 3 ? 'Manager' : 'Employee', status: 'Active', verified: i !== 5, timezone: 'Asia/Manila', locale: 'en-PH', createdAt: e.hireDate })),
    departments: [...new Set(employees.map(e => e.department))].map((name, i) => ({ id: `dept-${i}`, name, description: `${name} department` })),
    positions: [...new Map(employees.map(e => [e.position, e])).values()].map((e, i) => ({ id: `pos-${i}`, name: e.position, department: e.department, description: '' })),
    leaveTypes: [{ id: 'lt-1', name: 'Vacation Leave', allowance: 15, paid: 'Yes' }, { id: 'lt-2', name: 'Sick Leave', allowance: 15, paid: 'Yes' }, { id: 'lt-3', name: 'Emergency Leave', allowance: 5, paid: 'Yes' }, { id: 'lt-4', name: 'Unpaid Leave', allowance: 30, paid: 'No' }],
    leaveBalances: [],
    leaves: [
      { id: 'leave-1', employeeId: 'emp-2', type: 'Vacation Leave', start: dateOffset(day, 3), end: dateOffset(day, 5), reason: 'Family holiday (fictional)', status: 'Pending', approvedBy: '', attachment: null },
      { id: 'leave-2', employeeId: 'emp-4', type: 'Sick Leave', start: dateOffset(day, -7), end: dateOffset(day, -6), reason: 'Rest and recovery (fictional)', status: 'Approved', approvedBy: 'Charles Pura', attachment: null },
      { id: 'leave-3', employeeId: 'emp-6', type: 'Vacation Leave', start: dateOffset(day, 8), end: dateOffset(day, 9), reason: 'Personal travel (fictional)', status: 'Approved', approvedBy: 'Charles Pura', attachment: null },
      { id: 'leave-4', employeeId: 'emp-9', type: 'Emergency Leave', start: dateOffset(day, -3), end: dateOffset(day, -3), reason: 'Personal matters (fictional)', status: 'Rejected', approvedBy: 'Charles Pura', attachment: null }
    ],
    shiftTypes: [{ id: 'st-1', name: 'Morning', start: '08:00', end: '17:00', color: '#3b82f6' }, { id: 'st-2', name: 'Afternoon', start: '14:00', end: '23:00', color: '#8b5cf6' }, { id: 'st-3', name: 'Night', start: '22:00', end: '07:00', color: '#f59e0b' }],
    shiftRequests: [{ id: 'req-1', employeeId: 'emp-3', type: 'Change shift', date: dateOffset(day, 2), shiftType: 'Afternoon', targetId: '', reason: 'Personal appointment (fictional)', status: 'Pending' }],
    requestTypes: ['Add shift', 'Change shift', 'Remove shift', 'Swap shift'].map((name, i) => ({ id: `rt-${i}`, name, behavior: name, description: '' })),
    statusTypes: ['Pending', 'Approved', 'Rejected', 'Cancelled'].map((name, i) => ({ id: `status-${i}`, name, description: '' })),
    holidays: [{ id: 'holiday-1', name: 'Demo Hotel Anniversary', date: dateOffset(day, 7), type: 'Special Holiday' }],
    events: ['Training', 'Business Travel', 'Team Building', 'Office Supplies'].map((name, i) => ({ id: `event-${i}`, name, budget: 25000, description: '' })),
    expenses: ['Transportation', 'Meals', 'Accommodation', 'Supplies'].map((name, i) => ({ id: `expense-${i}`, name, description: '' })),
    claims: [
      { id: 'CLM-0001', employeeId: 'emp-2', event: 'Training', date: dateOffset(day, -2), currency: 'PHP', status: 'Submitted', notes: 'Front office training (fictional)', priority: 'Medium', items: [{ type: 'Transportation', description: 'Demo taxi receipt', quantity: 2, amount: 350 }], attachment: null },
      { id: 'CLM-0002', employeeId: 'emp-4', event: 'Team Building', date: dateOffset(day, -5), currency: 'PHP', status: 'Approved', notes: 'Restaurant team workshop (fictional)', priority: 'High', items: [{ type: 'Meals', description: 'Demo team lunch', quantity: 10, amount: 250 }], attachment: null },
      { id: 'CLM-0003', employeeId: 'emp-6', event: 'Office Supplies', date: dateOffset(day, -8), currency: 'PHP', status: 'Paid', notes: 'Finance stationery (fictional)', priority: 'Low', items: [{ type: 'Supplies', description: 'Demo stationery', quantity: 5, amount: 180 }], attachment: null },
      { id: 'CLM-0004', employeeId: 'emp-5', event: 'Business Travel', date: dateOffset(day, -10), currency: 'PHP', status: 'Rejected', notes: 'Sample rejected claim', priority: 'Medium', items: [{ type: 'Accommodation', description: 'Demo hotel', quantity: 1, amount: 3000 }], attachment: null }
    ],
    roles: [{ id: 'role-1', name: 'Admin', description: 'All administration modules' }, { id: 'role-2', name: 'Manager', description: 'Department management (sample account only)' }, { id: 'role-3', name: 'Employee', description: 'Employee record (sample account only)' }],
    locations: [{ id: 'loc-1', name: 'Atiera Main Office', latitude: 14.5995, longitude: 120.9842, radius: 200, status: 'Active' }],
    notifications: [{ id: 'notice-1', title: 'Welcome to HR3', message: 'Explore the complete admin demo. All employees and transactions are fictional.', date: new Date().toISOString(), read: false, link: 'dashboard' }, { id: 'notice-2', title: 'Leave request awaiting review', message: 'Maya Santos submitted a vacation leave request.', date: new Date().toISOString(), read: false, link: 'leaves' }],
    audit: [{ id: 'audit-1', date: new Date().toISOString(), actor: 'System', action: 'Created fictional demo data', module: 'System', detail: 'Browser-local demo initialized' }],
    loginLogs: [], messages: [], syncLogs: [], chat: [],
    settings: { theme: 'light', collapsed: false, twoFactor: false, discordConnected: false, pdfPasswordEnabled: false, pdfPassword: '', emailEnabled: true, discordEnabled: true, inAppEnabled: true, fontSize: 'Normal', reduceMotion: false, highContrast: false, emailHost: 'smtp.demo.invalid', emailPort: 587, emailFrom: 'hr3@example.com', emailName: 'Atiera HR3', discordChannel: 'hr3-demo-notifications', firebaseProject: 'atiera-demo', syncEnabled: true },
    profile: { firstName: 'Charles', lastName: 'Pura', email: 'charles.pura@example.com', phone: '0900 000 0000', address: 'Demo City, Philippines', timezone: 'Asia/Manila', locale: 'en-PH', bio: 'HR3 System Administrator' }, cloudSnapshot: null
  };
}
