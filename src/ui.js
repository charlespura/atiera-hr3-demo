import { employeeName } from './model.js';

export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const paths = {
  user: '<circle cx="12" cy="7" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3"/>',
  accessibility: '<circle cx="12" cy="4" r="2"/><path d="M3 9h18M12 7v8m0-4-5-2m5 2 5-2m-5 6-3 7m3-7 3 7"/>',
  fullscreen: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M8 8 3 3m13 5 5-5M8 16l-5 5m13-5 5 5"/>',
  focus: '<path d="M4 5h14L6 19h14M6 2l12 20"/>',
  mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2m-7 9v3m-4 0h8"/>',
  play: '<path d="m4 2 17 10L4 22zm0 0 12 15m0-10L4 22"/>',
  apple: '<path d="M16 3c0 2-2 4-4 4 0-2 2-4 4-4ZM12 8c-3-2-8-1-8 5 0 4 3 9 5 9l3-1 3 1c2 0 4-3 5-5-5-2-4-6-1-7-2-3-5-3-7-2Z"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M16 3a4 4 0 0 1 0 7.75"/><circle cx="9" cy="7" r="4"/>',
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-8H9v8H4a1 1 0 0 1-1-1z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18m-13 4h2m4 0h2m-8 3h2"/>',
  file: '<path d="M14 2H5v20h14V7zM14 2v6h5M8 12h8m-8 4h8"/>',
  plane: '<path d="m22 2-7 20-4-9L2 9zM22 2 11 13"/>',
  money: '<rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 12h.01M18 12h.01"/>',
  'user-plus': '<circle cx="9" cy="7" r="4"/><path d="M2 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2m4-13v6m-3-3h6"/>',
  settings: '<path d="m9 3-1 3-3 1v3l-2 2 2 2v3l3 1 1 3h6l1-3 3-1v-3l2-2-2-2V7l-3-1-1-3z"/><circle cx="12" cy="12" r="3"/>',
  search: '<circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-9 13h6"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  edit: '<path d="m16 3 5 5-12 12-6 1 1-6zM14 5l5 5"/>',
  trash: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7"/><circle cx="12" cy="12" r="3"/>',
  refresh: '<path d="M20 7a9 9 0 1 0 1 8M21 3v5h-5"/>',
  shield: '<path d="m12 2 9 4v6c0 6-9 10-9 10S3 18 3 12V6z"/><path d="m8 12 3 3 5-6"/>',
  camera: '<rect x="2" y="6" width="20" height="15" rx="2"/><path d="m7 6 2-4h6l2 4"/><circle cx="12" cy="13" r="4"/>',
  nfc: '<path d="M5 4v16m4-12v8m4-13a13 13 0 0 1 0 18m4-18a18 18 0 0 1 0 18"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 5 10 8L22 5"/>',
  chat: '<path d="M21 11a9 9 0 0 1-9 9H4l-3 2 2-7a9 9 0 1 1 18-4Z"/><path d="M7 10h10M7 14h6"/>',
  logout: '<path d="M9 3H3v18h6m5-14 5 5-5 5m-6-5h12"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  alert: '<path d="m12 3 10 18H2zM12 9v5m0 3v1"/>',
  moon: '<path d="M21 13a9 9 0 0 1-10-10 9 9 0 1 0 10 10"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>',
  help: '<circle cx="12" cy="12" r="10"/><path d="M9 8a3 3 0 1 1 5 2c-2 1-2 2-2 4m0 3v1"/>',
  link: '<path d="m10 13 4-4m-6 7-2 2a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m2 1 2-2a4 4 0 0 1 6 6l-5 5a4 4 0 0 1-6 0"/>',
  cloud: '<path d="M6 18a5 5 0 0 1-1-10 7 7 0 0 1 13-1 6 6 0 0 1 0 12H6"/>',
  chart: '<path d="M3 3v18h18M7 16v-5m5 5V7m5 9v-8"/>',
  location: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  lock: '<rect x="4" y="10" width="16" height="12" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 5v3"/>',
  code: '<path d="m7 6-6 6 6 6M17 6l6 6-6 6M14 3l-4 18"/>'
};
export const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.file}</svg>`;
export const money = value => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 2 }).format(Number(value) || 0);
export const fmtDate = value => value ? new Date(`${value.slice(0, 10)}T12:00:00Z`).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
export const fmtTime = value => value ? new Date(value).toLocaleString('en-PH', { timeZone: 'Asia/Manila', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—';
export const badge = (value, override = '') => `<span class="badge ${esc(override || ({ Active: 'green', Approved: 'green', Paid: 'green', 'Delivered (demo)': 'green', Present: 'green', Pending: 'amber', Submitted: 'blue', Initiated: 'gray', Inactive: 'gray', Rejected: 'red', Cancelled: 'gray', Absent: 'red', 'On Leave': 'purple' }[value] || 'blue'))}">${esc(value)}</span>`;
export const button = (label, action, extra = '', style = '', symbol = '') => `<button type="button" class="btn ${style}" data-action="${esc(action)}" ${extra}>${symbol ? icon(symbol) : ''}${label}</button>`;
export const link = (id, text, cls = '') => `<a class="${cls}" href="#/${esc(id)}">${text}</a>`;
export const empty = (title = 'No records found', text = 'Try changing your filters or add a record to get started.') => `<div class="empty">${icon('file')}<h3>${esc(title)}</h3><p>${esc(text)}</p></div>`;
export const notice = (text, type = 'info') => `<div class="notice ${type}">${icon(type === 'warning' ? 'alert' : 'shield')}<span>${text}</span></div>`;
export const card = (title, body, action = '', cls = '') => `<section class="card ${cls}"><div class="card-heading"><h2>${title}</h2>${action}</div>${body}</section>`;
export const stat = (title, value, detail = '', symbol = 'chart', color = 'blue', target = '') => `<${target ? 'a' : 'div'} ${target ? `href="#/${target}"` : ''} class="stat-card"><div><span class="stat-label">${esc(title)}</span><strong>${value}</strong><small class="${color}">${detail}</small></div><span class="stat-icon ${color}">${icon(symbol)}</span></${target ? 'a' : 'div'}>`;
export const stats = content => `<div class="stats">${content}</div>`;
export function avatar(employee, large = false) {
  const initials = `${employee?.firstName?.[0] || '?'}${employee?.lastName?.[0] || ''}`;
  const source = typeof employee?.photo === 'object' ? employee.photo?.data : employee?.photo;
  return `<span class="avatar ${large ? 'large' : ''}">${source?.startsWith('data:image/') ? `<img src="${esc(source)}" alt="${esc(employeeName(employee))}">` : esc(initials)}</span>`;
}
export const person = e => `<div class="person">${avatar(e)}<div><strong>${esc(employeeName(e))}</strong><small>${esc(e?.code || '')}</small></div></div>`;
export function fieldHtml(field, value, state, prefix = '') {
  const { key, label, type = 'text', optional, min, max, step, accept } = field;
  const id = `${prefix}${key}`;
  const common = `id="${esc(id)}" name="${esc(key)}" ${optional ? '' : 'required'} ${min != null ? `min="${esc(min)}"` : ''} ${max != null ? `max="${esc(max)}"` : ''} ${step != null ? `step="${esc(step)}"` : ''} ${field.readonly ? 'readonly' : ''}`;
  let input;
  if (type === 'select') {
    let options = field.options;
    if (typeof options === 'string') options = (state[options] || []).filter(r => field.options !== 'employees' || r.status === 'Active' || r.id === value).map(r => field.options === 'employees' ? { value: r.id, label: employeeName(r) } : { value: r.name, label: r.name });
    options = options || [];
    input = `<select ${common}><option value="">Select ${esc(label.toLowerCase())}…</option>${options.map(item => { const v = typeof item === 'object' ? item.value : item; const name = typeof item === 'object' ? item.label : item; return `<option value="${esc(v)}" ${String(v) === String(value) ? 'selected' : ''}>${esc(name)}</option>`; }).join('')}</select>`;
  } else if (type === 'textarea') input = `<textarea ${common} rows="3" maxlength="2000">${esc(value)}</textarea>`;
  else if (type === 'checkbox') input = `<input type="checkbox" ${common.replace('required', '')} ${value ? 'checked' : ''}>`;
  else if (type === 'file') input = `<input type="file" ${common.replace('required', '')} accept="${esc(accept || 'image/png,image/jpeg,image/webp,application/pdf,text/plain')}"><small>Up to 2 MB. Saved in this browser only.${value?.name ? ` Current: ${esc(value.name)}` : ''}</small>`;
  else input = `<input type="${esc(type)}" ${common} value="${esc(value ?? '')}" ${type === 'password' ? 'autocomplete="off"' : ''} ${type === 'text' ? 'maxlength="200"' : ''}>`;
  return `<div class="field ${type === 'textarea' || type === 'file' ? 'span-2' : ''} ${type === 'checkbox' ? 'check-field' : ''}"><label for="${esc(id)}">${esc(label)}${optional ? '' : type === 'checkbox' ? '' : ' <span class="required">*</span>'}</label>${input}</div>`;
}
export function formHtml(fields, data, state, action, extra = '', submit = 'Save changes') {
  return `<form data-form="${esc(action)}" ${extra}><div class="form-grid">${fields.map(f => fieldHtml(f, data[f.key], state, `${action}-`)).join('')}</div><p class="form-error" role="alert" hidden></p><div class="form-footer"><button class="btn primary" type="submit">${icon('check')}${esc(submit)}</button>${button('Cancel', 'cancel-form', '', 'secondary')}</div></form>`;
}
export function tableHtml(headers, rows, { selectable = false } = {}) {
  if (!rows.length) return empty();
  return `<div class="table-wrap"><table><thead><tr>${selectable ? '<th class="check-cell"><input type="checkbox" data-select-all aria-label="Select all visible rows"></th>' : ''}${headers.map(h => `<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr ${row.id ? `data-row="${esc(row.id)}"` : ''}>${selectable ? `<td class="check-cell"><input type="checkbox" data-select="${esc(row.id)}" aria-label="Select record ${esc(row.id)}"></td>` : ''}${row.cells.map(c => `<td>${c ?? '—'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
export function downloadFile(name, value, type = 'application/json') {
  const blob = value instanceof Blob ? value : new Blob([value], { type });
  const url = URL.createObjectURL(blob); const a = document.createElement('a');
  a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function downloadCSV(title, headers, rows) {
  // Prefix spreadsheet formulas so exported user input stays literal in Excel.
  const cell = v => `"${String(v ?? '').replace(/^[=+@\-\t\r]/, "'$&").replaceAll('"', '""')}"`;
  downloadFile(`${title}.csv`, '\uFEFF' + [headers, ...rows].map(row => row.map(cell).join(',')).join('\r\n'), 'text/csv;charset=utf-8');
}
// A small, dependency-free, paginated PDF writer. All content is generated locally.
export function downloadPDF(title, headers, rows) {
  const clean = s => String(s ?? '').replaceAll('₱', 'PHP ').normalize('NFKD').replace(/[^\x20-\x7e]/g, ' ').replace(/[\\()]/g, '\\$&');
  const lines = [title, `ATIERA HR3 | Charles Pura | Portfolio demo | ${new Date().toLocaleDateString('en-PH')}`, '', headers.join(' | '), ...rows.flatMap(row => {
    const text = row.map(c => String(c ?? '')).join(' | '); const parts = [];
    for (let i = 0; i < text.length; i += 135) parts.push(text.slice(i, i + 135));
    return parts;
  })];
  const chunks = []; for (let i = 0; i < lines.length; i += 45) chunks.push(lines.slice(i, i + 45));
  const objects = ['', '', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
  const pageIds = [];
  chunks.forEach((chunk, index) => {
    const pageId = objects.length + 1, contentId = pageId + 1; pageIds.push(pageId);
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`);
    const stream = `BT /F1 9 Tf 30 560 Td 11 TL ${chunk.map((line, i) => `${i ? 'T* ' : ''}(${clean(line)}) Tj`).join('\n')}\nT* (Page ${index + 1} of ${chunks.length} - Simulated records) Tj ET`;
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  });
  objects[0] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[1] = `<< /Type /Pages /Kids [${pageIds.map(i => `${i} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;
  let output = '%PDF-1.4\n'; const offsets = [0];
  objects.forEach((obj, i) => { offsets.push(output.length); output += `${i + 1} 0 obj\n${obj}\nendobj\n`; });
  const xref = output.length; output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map(n => `${String(n).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  downloadFile(`${title}.pdf`, output, 'application/pdf');
}
