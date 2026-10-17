import { seedState, today, uid, VERSION } from './data.js';
import * as model from './model.js';
import { loadState, persistState, storageMode } from './storage.js';
import { routes, groups, entities, getRoute, field } from './routes.js';
import * as ui from './ui.js';
import { renderView, forms, claimForm, expenseItem } from './views.js';
import { headerDate, clockTime, themeControl, loginMarkup, faceMarkup, landingMarkup, phoneMarkup, phoneContent, notificationPopover, chatPanelMarkup } from './presentation.js';

const { esc, icon, button, link, card, badge, notice, person, avatar, money, fmtDate, fmtTime, formHtml, fieldHtml, tableHtml } = ui;
const app = document.getElementById('app');
const modal = document.getElementById('modal');
let state;
let authenticated = sessionStorage.getItem('atiera-demo-session') === 'admin' || localStorage.getItem('atiera-demo-remember') === 'true';
let activeRoute = getRoute('dashboard');
let params = new URLSearchParams();
let ctx = { report: null, revealed: false };
let mutationQueue = Promise.resolve();
let confirmation;
let loginPending = false;
let mobileOpen = false;
let profileOpen = false;
let notificationOpen = false;
let chatOpen = false;
let chatExpanded = false;
let chatDraft = '';
let dialogOpener;

