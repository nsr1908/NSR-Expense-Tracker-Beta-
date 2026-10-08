/* My Expense Tracker — all data stays in localStorage. */
'use strict';
const KEY = 'myExpenseTracker.v1', THEME_KEY = 'myExpenseTracker.theme';
const EXP = { 'House Rent':'🏠','Housemaid Bill':'🧹','Food Expense':'🍱','Bike Purpose':'🏍️','Shopping':'🛍️','Family Expense':'👨‍👩‍👧','Utility Bills':'💡','Others':'📝' };
const INC = { 'Salary':'💼','Bonus':'🎁','Other Income':'💰' };
const PAY = ['Cash','Bank','bKash','Nagad','Card','Other'];
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const state = { tx: [], budget: 0, type: 'all', formType: 'expense', editId: null, month: new Date() };
state.month.setDate(1);

/* ---------- storage ---------- */
function load() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || '{}');
    state.tx = Array.isArray(d.transactions) ? d.transactions : [];
    state.budget = Number(d.budget) || 0;
  } catch (e) { state.tx = []; toast('Saved data could not be read.'); }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify({ version: 1, budget: state.budget, transactions: state.tx })); }
  catch (e) { toast('Could not save: storage is full or blocked.'); }
}

/* ---------- helpers ---------- */
const money = n => '৳ ' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 });
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const today = () => iso(new Date());
const fmtDate = s => new Date(s + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const icon = t => (t.type === 'income' ? INC : EXP)[t.category] || '💳';
const sum = (a, type) => a.filter(t => t.type === type).reduce((s, t) => s + t.amount, 0);
const monthKey = d => iso(d).slice(0, 7);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2400); }
function confirmBox(title, msg, strong) {
  return new Promise(res => {
    const d = $('#cfDlg'); $('#cfTitle').textContent = title; $('#cfMsg').textContent = msg;
    $('#cfExtra').classList.toggle('hidden', !strong); $('#cfType').value = '';
    d.onclose = () => res(d.returnValue === 'yes' && (!strong || $('#cfType').value.trim().toUpperCase() === 'DELETE'));
    d.returnValue = ''; d.showModal();
  });
}

/* ---------- transaction rows ---------- */
function txHTML(t, actions) {
  const sign = t.type === 'income' ? '+' : '−';
  return `<article class="tx"><div class="ic" aria-hidden="true">${icon(t)}</div>
  <div><b>${esc(t.category)}</b><small>${fmtDate(t.date)} • ${esc(t.paymentMethod)}</small>${t.remarks ? `<small>${esc(t.remarks)}</small>` : ''}</div>
  <div class="amt ${t.type === 'income' ? 'pos' : 'neg'}">${sign} ${money(t.amount)}<small>${t.type === 'income' ? 'Income' : 'Expense'}</small></div>
  ${actions ? `<div class="acts"><button data-edit="${t.id}">Edit</button><button class="del" data-del="${t.id}">Delete</button></div>` : ''}</article>`;
}
const emptyHTML = `<div class="empty"><h3>No transactions yet</h3><p>Start tracking your money by adding your first transaction.</p><button class="btn" data-add>+ Add Transaction</button></div>`;

/* ---------- renderers ---------- */
function renderHome() {
  const inc = sum(state.tx, 'income'), exp = sum(state.tx, 'expense');
  const mk = monthKey(new Date()), mExp = sum(state.tx.filter(t => t.date.startsWith(mk)), 'expense');
  $('#sInc').textContent = money(inc); $('#sExp').textContent = money(exp);
  $('#sBal').textContent = money(inc - exp); $('#sMonth').textContent = money(mExp);
  const b = state.budget, pct = b ? mExp / b * 100 : 0, bar = $('#bBar');
  $('#bTotal').textContent = b ? money(b) : 'Not set'; $('#bSpent').textContent = money(mExp);
  $('#bLeft').textContent = b ? money(Math.max(b - mExp, 0)) : '—';
  bar.style.width = Math.min(pct, 100) + '%';
  const lvl = !b ? ['', 'No budget'] : pct >= 100 ? ['over', 'Overspent'] : pct >= 90 ? ['alert', 'Alert: ' + Math.round(pct) + '%'] : pct >= 75 ? ['warn', 'Warning: ' + Math.round(pct) + '%'] : ['', 'On track: ' + Math.round(pct) + '%'];
  bar.className = lvl[0]; $('#bStatus').textContent = lvl[1];
  const r = [...state.tx].sort(byNew).slice(0, 5);
  $('#recent').innerHTML = r.length ? r.map(t => txHTML(t, false)).join('') : emptyHTML;
}
const byNew = (a, b) => b.date.localeCompare(a.date) || (b.createdAt || 0) - (a.createdAt || 0);

function filtered() {
  const q = $('#q').value.trim().toLowerCase(), f = $('#fDate').value, c = $('#fCat').value, now = new Date(), td = today();
  const wk = new Date(now); wk.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  return state.tx.filter(t => {
    if (state.type !== 'all' && t.type !== state.type) return false;
    if (c !== 'all' && t.category !== c) return false;
    if (q && !`${t.category} ${t.remarks} ${t.paymentMethod}`.toLowerCase().includes(q)) return false;
    if (f === 'today' && t.date !== td) return false;
    if (f === 'week' && t.date < iso(wk)) return false;
    if (f === 'month' && !t.date.startsWith(td.slice(0, 7))) return false;
    if (f === 'custom') { if ($('#dFrom').value && t.date < $('#dFrom').value) return false; if ($('#dTo').value && t.date > $('#dTo').value) return false; }
    return true;
  }).sort(byNew);
}
function renderList() {
  $('#customRange').classList.toggle('hidden', $('#fDate').value !== 'custom');
  const l = filtered();
  $('#txList').innerHTML = !state.tx.length ? emptyHTML : l.length ? l.map(t => txHTML(t, true)).join('') : '<div class="empty"><h3>No matches</h3><p>Try changing your search or filters.</p></div>';
}

let chart;
function renderAnalysis() {
  const mk = monthKey(state.month), list = state.tx.filter(t => t.date.startsWith(mk));
  const inc = sum(list, 'income'), exp = sum(list, 'expense');
  $('#mLabel').textContent = state.month.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const totals = {}; list.filter(t => t.type === 'expense').forEach(t => totals[t.category] = (totals[t.category] || 0) + t.amount);
  const rows = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  $('#mInc').textContent = money(inc); $('#mExp').textContent = money(exp); $('#mSav').textContent = money(inc - exp);
  $('#mCnt').textContent = list.length; $('#mTop').textContent = rows.length ? `${EXP[rows[0][0]] || ''} ${rows[0][0]} — ${money(rows[0][1])}` : '—';
  $('#catList').innerHTML = rows.map(([c, v]) => { const p = v / exp * 100; return `<div class="cat"><div class="row"><span>${EXP[c] || ''} ${esc(c)}</span><b>${money(v)} · ${p.toFixed(1)}%</b></div><div class="bar"><i style="width:${p}%"></i></div></div>`; }).join('');
  $('#chartMsg').textContent = rows.length ? '' : 'No expenses in this month yet.';
  $('.chartbox').classList.toggle('hidden', !rows.length);
  if (!rows.length) return;
  if (typeof Chart === 'undefined') { $('#chartMsg').textContent = 'Chart needs to load once while online. The breakdown below still works.'; return; }
  const data = { labels: rows.map(r => r[0]), datasets: [{ data: rows.map(r => r[1]), borderWidth: 0, backgroundColor: ['#0f766e','#2563eb','#d97706','#7c3aed','#db2777','#059669','#0891b2','#64748b'] }] };
  const color = getComputedStyle(document.documentElement).getPropertyValue('--ink');
  if (chart) chart.destroy();
  chart = new Chart($('#chart'), { type: 'doughnut', data, options: { maintainAspectRatio: false, cutout: '62%', plugins: { legend: { position: 'bottom', labels: { color, boxWidth: 12 } }, tooltip: { callbacks: { label: c => ` ${c.label}: ${money(c.parsed)}` } } } } });
}
function renderAll() { renderHome(); renderList(); renderAnalysis(); $('#budgetIn').value = state.budget || ''; }

/* ---------- navigation & theme ---------- */
function show(v) {
  $$('.view').forEach(s => s.classList.toggle('active', s.id === v));
  $$('.nav button').forEach(b => b.classList.toggle('on', b.dataset.v === v));
  window.scrollTo(0, 0); if (v === 'analysis') renderAnalysis();
}
function setTheme(t) {
  document.documentElement.dataset.theme = t; localStorage.setItem(THEME_KEY, t);
  $('#themeBtn').textContent = t === 'dark' ? '☀️' : '🌙'; $('#themeBtn2').textContent = t === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
  document.querySelector('meta[name=theme-color]').content = t === 'dark' ? '#0d1514' : '#0f766e';
  if ($('#analysis').classList.contains('active')) renderAnalysis();
}