function toast(message, error = false) {
  const el = document.createElement('div'); el.className = `toast${error ? ' error' : ''}`;
  el.innerHTML = `${icon(error ? 'alert' : 'check')}<span>${esc(message)}</span>`;
  document.getElementById('toasts').append(el); setTimeout(() => el.remove(), error ? 6500 : 4000);
}
async function commit(change, message = '', redraw = true) {
  const operation = mutationQueue.then(async () => {
    const draft = structuredClone(state);
    const result = await change(draft);
    await persistState(draft);
    state = draft;
    if (redraw) render();
    if (message) toast(typeof message === 'function' ? message(result) : message);
    return result;
  });
  mutationQueue = operation.catch(() => {});
  return operation;
}
function openModal(title, body) {
  dialogOpener = document.activeElement;
  if (modal.open) modal.close();
  modal.innerHTML = `<div class="modal-header"><h2 id="modal-title">${title}</h2>${button('', 'close-modal', 'aria-label="Close dialog"', 'ghost', 'close')}</div><div class="modal-body">${body}</div>`;
  modal.showModal();
}
function closeModal() { if (modal.open) modal.close(); }
modal.addEventListener('close', () => { if (dialogOpener?.isConnected) dialogOpener.focus(); });
modal.addEventListener('click', e => { if (e.target === modal) { const bounds = modal.getBoundingClientRect(); if (e.clientX < bounds.left || e.clientX > bounds.right || e.clientY < bounds.top || e.clientY > bounds.bottom) closeModal(); } });
function confirmAction(title, description, callback, danger = false) {
  confirmation = callback;
  openModal(title, `<p class="confirm-copy">${description}</p><p id="confirm-error" class="form-error" hidden role="alert"></p><div class="modal-footer">${button('Cancel', 'close-modal', '', 'secondary')}${button('Confirm', 'confirm', '', danger ? 'danger' : 'primary', 'check')}</div>`);
}
function navigate(id, values) {
  const query = values instanceof URLSearchParams ? values.toString() : new URLSearchParams(values || {}).toString();
  const hash = `#/${id}${query ? `?${query}` : ''}`;
  if (location.hash === hash) render(); else location.hash = hash;
}
function applyAppearance() {
  document.documentElement.dataset.theme = state.settings.theme;
  document.documentElement.classList.toggle('reduce-motion', state.settings.reduceMotion);
  document.documentElement.classList.toggle('high-contrast', state.settings.highContrast);
  document.documentElement.classList.toggle('large-text', state.settings.fontSize === 'Large');
}
function loginView() {
  document.title = 'ATIERA — Secure Login · Demo';
  document.body.dataset.page = 'login';
  app.innerHTML = loginMarkup(state);
}
function render() {
  if (!state) return;
  applyAppearance();
  const hash = location.hash.replace(/^#\/?/, '') || 'dashboard';
  const [requested, query] = hash.split('?');
  params = new URLSearchParams(query || '');
  let requestedRoute;
  try { requestedRoute = getRoute(decodeURIComponent(requested)); } catch { requestedRoute = null; }
  activeRoute = requestedRoute || getRoute('dashboard');
  ctx.report = null; ctx.entity = null;
  if (['face', 'mobile'].includes(activeRoute.id)) {
    document.body.dataset.page = activeRoute.id;
    document.title = `${activeRoute.title} | ATIERA HR3 Demo`;
    app.innerHTML = activeRoute.id === 'face' ? faceMarkup(state, params, authenticated) : landingMarkup(state, authenticated);
    return;
  }
  if (!authenticated) {
    if (['terms', 'privacy'].includes(activeRoute.id)) {
      document.body.dataset.page = 'document';
      app.innerHTML = `<main class="public-document" id="main-content">${link('login', '← Back to Login', 'btn secondary')}${renderView(state, activeRoute, params, ctx)}</main>`;
    } else loginView();
    return;
  }
  document.body.dataset.page = activeRoute.id;
  const group = groups.find(g => g.id === activeRoute.group);
  const groupRoutes = routes.filter(r => r.group === activeRoute.group && !r.hidden && r.id !== 'dashboard');
  const tabRoutes = groupRoutes.filter(r => !r.configure && r.id !== 'create-user');
  const configRoutes = groupRoutes.filter(r => r.configure);
  const unread = state.notifications.filter(n => !n.read).length;
  const title = activeRoute.id === 'dashboard' ? 'Hr3 Dashboard' : activeRoute.id === 'users' ? 'User Management | Profile' : `${group.name} | ${activeRoute.title}`;
  document.title = `${activeRoute.title} | ATIERA HR3 Demo`;
  let content;
  try { content = renderView(state, activeRoute, params, ctx); }
  catch (error) { content = card('Unable to display this screen', notice(esc(error.message), 'warning') + button('Return to Dashboard', 'go-dashboard', '', 'primary')); console.error(error); }
  app.innerHTML = `<div class="app-shell ${state.settings.collapsed ? 'collapsed' : ''} ${mobileOpen ? 'sidebar-open' : ''} ${state.settings.focusMode ? 'focus-mode' : ''}"><button class="sidebar-backdrop" data-action="close-sidebar" aria-label="Close navigation"></button><aside class="sidebar" aria-label="Main navigation"><a class="sidebar-brand" href="#/dashboard"><img src="./assets/${state.settings.collapsed && innerWidth > 700 ? 'logo2' : 'logo'}.png" alt="Atiera HR3"></a>${button('', 'collapse-sidebar', 'aria-label="Collapse navigation"', 'sidebar-collapse', 'chevron')}<nav class="sidebar-nav">${button(`${icon('search')}<span>Global Search…</span>`, 'search', '', 'sidebar-search')}${groups.filter(g => g.id !== 'settings').map(g => `<a href="#/${g.home}" title="${g.name}" class="sidebar-link ${g.id === activeRoute.group ? 'active' : ''}" style="--nav-color:${g.color}" ${g.id === activeRoute.group ? 'aria-current="page"' : ''}>${icon(g.icon)}<span class="sidebar-text">${g.name}</span></a>`).join('')}</nav><img class="sidebar-watermark" src="./assets/logo.png" alt=""></aside><div class="workspace"><header class="topbar">${button('', 'open-sidebar', 'aria-label="Open navigation"', 'icon-btn mobile-menu', 'menu')}<div class="topbar-title"><h1 id="main-content-title">${esc(title)}</h1></div><div class="header-actions"><time class="header-clock" data-live-header>${headerDate()}</time>${button('', 'fullscreen', 'aria-label="Toggle fullscreen" title="Fullscreen"', 'header-utility', 'fullscreen')}${button('', 'focus', `aria-label="Toggle focus mode" title="Focus mode" aria-pressed="${!!state.settings.focusMode}"`, 'header-utility', 'focus')}${themeControl(state)}<button type="button" class="notification-button header-utility" data-action="notification-menu" aria-label="Notifications, ${unread} unread" aria-expanded="${notificationOpen}">${icon('bell')}${unread ? `<span class="notification-count">${unread > 99 ? '99+' : unread}</span>` : ''}</button><button class="profile-button" data-action="profile-menu" aria-label="Open account menu" aria-expanded="${profileOpen}"><span class="profile-avatar-wrap">${avatar(state.employees.find(e => e.id === 'emp-1'))}<i></i></span><div><strong>Charles Pura</strong><small><span>Admin</span><i>•</i> HR3</small></div>${icon('down')}</button></div></header><div id="header-popovers">${profileOpen ? profileMenu() : ''}${notificationOpen ? notificationPopover(state) : ''}</div><div class="demo-strip" hidden>${icon('shield')}<span>Portfolio Demo · Fictional data · Changes stay in your browser</span></div>${tabRoutes.length ? `<nav class="subnav" aria-label="${esc(group.name)} submodules">${tabRoutes.map(r => link(r.id, `${icon(r.id.includes('log') ? 'refresh' : r.id.includes('profile') || r.id === 'users' ? 'user' : group.icon)}${esc(r.title)}`, activeRoute.id === r.id ? 'active' : '')).join('')}${configRoutes.length ? `<details><summary>${icon('settings')}Configure ${icon('down')}</summary><div class="configure-menu">${configRoutes.map(r => link(r.id, esc(r.title))).join('')}</div></details>` : ''}</nav>` : ''}<main id="main-content" class="page-content ${activeRoute.id === 'dashboard' ? 'dashboard-content' : ''}" tabindex="-1">${content}</main><footer class="footer"><span>© ${today().slice(0, 4)} ATIERA Hotel & Restaurant · Portfolio Demo by Charles Pura · Browser-local data</span><span>${link('settings', 'Settings')} · ${link('health', 'Reset / Backup')} · ${link('help', 'Help')} · ${link('mobile', 'Download App')}</span></footer></div>${chatOpen ? chatPanelMarkup(state, chatExpanded) : ''}${button(`<img src="./assets/logo2.png" alt=""><span>Chat</span>`, 'chat', `aria-label="Open HR assistant" aria-expanded="${chatOpen}"`, 'floating-chat')}${button('', 'accessibility', 'aria-label="Accessibility settings"', 'icon-btn floating-help', 'accessibility')}<nav class="mobile-bottom-nav" aria-label="Quick modules">${[['attendance', 'Time', 'clock'], ['schedule', 'Shift', 'calendar'], ['timesheets', 'Timesheet', 'file'], ['leaves', 'Leave', 'plane'], ['claims', 'Claims', 'money']].map(([id, title, symbol]) => link(id, `${icon(symbol)}${title}`, activeRoute.id === id ? 'active' : '')).join('')}</nav></div>`;
  if (chatOpen) { refreshChat(); const input = document.querySelector('.chat-form input'); if (input) input.value = chatDraft; }
  if (storageMode !== 'IndexedDB') {
    const strip = document.querySelector('.demo-strip'); strip.hidden = false;
    strip.querySelector('span').textContent = 'Temporary mode: browser storage is unavailable; demo changes will reset when this page closes.';
  }
  if (activeRoute.kind === 'health') document.getElementById('storage-status').textContent = storageMode;
  updateDependentPositions(document.querySelector('form[data-entity="employees"]'));
}
function refreshHeaderPanels() {
  const root = document.getElementById('header-popovers');
  if (root) root.innerHTML = `${profileOpen ? profileMenu() : ''}${notificationOpen ? notificationPopover(state) : ''}`;
  document.querySelector('[data-action="profile-menu"]')?.setAttribute('aria-expanded', String(profileOpen));
  document.querySelector('[data-action="notification-menu"]')?.setAttribute('aria-expanded', String(notificationOpen));
}
function profileMenu() {
  return `<div class="profile-menu">${link('profile', `${icon('users')}My Profile`)}${link('preferences', `${icon('bell')}Notification Preferences`)}${link('settings', `${icon('settings')}Settings`)}${link('help', `${icon('help')}System Help`)}${state.settings.focusMode ? button(`${icon('focus')}Exit Focus Mode`, 'focus') : ''}${button(`${icon('logout')}Sign Out`, 'logout')}</div>`;
}
function entityForm(entity, id = '', defaults = {}) {
  const config = entities[entity];
  if (!config) throw new Error('This collection is not editable here.');
  const old = state[entity].find(e => e.id === id);
  if (id && !old) throw new Error('Record no longer exists.');
  const defaultsByEntity = { employees: { hireDate: today(), status: 'Active', employment: 'Full-time', salary: 24000 }, users: { status: 'Active', timezone: 'Asia/Manila', locale: 'en-PH', role: 'Employee' }, shiftTypes: { start: '08:00', end: '17:00', color: '#3b82f6' }, locations: { status: 'Active', latitude: 14.5995, longitude: 120.9842, radius: 200 }, leaveTypes: { allowance: 15, paid: 'Yes' } };
  openModal(`${old ? 'Edit' : 'Add'} ${esc(config.title)}`, formHtml(config.fields, { ...defaultsByEntity[entity], ...defaults, ...old }, state, 'entity', `data-entity="${esc(entity)}" data-id="${esc(id)}"`));
  updateDependentPositions(modal.querySelector('form'));
}
function updateDependentPositions(form) {
  if (!form || form.dataset.entity !== 'employees') return;
  const department = form.elements.department?.value; const select = form.elements.position; if (!select) return;
  const selected = select.value;
  const positions = state.positions.filter(p => p.department === department);
  select.innerHTML = `<option value="">Select position…</option>${positions.map(p => `<option value="${esc(p.name)}" ${p.name === selected ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}`;
}
function dataDetails(data, keys) {
  return `<dl class="definition-grid">${keys.map(([key, label, transform]) => `<div><dt>${esc(label)}</dt><dd>${transform ? transform(data[key]) : esc(data[key] || '—')}</dd></div>`).join('')}</dl>`;
}
function employeeDetail(id) {
  const e = model.findEmployee(state, id); if (!e) throw new Error('Employee not found.');
  openModal('Employee Details', `<div class="detail-banner">${avatar(e, true)}<div><h2>${esc(model.employeeName(e))}</h2><p>${esc(e.code)} · ${esc(e.position)}</p>${badge(e.status)}</div></div>${dataDetails(e, [['department', 'Department'], ['email', 'Email'], ['phone', 'Phone'], ['address', 'Address'], ['hireDate', 'Hire Date', fmtDate], ['salary', 'Monthly Salary', money], ['employment', 'Employment Type'], ['nfc', 'Demo NFC Tag']])}<div class="button-row" style="margin-top:25px">${button('Edit Employee', 'entity-form', `data-entity="employees" data-id="${esc(id)}"`, 'primary', 'edit')}${link(`attendance?employee=${id}`, 'Attendance', 'btn secondary')}${link(`claims?employee=${id}`, 'Claims', 'btn secondary')}${link(`face?employee=${id}`, 'Face Clock', 'btn secondary')}</div>`);
}
function attendanceDetail(id) {
  const a = state.attendance.find(a => a.id === id); if (!a) throw new Error('Attendance not found.');
  openModal('Attendance / Timesheet Details', `<div class="detail-banner">${person(model.findEmployee(state, a.employeeId))}<span class="right">${badge(a.review)}</span></div>${dataDetails(a, [['date', 'Work Date', fmtDate], ['method', 'Clock Method'], ['clockIn', 'Clock In'], ['clockOut', 'Clock Out'], ['breakStart', 'Break Start'], ['breakEnd', 'Break End'], ['remarks', 'Remarks']])}<div class="setting-row"><span>Net Work Hours</span><strong>${model.workHours(a).toFixed(2)}</strong></div>${model.attendanceIssue(state, a) ? notice(esc(model.attendanceIssue(state, a)), 'warning') : ''}<div class="button-row" style="margin-top:20px">${button('Edit Attendance', 'attendance-form', `data-id="${esc(id)}"`, 'primary', 'edit')}${button('Export PDF', 'record-pdf', `data-entity="attendance" data-id="${esc(id)}"`, 'secondary', 'file')}</div>`);
}
function leaveDetail(id) {
  const l = state.leaves.find(l => l.id === id); if (!l) throw new Error('Leave not found.');
  openModal('Leave Request Details', `<div class="detail-banner">${person(model.findEmployee(state, l.employeeId))}<span class="right">${badge(l.status)}</span></div>${dataDetails(l, [['type', 'Leave Type'], ['start', 'Start Date', fmtDate], ['end', 'End Date', fmtDate], ['reason', 'Reason'], ['approvedBy', 'Approved By']])}<div class="setting-row"><span>Requested Days</span><strong>${daysCount(l)}</strong></div><div class="button-row">${l.attachment ? button('Download Attachment', 'attachment', `data-entity="leaves" data-id="${esc(id)}"`, 'secondary', 'download') : ''}${button('Export PDF', 'record-pdf', `data-entity="leaves" data-id="${esc(id)}"`, 'secondary', 'file')}</div>`);
}
function daysCount(l) { return Math.round((Date.parse(l.end) - Date.parse(l.start)) / 86400000) + 1; }
function claimDetail(id) {
  const c = state.claims.find(c => c.id === id); if (!c) throw new Error('Claim not found.');
  openModal('Claim Details', `<div class="detail-banner">${person(model.findEmployee(state, c.employeeId))}<span class="right">${badge(c.status)}</span></div>${dataDetails(c, [['id', 'Reference'], ['event', 'Event'], ['date', 'Claim Date', fmtDate], ['currency', 'Currency'], ['priority', 'Priority'], ['notes', 'Notes']])}${tableHtml(['Expense', 'Description', 'Qty', 'Unit Amount', 'Total'], c.items.map(i => ({ cells: [esc(i.type), esc(i.description), esc(i.quantity), money(i.amount), money(i.quantity * i.amount)] })))}<div class="claim-total">Total<strong>${money(model.claimTotal(c))}</strong></div><div class="button-row">${c.attachment ? button('Download Receipt', 'attachment', `data-entity="claims" data-id="${esc(id)}"`, 'secondary', 'download') : ''}${button('Export PDF', 'record-pdf', `data-entity="claims" data-id="${esc(id)}"`, 'secondary', 'file')}</div>`);
}
function showSearch() {
  openModal('Global Search', `<input id="global-search" class="search-input" type="search" placeholder="Search modules, employees, or claims…" aria-label="Global search" autocomplete="off"><div id="global-results" class="search-results"></div>`);
  updateSearch(''); document.getElementById('global-search').focus();
}
function updateSearch(query) {
  const q = query.toLowerCase().trim();
  const found = routes.filter(r => `${r.title} ${r.group}`.toLowerCase().includes(q)).map(r => ({ route: r.id, title: r.title, sub: groups.find(g => g.id === r.group)?.name, symbol: 'file' }));
  if (q) {
    state.employees.filter(e => `${model.employeeName(e)} ${e.code} ${e.department}`.toLowerCase().includes(q)).forEach(e => found.unshift({ route: `employees?q=${encodeURIComponent(model.employeeName(e))}`, title: model.employeeName(e), sub: `${e.code} · ${e.department}`, symbol: 'users' }));
    state.claims.filter(c => `${c.id} ${c.event}`.toLowerCase().includes(q)).forEach(c => found.push({ route: `claims?q=${encodeURIComponent(c.id)}`, title: c.id.slice(0, 20), sub: c.event, symbol: 'money' }));
  }
  const results = document.getElementById('global-results');
  if (results) results.innerHTML = found.slice(0, 20).map(x => link(x.route, `${icon(x.symbol)}<div>${esc(x.title)}<small>${esc(x.sub)}</small></div>`)).join('') || ui.empty('No matching results');
}
function showChat() {
  chatOpen = true;
  document.querySelector('.chat-panel')?.remove();
  document.querySelector('.app-shell')?.insertAdjacentHTML('beforeend', chatPanelMarkup(state, chatExpanded));
  refreshChat();
  const input = document.querySelector('.chat-form input');
  if (input) { input.value = chatDraft; input.focus(); }
  document.querySelector('.floating-chat')?.setAttribute('aria-expanded', 'true');
}
function refreshChat() {
  const log = document.getElementById('chat-log'); if (!log) return;
  log.innerHTML = `<div class="chat-bubble">Hello, Charles! I can help with employees, attendance, scheduling, timesheets, leave, claims and the demo integrations. What would you like to explore?</div>${state.chat.map(m => `<div class="chat-bubble ${m.role === 'user' ? 'user' : ''}">${esc(m.text)}</div>`).join('')}`;
  log.scrollTop = log.scrollHeight;
}
function chatAnswer(message) {
  const q = message.toLowerCase();
  if (/leave|balance|vacation/.test(q)) return `There are ${state.leaves.filter(l => l.status === 'Pending').length} pending leave requests. Open Leave Management → Assign Leave to review them. Approved leave deducts the employee's balance. Cancelling an approved request restores it.`;
  if (/claim|expense|reimburs|budget/.test(q)) return `There are ${state.claims.filter(c => c.status === 'Submitted').length} claims awaiting approval. Total demo claims: ${money(state.claims.reduce((n, c) => n + model.claimTotal(c), 0))}. Open Claims & Reimbursement to review, approve and mark paid. Event Type controls the approval budget.`;
  if (/face|nfc|clock|attend/.test(q)) return `${state.attendance.filter(a => a.date === today()).length} employees have attendance today. Open Time and Attendance → Face Recognition or NFC Clock In / Out. Select an employee and action, then click Simulate. Charles Pura's NFC example is DEMO-NFC-001.`;
  if (/shift|schedul|holiday/.test(q)) return `${state.shifts.filter(sh => sh.date === today()).length} shifts are assigned today. Click an empty day in Assign Shift or use Shift Auto Balance to fill a week. Shift requests can add, change, remove or swap schedules.`;
  if (/employee|staff|user/.test(q)) return `The demo contains ${state.employees.length} employees and ${state.users.length} sample accounts. Add and edit staff in Employee. Keep admin / admin for demo login. Charles Pura remains the administrator.`;
  if (/time.?sheet|hour|report|export|pdf/.test(q)) return 'Timesheets are calculated from attendance, subtracting completed breaks. You can approve completed shifts, reject records, review a 15-day summary, or export filtered tables as CSV and PDF. Demo PDF password settings do not encrypt exports.';
  if (/discord|email|fire|api|cloud|sync/.test(q)) return 'Connected services are simulated locally. Email/Discord use the Notification Outbox. Firestore reads demo collections. API Explorer supports local GET/POST. Cloud Sync copies records to a second local snapshot. No real credentials are required.';
  if (/reset|backup|github|deploy/.test(q)) return 'Monitoring & Maintenance has reset, JSON backup and restore. To publish, copy the contents of portfolio-demo into your repository root and enable GitHub Pages from the main branch. See README.md in the demo folder.';
  return 'Choose a topic: employees, face/NFC attendance, shifts, timesheets, leave balances, claims, email, Discord, Firestore or backup. The System Help page also includes a walkthrough of all demo workflows.';
}
function accessibilityDialog() {
  const toggle = (key, label, value) => `<div class="setting-row"><label for="a11y-${key}">${label}</label><input id="a11y-${key}" type="checkbox" class="toggle" data-setting="${key}" ${value ? 'checked' : ''}></div>`;
  openModal('Accessibility', toggle('darkMode', 'Dark Mode', state.settings.theme === 'dark') + toggle('highContrast', 'High Contrast', state.settings.highContrast) + toggle('reduceMotion', 'Reduce Motion', state.settings.reduceMotion) + toggle('largeText', 'Larger Text', state.settings.fontSize === 'Large'));
}
function selectedIds() { return [...document.querySelectorAll('#main-content [data-select]:checked')].map(el => el.dataset.select); }
function updateSelection() {
  const selected = selectedIds(); const bar = document.getElementById('bulk-bar'); const count = document.getElementById('selected-count');
  if (bar) bar.hidden = !selected.length; if (count) count.textContent = selected.length;
  const all = document.querySelector('[data-select-all]'); const boxes = [...document.querySelectorAll('#main-content [data-select]')];
  if (all) { all.checked = !!boxes.length && boxes.every(b => b.checked); all.indeterminate = !!selected.length && !all.checked; }
}
function updateClaimTotal(form) {
  if (!form) return;
  const total = [...form.querySelectorAll('.expense-row')].reduce((sum, row) => sum + Number(row.querySelector('[name=itemQuantity]').value || 0) * Number(row.querySelector('[name=itemAmount]').value || 0), 0);
  const label = form.querySelector('#claim-total'); if (label) label.textContent = money(total);
}
async function attachmentFrom(input) {
  const file = input?.files?.[0]; if (!file) return undefined;
  model.requireThat(file.size <= 2 * 1024 * 1024, 'Use a sample file smaller than 2 MB.');
  const allowed = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf', 'text/plain'];
  model.requireThat(allowed.includes(file.type), 'Use a PNG, JPG, WebP, PDF or text attachment.');
  if (input.name === 'photo') model.requireThat(file.type.startsWith('image/'), 'Choose a PNG, JPG or WebP profile photo.');
  const data = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });
  return { name: file.name, type: file.type, data };
}
async function readForm(form) {
  const data = {};
  for (const input of form.elements) {
    if (!input.name || input.disabled) continue;
    if (input.type === 'file') { const file = await attachmentFrom(input); if (file) data[input.name] = file; }
    else if (input.type === 'checkbox') data[input.name] = input.checked;
    else if (input.type === 'number') data[input.name] = input.value === '' ? '' : Number(input.value);
    else data[input.name] = typeof input.value === 'string' ? input.value.trim() : input.value;
  }
  return data;
}
function formError(form, error) {
  let target = form.querySelector('.form-error');
  if (!target) { target = document.createElement('p'); target.className = 'form-error'; target.role = 'alert'; form.append(target); }
  target.hidden = false; target.textContent = error.message || 'This action could not be completed.';
  target.scrollIntoView({ block: 'nearest' });
}
async function finishLogin(remember = false) {
  authenticated = true; loginPending = false;
  sessionStorage.setItem('atiera-demo-session', 'admin');
  if (remember) localStorage.setItem('atiera-demo-remember', 'true'); else localStorage.removeItem('atiera-demo-remember');
  await commit(s => { s.loginLogs.unshift({ id: uid('login'), date: new Date().toISOString(), username: 'admin', result: 'Success', device: 'Demo browser' }); model.audit(s, 'Admin signed in', 'Authentication'); }, '', false);
  closeModal();
  if (location.hash && getRoute(location.hash.slice(2).split('?')[0])) render(); else navigate('dashboard');
  toast('Welcome back, Charles Pura.');
}
const syncKeys = ['employees', 'attendance', 'shifts', 'leaves', 'claims', 'users', 'departments', 'positions', 'leaveTypes', 'leaveBalances', 'shiftTypes', 'shiftRequests', 'requestTypes', 'statusTypes', 'holidays', 'events', 'expenses', 'roles', 'locations'];
function validateBackup(value) {
  model.requireThat(value?.version === VERSION && value.settings && value.profile, 'This is not a compatible HR3 demo backup.');
  const required = Object.entries(seedState()).filter(([, v]) => Array.isArray(v)).map(([key]) => key);
  for (const key of required) model.requireThat(Array.isArray(value[key]), `The backup is missing ${key}.`);
  const admin = value.employees.find(e => e.id === 'emp-1'); const account = value.users.find(u => u.id === 'user-1');
  model.requireThat(admin?.firstName === 'Charles' && admin?.lastName === 'Pura' && admin.status === 'Active' && account?.username === 'admin' && account.role === 'Admin' && account.status === 'Active' && account.employeeId === 'emp-1', 'The backup must preserve the active Charles Pura administrator.');
  return value;
}

async function handleAction(action, el) {
  const id = el.dataset.id; const entity = el.dataset.entity;
  switch (action) {
    case 'close-modal': closeModal(); return;
    case 'cancel-form': if (modal.open) closeModal(); else navigate(activeRoute.group === 'employee' ? 'employees' : activeRoute.group === 'user' ? 'users' : activeRoute.group === 'claims' ? 'claims' : 'dashboard'); return;
    case 'go-dashboard': navigate('dashboard'); return;
    case 'confirm': {
      el.disabled = true;
      try { await confirmation?.(); closeModal(); } catch (error) { const target = document.getElementById('confirm-error'); if (target) { target.hidden = false; target.textContent = error.message; } else throw error; } finally { el.disabled = false; }
      return;
    }
    case 'theme': await commit(s => { s.settings.theme = s.settings.theme === 'dark' ? 'light' : 'dark'; }); return;
    case 'toggle-password': { const input = document.getElementById(el.dataset.target); input.type = input.type === 'password' ? 'text' : 'password'; el.setAttribute('aria-label', input.type === 'password' ? 'Show password' : 'Hide password'); return; }
    case 'forgot-password': openModal('Demo Password Recovery', notice('The demo account always uses admin / admin. No password recovery email is sent.') + `<div class="modal-footer">${button('Return to Login', 'close-modal', '', 'primary')}</div>`); return;
    case 'quick-login': case 'qr-login': {
      openModal(action === 'qr-login' ? 'QR Sign In · Demo' : 'Quick Sign In · Demo', notice(action === 'qr-login' ? 'This simulates approving a QR login on your own device. Enter the public admin password to approve this browser.' : 'This simulates a quick-login approval. Use the public demo password admin.') + formHtml([field('password', 'Admin Password', 'password')], {}, state, 'quick-login', '', 'Approve Demo Login')); return;
    }
    case 'accessibility': accessibilityDialog(); return;
    case 'logout': confirmAction('Sign Out', 'Sign out of this demo? Your local records will remain saved.', async () => { authenticated = false; sessionStorage.removeItem('atiera-demo-session'); localStorage.removeItem('atiera-demo-remember'); ctx.revealed = false; profileOpen = false; await commit(s => model.audit(s, 'Admin signed out', 'Authentication')); }); return;
    case 'open-sidebar': mobileOpen = true; document.querySelector('.app-shell').classList.add('sidebar-open'); return;
    case 'close-sidebar': mobileOpen = false; document.querySelector('.app-shell')?.classList.remove('sidebar-open'); return;
    case 'collapse-sidebar': await commit(s => { s.settings.collapsed = !s.settings.collapsed; }); return;
    case 'profile-menu': profileOpen = !profileOpen; notificationOpen = false; refreshHeaderPanels(); return;
    case 'notification-menu': notificationOpen = !notificationOpen; profileOpen = false; refreshHeaderPanels(); return;
    case 'fullscreen': if (document.fullscreenElement) await document.exitFullscreen(); else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen(); else toast('Fullscreen is unavailable in this browser.', true); return;
    case 'focus': await commit(s => { s.settings.focusMode = !s.settings.focusMode; }); return;
    case 'search': showSearch(); return;
    case 'chat': showChat(); return;
    case 'close-chat': chatOpen = false; document.querySelector('.chat-panel')?.remove(); document.querySelector('.floating-chat')?.setAttribute('aria-expanded', 'false'); return;
    case 'chat-expand': chatExpanded = !chatExpanded; showChat(); return;
    case 'chat-help': openModal('ATIËRAbot · Help', notice('The assistant gives local demo answers. Try “attendance today”, “leave balances”, “claims”, “shift schedule” or “backup”.') + '<p class="caption" style="margin-top:16px">The microphone button inserts an example voice command. No microphone permission or AI service is required.</p>'); return;
    case 'chat-voice': { const input = document.querySelector('.chat-form input'); if (input) { input.value = 'Show attendance today'; chatDraft = input.value; input.focus(); toast('Demo voice command added. Click Send to continue.'); } return; }
    case 'cookies': openModal('Cookie Preferences', notice('This demo saves its sample records and preferences in your browser. It does not use tracking or advertising cookies.') + formHtml([field('preferences', 'Remember demo preferences', 'checkbox', { optional: true })], { preferences: state.settings.cookieChoice !== 'necessary' }, state, 'cookies', '', 'Save Preferences')); return;
    case 'mobile-preview': openModal('Atiera HR3 · Mobile Preview', `<div class="mobile-preview-dialog">${phoneMarkup(state, el.dataset.tab || 'dashboard')}</div><p class="caption" style="text-align:center;margin-top:18px">Interactive portfolio preview · No app installation required</p>`); return;
    case 'phone-tab': {
      const phone = el.closest('.phone-mockup'); if (!phone) return;
      const tab = el.dataset.tab || 'dashboard';
      phone.querySelector('[data-phone-body]').innerHTML = phoneContent(state, tab);
      phone.querySelector('[data-phone-body]').scrollTop = 0;
      phone.querySelector('[data-phone-title]').textContent = tab === 'dashboard' ? 'Dashboard' : tab === 'shifts' ? 'My Shifts' : tab.charAt(0).toUpperCase() + tab.slice(1);
      phone.querySelectorAll('.phone-nav button').forEach(b => b.classList.toggle('active', b.dataset.tab === tab)); return;
    }
    case 'phone-menu': {
      const phone = el.closest('.phone-mockup');
      phone.querySelector('[data-phone-title]').textContent = 'Menu';
      phone.querySelector('[data-phone-body]').innerHTML = [['dashboard', 'Dashboard', 'home'], ['attendance', 'Attendance', 'clock'], ['shifts', 'My Shifts', 'calendar'], ['timesheet', 'Timesheet', 'file'], ['leave', 'Leave', 'plane'], ['claims', 'Claims', 'money'], ['notifications', 'Notifications', 'bell'], ['profile', 'My Profile', 'user']].map(([tab, title, symbol]) => button(`${icon(symbol)}${title}`, 'phone-tab', `data-tab="${tab}"`, 'mobile-menu-item')).join(''); return;
    }
    case 'mobile-nfc': openModal('NFC Attendance · Demo', notice('Simulate an NFC tap using the fictional admin tag. No NFC hardware is required.') + formHtml([field('employeeId', 'Employee', 'select', { options: 'employees' }), field('action', 'Attendance Action', 'select', { options: [{ value: 'in', label: 'Clock in' }, { value: 'out', label: 'Clock out' }] }), field('tag', 'Demo NFC Tag')], { employeeId: 'emp-1', action: 'in', tag: 'DEMO-NFC-001' }, state, 'clock', '', 'Simulate NFC Tap').replace('<div class="form-grid">', '<input type="hidden" name="method" value="NFC (demo)"><div class="form-grid">')); return;
    case 'reset-filters': navigate(activeRoute.id); return;
    case 'page': { const next = new URLSearchParams(params); next.set('page', el.dataset.page); navigate(activeRoute.id, next); return; }
    case 'week': { const next = new URLSearchParams(params); next.set('date', el.dataset.date); navigate(activeRoute.id, next); return; }
    case 'month': { const next = new URLSearchParams(params); next.set('month', el.dataset.month); navigate(activeRoute.id, next); return; }
    case 'calendar-day': {
      const date = el.dataset.date;
      const rows = state.shifts.filter(sh => sh.date === date && (!params.get('department') || model.findEmployee(state, sh.employeeId)?.department === params.get('department')));
      openModal(`Schedule · ${fmtDate(date)}`, tableHtml(['Employee', 'Shift', 'Time', 'Note'], rows.map(sh => ({ cells: [person(model.findEmployee(state, sh.employeeId)), esc(sh.shiftType), `${esc(sh.start)} – ${esc(sh.end)}`, esc(sh.note || '—')] }))) + `<div class="button-row" style="margin-top:20px">${button('Assign Shift', 'shift-form', `data-date="${date}"`, 'success', 'plus')}${button('Open Week', 'week', `data-date="${date}"`, 'secondary', 'calendar')}</div>`); return;
    }
    case 'entity-form': entityForm(entity, id); return;
    case 'employee-detail': employeeDetail(id); return;
    case 'attendance-detail': attendanceDetail(id); return;
    case 'leave-detail': leaveDetail(id); return;
    case 'claim-detail': claimDetail(id); return;
    case 'attendance-form': {
      const old = state.attendance.find(a => a.id === id);
      openModal(old ? 'Edit Attendance' : 'Manual Clock In / Out', notice('Enter example times. Overnight shifts are supported when clock-out is earlier than clock-in.') + `<div style="margin-top:20px">${formHtml(forms.attendance, old || { date: today(), clockIn: '08:00', clockOut: '', breakStart: '', breakEnd: '' }, state, 'attendance', `data-id="${esc(id || '')}"`)}</div>`); return;
    }
    case 'leave-form': {
      const old = state.leaves.find(l => l.id === id);
      openModal(old ? 'Edit Leave Request' : 'Assign Leave', formHtml(forms.leave, old || { employeeId: el.dataset.employee || '', start: el.dataset.date || today(), end: el.dataset.date || today() }, state, 'leave', `data-id="${esc(id || '')}"`, 'Save Leave Request') + '<div id="leave-preview" class="caption" style="margin-top:18px"></div>'); updateLeavePreview(); return;
    }
    case 'balance-form': {
      const old = state.leaveBalances.find(b => b.employeeId === el.dataset.employee && b.type === el.dataset.type);
      entityForm('leaveBalances', old?.id || '', { employeeId: el.dataset.employee, type: el.dataset.type, allowance: model.leaveBalance(state, el.dataset.employee, el.dataset.type).allowance }); return;
    }
    case 'claim-form': openModal('Edit Claim', claimForm(state, state.claims.find(c => c.id === id))); return;
    case 'add-expense': { const form = el.closest('form'); form.querySelector('#expense-items').insertAdjacentHTML('beforeend', expenseItem(state)); return; }
    case 'remove-expense': { const form = el.closest('form'); model.requireThat(form.querySelectorAll('.expense-row').length > 1, 'Keep at least one expense item.'); el.closest('.expense-row').remove(); updateClaimTotal(form); return; }
    case 'shift-form': openModal('Assign Shift', formHtml(forms.shift, { employeeId: el.dataset.employee || '', date: el.dataset.date || today(), endDate: el.dataset.date || today() }, state, 'shift', '', 'Assign Shift')); return;
    case 'shift-detail': {
      const sh = state.shifts.find(r => r.id === id); model.requireThat(sh, 'Shift not found.');
      openModal('Shift Details & Note', `<div class="detail-banner">${person(model.findEmployee(state, sh.employeeId))}<span class="right">${fmtDate(sh.date)}</span></div>${formHtml([field('shiftType', 'Shift Type', 'select', { options: 'shiftTypes' }), field('note', 'Note', 'textarea', { optional: true })], sh, state, 'shift-edit', `data-id="${esc(id)}"`)}<div class="button-row" style="margin-top:15px">${button('Delete Shift', 'delete', `data-entity="shifts" data-id="${esc(id)}"`, 'danger', 'trash')}</div>`); return;
    }
    case 'request-shift-form': openModal('Request Shift', notice('Approved add/change/remove/swap requests update the weekly schedule.') + `<div style="margin-top:20px">${formHtml(forms.request, { date: today() }, state, 'request-shift', '', 'Submit Request')}</div>`); return;
    case 'review-leave': confirmAction(`${esc(el.dataset.status)} Leave`, 'Apply this decision to the selected leave request?', () => commit(s => model.reviewLeave(s, id, el.dataset.status), 'Leave request updated.')); return;
    case 'review-claim': confirmAction(`${esc(el.dataset.status)} Claim`, 'Apply this decision to the selected claim?', () => commit(s => model.reviewClaim(s, id, el.dataset.status), 'Claim updated.')); return;
    case 'review-shift': confirmAction(`${esc(el.dataset.status)} Shift Request`, 'Apply this decision? Approval updates the related schedule.', () => commit(s => model.reviewShiftRequest(s, id, el.dataset.status), 'Shift request updated.')); return;
    case 'review-timesheet': await commit(s => model.reviewTimesheet(s, [id], el.dataset.status), 'Timesheet updated.'); return;
    case 'review-selected-timesheets': await commit(s => model.reviewTimesheet(s, selectedIds(), el.dataset.status), 'Selected timesheets updated.'); return;
    case 'resolve-anomaly': await commit(s => { const a = s.attendance.find(a => a.id === id); a.resolved = !a.resolved; model.audit(s, a.resolved ? 'Resolved anomaly' : 'Reopened anomaly', 'Attendance', id); }, 'Anomaly review updated.'); return;
    case 'run-anomalies': await commit(s => model.audit(s, 'Ran anomaly detection', 'Attendance', `${s.attendance.filter(a => model.attendanceIssue(s, a)).length} open findings`), 'Anomaly check complete.'); return;
    case 'absence-note': {
      const sh = state.shifts.find(r => r.id === id); const note = state.absenceNotes?.find(n => n.employeeId === sh.employeeId && n.date === sh.date);
      openModal('Absence Remarks', `<div class="detail-banner">${person(model.findEmployee(state, sh.employeeId))}<small>${fmtDate(sh.date)}</small></div>${formHtml([field('remarks', 'Remarks', 'textarea')], note || {}, state, 'absence', `data-employee="${esc(sh.employeeId)}" data-date="${sh.date}"`)}`); return;
    }
    case 'delete': confirmAction('Delete Record', 'Delete this demo record? Linked records may need to be updated first.', () => commit(s => model.deleteEntity(s, entity, id), 'Record deleted.'), true); return;
    case 'delete-selected': { const ids = selectedIds(); model.requireThat(ids.length, 'Select at least one record.'); confirmAction('Delete Selected Records', `Delete ${ids.length} selected demo record(s)? If any selected record has dependencies, no records will be removed.`, () => commit(s => ids.forEach(recordId => model.deleteEntity(s, entity, recordId)), 'Selected records deleted.'), true); return; }
    case 'verify-user': await commit(s => { const u = s.users.find(u => u.id === id); u.verified = true; model.audit(s, 'Verified email (demo)', 'Users', u.username); }, 'Demo email verified.'); return;
    case 'send-verification': await commit(s => { const u = s.users.find(u => u.id === id); model.queueMessage(s, { channel: 'Email', to: u.email, subject: 'Verify your HR3 account (demo)', body: `Hello ${u.username}, open User Management and click Verify (demo) to simulate confirming this address.` }); }, 'Verification email added to the demo outbox.'); return;
    case 'reveal-amounts': if (ctx.revealed) { ctx.revealed = false; render(); } else openModal('Verify to View Amounts', notice('Use the demo password admin, or simulate NFC verification.') + formHtml([field('password', 'Demo Admin Password', 'password')], {}, state, 'reveal', '', 'Verify Password') + `<div class="button-row" style="margin-top:18px">${button('Simulate NFC · DEMO-NFC-001', 'reveal-nfc', '', 'secondary', 'nfc')}</div>`); return;
    case 'reveal-nfc': ctx.revealed = true; closeModal(); render(); toast('Demo NFC verified. Amounts revealed.'); return;
    case 'export-csv': case 'export-pdf': model.requireThat(ctx.report, 'There is no report to export on this screen.'); if (action === 'export-pdf') ui.downloadPDF(ctx.report.title, ctx.report.headers, ctx.report.rows); else ui.downloadCSV(ctx.report.title, ctx.report.headers, ctx.report.rows); toast('Report downloaded.'); return;
    case 'record-pdf': {
      const row = state[entity].find(r => r.id === id); const rows = Object.entries(row).filter(([k, v]) => k !== 'attachment' && typeof v !== 'object').map(([k, v]) => [k, String(v)]);
      if (entity === 'claims') { rows.push(['Total PHP', model.claimTotal(row)]); row.items.forEach(i => rows.push([i.type, `${i.description} | ${i.quantity} x ${i.amount}`])); }
      ui.downloadPDF(`${entity} ${id.slice(0, 14)}`, ['Field', 'Value'], rows); return;
    }
    case 'attachment': { const file = state[entity].find(r => r.id === id)?.attachment; model.requireThat(file?.data && /^data:(image\/(png|jpeg|webp)|application\/pdf|text\/plain);base64,/.test(file.data), 'No local attachment available.'); const res = await fetch(file.data); ui.downloadFile(file.name, await res.blob()); return; }
    case 'compose-message': openModal('Compose Demo Message', notice('This message is queued locally. No external message will be sent.') + `<div style="margin-top:20px">${formHtml([field('channel', 'Channel', 'select', { options: ['Email', 'Discord'] }), field('to', 'Recipient / Channel'), field('subject', 'Subject'), field('body', 'Message', 'textarea')], { channel: el.dataset.channel || 'Email', to: el.dataset.channel === 'Discord' ? `#${state.settings.discordChannel}` : 'employee@example.com' }, state, 'compose', '', 'Queue Message')}</div>`); return;
    case 'message-detail': { const m = state.messages.find(m => m.id === id); openModal('Demo Message', `${dataDetails(m, [['channel', 'Channel'], ['to', 'Recipient'], ['subject', 'Subject'], ['date', 'Created', fmtTime], ['status', 'Status']])}<div class="code-block" style="margin-top:22px;color:#e2e8f0">${esc(m.body)}</div>`); return; }
    case 'process-messages': await commit(s => model.processMessages(s, el.dataset.channel || ''), count => `${count} message(s) delivered in the demo.`); return;
    case 'test-email': case 'test-discord': await commit(s => model.queueMessage(s, { channel: action === 'test-email' ? 'Email' : 'Discord', to: action === 'test-email' ? s.settings.emailFrom : `#${s.settings.discordChannel}`, subject: 'HR3 demo connection test', body: 'The simulated connection is working. This message exists only in the local demo outbox.' }), 'Test message queued in the demo outbox.'); return;
    case 'read-notification': await commit(s => { const n = s.notifications.find(n => n.id === id); n.read = !n.read; }); return;
    case 'read-all': await commit(s => s.notifications.forEach(n => { n.read = true; }), 'All notifications marked read.'); return;
    case 'connect-discord': await commit(s => { s.settings.discordConnected = !s.settings.discordConnected; model.audit(s, s.settings.discordConnected ? 'Connected demo Discord' : 'Disconnected demo Discord', 'Discord'); }, 'Demo Discord connection updated.'); return;
    case 'recovery-codes': openModal('Demo Recovery Codes', notice('Fictional recovery codes for this portfolio demo. They demonstrate the original recovery screen.') + '<pre class="code-block" style="margin-top:20px">DEMO-123456\nDEMO-234567\nDEMO-345678\n\nUse 123456 or DEMO-123456 in the demo 2FA prompt.</pre>' + `<div class="modal-footer">${button('Download Codes', 'download-codes', '', 'secondary', 'download')}</div>`); return;
    case 'download-codes': ui.downloadFile('hr3-demo-recovery-codes.txt', 'DEMO-123456\nDEMO-234567\nDEMO-345678\nDemo only.', 'text/plain'); return;
    case 'password-demo': openModal('Change Password · Demo', notice('This simulates changing a password. The public demo login will remain admin / admin.') + `<div style="margin-top:20px">${formHtml([field('currentPassword', 'Current Demo Password', 'password'), field('newPassword', 'New Fictional Password', 'password'), field('confirmPassword', 'Confirm Fictional Password', 'password')], {}, state, 'password-demo')}</div>`); return;
    case 'sync-employees': await commit(s => { s.syncLogs.unshift({ id: uid('sync'), date: new Date().toISOString(), direction: 'Employee sync (demo)', count: s.employees.length }); model.audit(s, 'Simulated employee synchronization', 'Employee', `${s.employees.length} records checked`); }, 'Employee demo sync complete.'); return;
    case 'sync-upload': await commit(s => { s.cloudSnapshot = { date: new Date().toISOString(), data: Object.fromEntries(syncKeys.map(key => [key, structuredClone(s[key])])) }; s.syncLogs.unshift({ id: uid('sync'), date: new Date().toISOString(), direction: 'Local → Demo Cloud', count: syncKeys.reduce((n, key) => n + s[key].length, 0) }); model.audit(s, 'Uploaded demo cloud snapshot', 'Sync'); }, 'Local records copied to the demo cloud snapshot.'); return;
    case 'sync-download': model.requireThat(state.cloudSnapshot, 'Upload a demo cloud snapshot first.'); confirmAction('Restore Demo Cloud Snapshot', 'Replace current business records with the last local cloud snapshot?', () => commit(s => { for (const key of syncKeys) s[key] = structuredClone(s.cloudSnapshot.data[key]); s.syncLogs.unshift({ id: uid('sync'), date: new Date().toISOString(), direction: 'Demo Cloud → Local', count: syncKeys.reduce((n, key) => n + s[key].length, 0) }); model.audit(s, 'Restored demo cloud snapshot', 'Sync'); }, 'Demo cloud snapshot restored.')); return;
    case 'backup': ui.downloadFile('atiera-hr3-demo-backup.json', JSON.stringify(state, null, 2)); toast('Demo backup downloaded.'); return;
    case 'import-backup': openModal('Restore JSON Backup', notice('Choose a JSON backup exported from this demo. Restoring replaces the current browser records.', 'warning') + `<form data-form="import-backup" style="margin-top:20px"><div class="field"><label for="backup-file">HR3 Demo JSON Backup</label><input id="backup-file" name="backup" type="file" accept="application/json,.json" required></div><p class="form-error" hidden role="alert"></p><div class="form-footer"><button type="submit" class="btn primary">Restore Backup</button>${button('Cancel', 'close-modal', '', 'secondary')}</div></form>`); return;
    case 'reset-demo': confirmAction('Reset Demo Data', '<strong>This removes your current local demo changes and attachments.</strong> The fictional sample data will be restored.', () => commit(s => { const fresh = seedState(); Object.keys(s).forEach(k => delete s[k]); Object.assign(s, fresh); ctx.revealed = false; }, 'Fresh demo data restored.'), true); return;
    case 'export-collection': { const allowed = ['employees', 'attendance', 'shifts', 'leaves', 'claims', 'users', 'notifications']; model.requireThat(allowed.includes(el.dataset.collection), 'Choose a valid demo collection.'); ui.downloadFile(`${el.dataset.collection}.json`, JSON.stringify(state[el.dataset.collection], null, 2)); return; }
    case 'cctv-detection': await commit(s => { model.notify(s, 'CCTV motion detected (demo)', `Sample movement detected at ${el.dataset.camera}. No live footage was captured.`, 'cctv'); model.audit(s, 'Simulated CCTV detection', 'Attendance', el.dataset.camera); }, 'Demo detection added to notifications.'); return;
    default: throw new Error(`Unknown action: ${action}`);
  }
}

function updateLeavePreview() {
  const form = modal.querySelector('[data-form="leave"]'); const preview = document.getElementById('leave-preview');
  if (!form || !preview) return;
  const employeeId = form.elements.employeeId.value, type = form.elements.type.value;
  if (!employeeId || !type) { preview.textContent = 'Choose an employee and leave type to see the available balance.'; return; }
  const b = model.leaveBalance(state, employeeId, type, form.dataset.id || '');
  preview.textContent = `Annual allowance: ${b.allowance} days · Approved: ${b.used} · Remaining: ${b.remaining} days.`;
}
async function submitForm(form) {
  const name = form.dataset.form;
  if (name === 'filters') {
    const data = new FormData(form); const next = new URLSearchParams();
    for (const [key, value] of data) if (String(value).trim()) next.set(key, String(value).trim());
    for (const key of ['channel']) if (params.has(key)) next.set(key, params.get(key));
    model.requireThat(!next.get('from') || !next.get('to') || next.get('from') <= next.get('to'), 'The end date must be on or after the start date.');
    navigate(activeRoute.id, next); return;
  }
  if (name === 'collection') { navigate('firebase', { collection: form.elements.collection.value }); return; }
  if (name === 'import-backup') {
    const file = form.elements.backup.files[0]; model.requireThat(file && file.size <= 20 * 1024 * 1024, 'Choose an HR3 demo JSON file smaller than 20 MB.');
    const imported = validateBackup(JSON.parse(await file.text()));
    await commit(s => { Object.keys(s).forEach(k => delete s[k]); Object.assign(s, imported); model.audit(s, 'Restored JSON demo backup', 'Maintenance'); }, 'Demo backup restored.'); closeModal(); return;
  }
  const data = await readForm(form);
  switch (name) {
    case 'login': {
      if (data.username !== 'admin' || data.password !== 'admin') {
        await commit(s => s.loginLogs.unshift({ id: uid('login'), date: new Date().toISOString(), username: data.username.slice(0, 80), result: 'Failed', device: 'Demo browser' }), '', false);
        throw new Error('Use admin as the username and admin as the password.');
      }
      if (state.settings.twoFactor) { loginPending = { remember: !!data.remember }; openModal('Two-Factor Authentication', notice('Demo authenticator code: 123456') + formHtml([field('code', 'Authenticator / Recovery Code')], {}, state, 'two-factor', '', 'Verify & Sign In')); } else await finishLogin(!!data.remember);
      return;
    }
    case 'quick-login': model.requireThat(data.password === 'admin', 'Use the demo admin password: admin.'); if (state.settings.twoFactor) { loginPending = { remember: false }; openModal('Two-Factor Authentication', notice('Demo authenticator code: 123456') + formHtml([field('code', 'Authenticator / Recovery Code')], {}, state, 'two-factor', '', 'Verify & Sign In')); } else await finishLogin(); return;
    case 'two-factor': model.requireThat(loginPending && ['123456', 'DEMO-123456', 'DEMO-234567', 'DEMO-345678'].includes(data.code), 'Use the demo code 123456 or a displayed recovery code.'); await finishLogin(loginPending.remember); return;
    case 'entity': {
      const entity = form.dataset.entity;
      await commit(s => {
        const row = model.saveEntity(s, entity, { ...data, id: form.dataset.id || undefined });
        if (entity === 'users' && !form.dataset.id) model.queueMessage(s, { channel: 'Email', to: row.email, subject: 'Welcome to HR3 (demo)', body: 'Your fictional demo account has been created. The public demo login is admin / admin.' });
      }, 'Record saved.');
      closeModal(); if (activeRoute.kind === 'add-employee') navigate('employees'); if (activeRoute.kind === 'create-user') navigate('users'); return;
    }
    case 'attendance': await commit(s => model.saveAttendance(s, { ...data, id: form.dataset.id || undefined }), 'Attendance saved.'); closeModal(); return;
    case 'leave': await commit(s => model.saveLeave(s, { ...data, id: form.dataset.id || undefined }), 'Leave request saved.'); closeModal(); return;
    case 'claim': {
      data.items = [...form.querySelectorAll('.expense-row')].map(row => ({ type: row.querySelector('[name=itemType]').value, description: row.querySelector('[name=itemDescription]').value.trim(), quantity: Number(row.querySelector('[name=itemQuantity]').value), amount: Number(row.querySelector('[name=itemAmount]').value) }));
      for (const key of ['itemType', 'itemDescription', 'itemQuantity', 'itemAmount']) delete data[key];
      await commit(s => model.saveClaim(s, { ...data, id: form.dataset.id || undefined }), 'Claim saved.'); closeModal(); if (activeRoute.id === 'assign-claim') navigate('claims'); return;
    }
    case 'shift': await commit(s => model.assignShift(s, data), 'Shift assigned.'); closeModal(); return;
    case 'shift-edit': await commit(s => { const old = s.shifts.find(sh => sh.id === form.dataset.id); model.requireThat(old, 'Shift no longer exists.'); model.assignShift(s, { employeeId: old.employeeId, date: old.date, shiftType: data.shiftType, note: data.note }, true); }, 'Shift updated.'); closeModal(); return;
    case 'request-shift': await commit(s => model.saveShiftRequest(s, data), 'Shift request submitted.'); closeModal(); return;
    case 'auto-balance': await commit(s => model.autoBalance(s, data.date), count => `${count} unassigned shifts filled.`); return;
    case 'clock': {
      const employee = model.findEmployee(state, data.employeeId); model.requireThat(employee, 'Choose an employee.');
      if (data.method === 'NFC (demo)') model.requireThat(data.tag && data.tag === employee.nfc, 'The demo NFC tag must match the selected employee.');
      const stage = document.getElementById('camera-stage'); const line = stage?.querySelector('.scan-line'); const label = document.getElementById('recognition-label');
      if (stage) { stage.classList.add('scanning'); line.hidden = false; label.textContent = 'Recognizing demo employee…'; await new Promise(resolve => setTimeout(resolve, 850)); }
      try { await commit(s => model.clock(s, data.employeeId, data.action, data.method), `${model.employeeName(employee)} · Attendance recorded (${data.method}).`); }
      finally { stage?.classList.remove('scanning'); if (line) line.hidden = true; }
      // Preserve the chosen employee after redraw, so the next action applies to the same person.
      if (form.closest('dialog')) closeModal();
      if (params.get('employee') !== data.employeeId) navigate(activeRoute.id, { employee: data.employeeId });
      return;
    }
    case 'absence': await commit(s => { s.absenceNotes ||= []; const old = s.absenceNotes.find(n => n.employeeId === form.dataset.employee && n.date === form.dataset.date); if (old) old.remarks = data.remarks; else s.absenceNotes.push({ id: uid('absence'), employeeId: form.dataset.employee, date: form.dataset.date, remarks: data.remarks }); model.audit(s, 'Updated absence remarks', 'Attendance', form.dataset.employee); }, 'Absence remarks saved.'); closeModal(); return;
    case 'profile': await commit(s => { s.profile = { ...s.profile, ...data }; const e = s.employees.find(e => e.id === 'emp-1'); e.email = data.email; e.phone = data.phone; e.address = data.address; if (data.photo) e.photo = data.photo; const u = s.users.find(u => u.id === 'user-1'); u.email = data.email; model.audit(s, 'Updated admin profile', 'Profile'); }, 'Profile saved.'); return;
    case 'pdf-settings': case 'email-settings': case 'discord-settings': await commit(s => { Object.assign(s.settings, data); model.audit(s, 'Updated demo settings', name); }, 'Demo settings saved.'); return;
    case 'password-demo': model.requireThat(data.currentPassword === 'admin', 'The current demo password is admin.'); model.requireThat(data.newPassword.length >= 4 && data.newPassword === data.confirmPassword, 'Use matching fictional passwords with at least four characters.'); await commit(s => model.audit(s, 'Simulated password change', 'Settings'), 'Password-change simulation complete. Login remains admin / admin.'); closeModal(); return;
    case 'reveal': model.requireThat(data.password === 'admin', 'Use the demo password admin.'); ctx.revealed = true; closeModal(); render(); return;
    case 'compose': await commit(s => model.queueMessage(s, data), 'Message queued in the demo outbox.'); closeModal(); return;
    case 'chat': await commit(s => { s.chat.push({ role: 'user', text: data.message }, { role: 'assistant', text: chatAnswer(data.message) }); s.chat = s.chat.slice(-60); }, '', false); form.reset(); chatDraft = ''; refreshChat(); return;
    case 'cookies': await commit(s => { s.settings.cookieChoice = data.preferences ? 'preferences' : 'necessary'; }, 'Demo preferences saved.'); closeModal(); return;
    case 'api': {
      const collection = data.collection;
      if (data.method === 'GET') {
        model.requireThat(['employees', 'attendance', 'shifts', 'leaves', 'claims', 'users'].includes(collection), 'Choose a valid endpoint.');
        document.getElementById('api-response').textContent = JSON.stringify({ status: 200, mode: 'demo', count: state[collection].length, data: state[collection] }, null, 2);
      } else {
        let response;
        try {
          const body = JSON.parse(data.body);
          const result = await commit(s => {
            if (collection === 'employees' || collection === 'users') return model.saveEntity(s, collection, body);
            if (collection === 'attendance') return model.saveAttendance(s, body);
            if (collection === 'leaves') return model.saveLeave(s, body);
            if (collection === 'claims') return model.saveClaim(s, body);
            if (collection === 'shifts') { model.assignShift(s, body); return { employeeId: body.employeeId, date: body.date }; }
            throw new Error('Choose a valid endpoint.');
          }, '', false);
          response = { status: 201, mode: 'demo', data: result };
        } catch (error) { response = { status: 400, mode: 'demo', error: error.message }; }
        document.getElementById('api-response').textContent = JSON.stringify(response, null, 2);
      }
      return;
    }
    default: throw new Error('This form is not supported.');
  }
}

document.addEventListener('click', event => {
  const el = event.target.closest('[data-action]');
  if (el && !el.disabled) { event.preventDefault(); handleAction(el.dataset.action, el).catch(error => toast(error.message, true)); return; }
  const anchor = event.target.closest('a[href^="#/"]');
  if (anchor) {
    const target = anchor.getAttribute('href').slice(2).split('?')[0];
    if (!authenticated && !['login', 'mobile', 'face', 'terms', 'privacy'].includes(target)) { event.preventDefault(); navigate('login'); return; }
    closeModal(); mobileOpen = false; profileOpen = false; notificationOpen = false;
    if (anchor.hash === location.hash) render();
  }
  if ((profileOpen || notificationOpen) && !event.target.closest('.profile-menu,.profile-button,.notification-popover,.notification-button')) {
    profileOpen = false; notificationOpen = false; refreshHeaderPanels();
  }
});
document.addEventListener('submit', event => {
  const form = event.target.closest('[data-form]'); if (!form) return;
  event.preventDefault();
  const submit = event.submitter || form.querySelector('button[type="submit"]');
  if (submit?.disabled) return;
  if (submit) submit.disabled = true;
  const error = form.querySelector('.form-error'); if (error) error.hidden = true;
  submitForm(form).catch(error => formError(form, error)).finally(() => { if (submit?.isConnected) submit.disabled = false; });
});
document.addEventListener('input', event => {
  if (event.target.id === 'global-search') updateSearch(event.target.value);
  if (event.target.matches('.chat-form input')) chatDraft = event.target.value;
  if (event.target.closest('[data-form="claim"]')) updateClaimTotal(event.target.closest('form'));
});
document.addEventListener('change', event => {
  const el = event.target;
  if (el.matches('[data-select-all]')) { document.querySelectorAll('#main-content [data-select]').forEach(checkbox => { checkbox.checked = el.checked; }); updateSelection(); }
  else if (el.matches('[data-select]')) updateSelection();
  else if (el.dataset.setting) {
    const key = el.dataset.setting; const checked = el.checked;
    commit(s => { if (key === 'darkMode') s.settings.theme = checked ? 'dark' : 'light'; else if (key === 'largeText') s.settings.fontSize = checked ? 'Large' : 'Normal'; else s.settings[key] = checked; model.audit(s, 'Updated preference', 'Settings', key); }, 'Preference saved.').catch(error => { el.checked = !checked; toast(error.message, true); });
  }
  if (el.name === 'department') updateDependentPositions(el.closest('form'));
  if (el.closest('[data-form="leave"]')) updateLeavePreview();
  if (el.closest('[data-form="clock"]') && el.name === 'employeeId') {
    const e = model.findEmployee(state, el.value); if (!e) return;
    const form = el.closest('form'); const row = state.attendance.find(a => a.employeeId === e.id && a.date === today());
    form.elements.action.value = !row ? 'in' : row.clockOut ? 'in' : activeRoute.id === 'face' ? 'out' : !row.breakStart ? 'break-start' : !row.breakEnd ? 'break-end' : 'out';
    if (form.elements.tag) form.elements.tag.value = e.nfc || '';
    const tag = document.getElementById('demo-tag'); if (tag) tag.textContent = e.nfc || 'No tag assigned';
    const status = document.getElementById('clock-status'); if (status) status.innerHTML = `<div class="person">${avatar(e)}<div><strong>${esc(model.employeeName(e))}</strong><small>${row ? row.clockOut ? `Clocked out at ${row.clockOut}` : `Clocked in at ${row.clockIn}` : 'Ready to clock in'}</small></div></div>`;
  }
});
document.addEventListener('keydown', event => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k' && authenticated) { event.preventDefault(); showSearch(); }
  if (event.key === 'Escape') { mobileOpen = false; profileOpen = false; notificationOpen = false; refreshHeaderPanels(); document.querySelector('.app-shell')?.classList.remove('sidebar-open'); }
});
window.addEventListener('hashchange', () => { mobileOpen = false; profileOpen = false; notificationOpen = false; closeModal(); render(); window.scrollTo({ top: 0 }); });
setInterval(() => { const clock = document.getElementById('live-clock'); if (clock) clock.textContent = clockTime(); const header = document.querySelector('[data-live-header]'); if (header) header.textContent = headerDate(); }, 1000);

try {
  state = await loadState();
  render();
} catch (error) {
  app.innerHTML = `<div class="startup"><h1>Unable to start the demo</h1><p>${esc(error.message)}</p><p>Serve this folder using a local HTTP server or GitHub Pages.</p></div>`;
}