/* ---------- add / edit form ---------- */
function fillCats() {
  const cats = Object.keys(state.formType === 'expense' ? EXP : INC), sel = $('#fCategory'), cur = sel.value;
  sel.innerHTML = '<option value="">Select category</option>' + cats.map(c => `<option>${c}</option>`).join(''); sel.value = cats.includes(cur) ? cur : '';
  updateRemarks();
}
function updateRemarks() {
  const req = $('#fCategory').value === 'Others' && state.formType === 'expense';
  $('#remLbl').textContent = req ? 'Remarks (required) — what was this for?' : 'Remarks (optional)';
  $('#fRem').classList.toggle('req', req); $('#fRem').placeholder = req ? 'e.g. Doctor visit, Gift, Emergency repair' : 'Add a note';
}
function setFormType(t) { state.formType = t; $$('.seg button').forEach(b => b.classList.toggle('on', b.dataset.ty === t)); fillCats(); }
function openForm(id) {
  state.editId = id || null; $('#formErr').textContent = '';
  const t = id && state.tx.find(x => x.id === id);
  $('#dlgTitle').textContent = t ? 'Edit Transaction' : 'Add Transaction';
  setFormType(t ? t.type : 'expense');
  $('#fAmt').value = t ? t.amount : ''; $('#fCategory').value = t ? t.category : '';
  $('#fDateIn').value = t ? t.date : today(); $('#fPay').value = t ? t.paymentMethod : 'Cash'; $('#fRem').value = t ? t.remarks : '';
  updateRemarks(); $('#txDlg').showModal(); $('#fAmt').focus();
}
function submitForm(e) {
  e.preventDefault();
  const amount = parseFloat($('#fAmt').value), category = $('#fCategory').value, date = $('#fDateIn').value, remarks = $('#fRem').value.trim();
  const err = m => { $('#formErr').textContent = m; };
  if (!$('#fAmt').value) return err('Enter an amount.');
  if (!isFinite(amount) || amount <= 0) return err('Amount must be greater than zero.');
  if (!category) return err('Choose a category.');
  if (!date || isNaN(new Date(date + 'T00:00:00'))) return err('Choose a valid date.');
  if (state.formType === 'expense' && category === 'Others' && !remarks) { $('#fRem').focus(); return err('Remarks are required for "Others". Tell us what this expense was for.'); }
  const data = { type: state.formType, amount, category, date, paymentMethod: $('#fPay').value, remarks };
  if (state.editId) Object.assign(state.tx.find(t => t.id === state.editId), data);
  else state.tx.push({ id: uid(), ...data, createdAt: Date.now() });
  save(); renderAll(); $('#txDlg').close(); toast(state.editId ? 'Transaction updated' : 'Transaction saved');
}

/* ---------- data management ---------- */
function download(name, text, mime) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: mime })); a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function exportCSV() {
  if (!state.tx.length) return toast('Nothing to export yet.');
  const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = [['Date','Type','Category','Amount (BDT)','Payment Method','Remarks'], ...[...state.tx].sort(byNew).map(t => [t.date, t.type, t.category, t.amount, t.paymentMethod, t.remarks])];
  download(`expenses-${today()}.csv`, '\uFEFF' + rows.map(r => r.map(q).join(',')).join('\r\n'), 'text/csv');
}
const exportJSON = () => download(`expense-backup-${today()}.json`, JSON.stringify({ app: 'My Expense Tracker', version: 1, exportedAt: new Date().toISOString(), budget: state.budget, transactions: state.tx }, null, 2), 'application/json');
async function importJSON(file) {
  try {
    const d = JSON.parse(await file.text()), arr = Array.isArray(d) ? d : d.transactions;
    if (!Array.isArray(arr)) throw 0;
    const clean = arr.filter(t => t && ['income', 'expense'].includes(t.type) && t.amount > 0 && /^\d{4}-\d{2}-\d{2}$/.test(t.date) && t.category)
      .map(t => ({ id: String(t.id || uid()), type: t.type, amount: Number(t.amount), category: String(t.category), date: t.date, paymentMethod: t.paymentMethod || 'Cash', remarks: String(t.remarks || ''), createdAt: t.createdAt || Date.now(), ...(t.demo ? { demo: true } : {}) }));
    if (!clean.length) throw 0;
    if (!await confirmBox('Restore backup?', `This replaces current data with ${clean.length} transactions from the file.`)) return;
    state.tx = clean; if (!Array.isArray(d) && d.budget >= 0) state.budget = Number(d.budget) || 0;
    save(); renderAll(); toast('Backup restored');
  } catch (e) { toast('That file is not a valid backup.'); }
}
function addDemo() {
  const d = n => { const x = new Date(); x.setDate(Math.max(1, x.getDate() - n)); return iso(x); };
  const s = [['income','Salary',45000,0,'Bank','Monthly salary'],['expense','House Rent',10000,0,'Bank','Monthly rent'],['expense','Food Expense',450,1,'Cash','Lunch & dinner'],['expense','Bike Purpose',1200,2,'Cash','Fuel & servicing'],['expense','Shopping',2500,3,'Card','Clothes'],['expense','Family Expense',3000,4,'bKash','Sent to family'],['expense','Utility Bills',1800,5,'Nagad','Electricity & gas'],['expense','Others',500,6,'Cash','Emergency expense']];
  state.tx.push(...s.map(([type, category, amount, ago, paymentMethod, remarks]) => ({ id: uid(), type, amount, category, date: d(ago), paymentMethod, remarks, createdAt: Date.now(), demo: true })));
  save(); renderAll(); toast('Demo data added');
}

/* ---------- init ---------- */
function init() {
  load(); setTheme(localStorage.getItem(THEME_KEY) || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  $('#fPay').innerHTML = PAY.map(p => `<option>${p}</option>`).join('');
  $('#fCat').innerHTML = '<option value="all">All Categories</option>' + [...Object.keys(EXP), ...Object.keys(INC)].map(c => `<option>${c}</option>`).join('');
  $$('.nav button').forEach(b => b.onclick = () => show(b.dataset.v));
  $('#fab').onclick = () => openForm(); $('#txCancel').onclick = () => $('#txDlg').close();
  $('#txForm').onsubmit = submitForm; $('#fCategory').onchange = updateRemarks;
  $$('.seg button').forEach(b => b.onclick = () => setFormType(b.dataset.ty));
  $('#themeBtn').onclick = $('#themeBtn2').onclick = () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  document.addEventListener('click', async e => {
    const t = e.target.closest('[data-add],[data-edit],[data-del]'); if (!t) return;
    if (t.dataset.add !== undefined) openForm();
    else if (t.dataset.edit) openForm(t.dataset.edit);
    else if (await confirmBox('Delete transaction?', 'This cannot be undone.')) { state.tx = state.tx.filter(x => x.id !== t.dataset.del); save(); renderAll(); toast('Transaction deleted'); }
  });
  ['#q', '#fDate', '#fCat', '#dFrom', '#dTo'].forEach(s => $(s).addEventListener('input', renderList));
  $$('#typeChips button').forEach(b => b.onclick = () => { state.type = b.dataset.t; $$('#typeChips button').forEach(x => x.classList.toggle('on', x === b)); renderList(); });
  $('#mPrev').onclick = () => { state.month.setMonth(state.month.getMonth() - 1); renderAnalysis(); };
  $('#mNext').onclick = () => { state.month.setMonth(state.month.getMonth() + 1); renderAnalysis(); };
  $('#budgetSave').onclick = () => { const v = parseFloat($('#budgetIn').value); if ($('#budgetIn').value && (!isFinite(v) || v < 0)) return toast('Enter a valid budget.'); state.budget = v || 0; save(); renderAll(); toast(state.budget ? 'Budget saved' : 'Budget removed'); };
  $('#expCsv').onclick = exportCSV; $('#expJson').onclick = exportJSON;
  $('#impBtn').onclick = () => $('#impFile').click(); $('#impFile').onchange = e => { if (e.target.files[0]) importJSON(e.target.files[0]); e.target.value = ''; };
  $('#demoAdd').onclick = addDemo;
  $('#demoDel').onclick = () => { const n = state.tx.filter(t => t.demo).length; if (!n) return toast('No demo data found.'); state.tx = state.tx.filter(t => !t.demo); save(); renderAll(); toast('Demo data removed'); };
  $('#clearAll').onclick = async () => { if (await confirmBox('Clear all data?', 'All transactions and your budget will be permanently deleted. Export a backup first if unsure.', true)) { state.tx = []; state.budget = 0; save(); renderAll(); toast('All data cleared'); } };
  renderAll();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('service-worker.js').catch(() => {});
  window.addEventListener('load', () => $('#analysis').classList.contains('active') && renderAnalysis());
}
document.addEventListener('DOMContentLoaded', init);
