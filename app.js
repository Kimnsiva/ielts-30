(() => {
  'use strict';
  const { intro, plan } = window.IELTS_DATA;
  const KEY = 'ielts30.v1';
  const SKILLS = {
    intro: 'เริ่มต้น', grammar: 'Grammar', listening: 'Listening', reading: 'Reading',
    writing: 'Writing', speaking: 'Speaking', mock: 'Mock test', review: 'ทบทวน',
  };
  const WEEKS = [
    [1, 7, 'วางฐาน Grammar'], [8, 14, 'Listening และ Reading'], [15, 21, 'Writing และ Speaking'],
    [22, 28, 'ฝึกเต็มชุด'], [29, 30, 'ปิดจุดอ่อน'],
  ];
  const STATUS = { todo: 'ยังไม่เริ่ม', doing: 'กำลังทำ', done: 'เสร็จแล้ว' };
  const ICONS = {
    home: '<path d="M3 11l9-8 9 8v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z"/>',
    plan: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>',
    note: '<path d="M5 3h11l3 3v15H5z"/><path d="M9 9h7M9 13h7M9 17h4"/>',
    video: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9l5 3-5 3z"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  };
  const NAV = [['#/', 'ภาพรวม', 'home'], ['#/plan', 'แผน 30 วัน', 'plan'], ['#/notebook', 'สมุดข้อผิดพลาด', 'note'], ['#/videos', 'วิดีโอ', 'video'], ['#/settings', 'ตั้งค่า', 'gear']];

  /* ---------- state ---------- */
  let state = load();
  function load() {
    try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.days) return s; } catch (e) {}
    return { startDate: '', examDate: '', days: {} };
  }
  let memoryOnly = false;
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {
      if (!memoryOnly) { memoryOnly = true; toast('เบราว์เซอร์ไม่ให้บันทึกข้อมูล ข้อมูลจะหายเมื่อปิดหน้านี้ ใช้ Export สำรองไว้'); }
    }
  }
  const dayState = n => {
    const d = state.days[n] || (state.days[n] = {});
    d.status = d.status || 'todo';
    d.tasks = d.tasks || [];
    d.yt = d.yt || {};
    return d;
  };
  const peek = n => state.days[n] || { status: 'todo', tasks: [], yt: {} };
  const statusOf = n => peek(n).status || 'todo';

  /* ---------- helpers ---------- */
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const iso = d => { const z = new Date(d.getTime() - d.getTimezoneOffset() * 6e4); return z.toISOString().slice(0, 10); };
  const today = () => iso(new Date());
  const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 864e5);
  const fmtDate = s => s ? new Date(s + 'T00:00:00').toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const num = v => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
  let toastTimer;
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }
  function currentDay() {
    if (state.startDate) {
      const n = daysBetween(state.startDate, today()) + 1;
      return Math.min(30, Math.max(1, n));
    }
    const next = plan.find(p => statusOf(p.day) !== 'done');
    return next ? next.day : 30;
  }
  const doneCount = () => plan.filter(p => statusOf(p.day) === 'done').length;
  const totalHours = () => plan.reduce((s, p) => s + num(peek(p.day).hours), 0);
  const svg = n => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]}</svg>`;
  const ytSearch = q => 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q);
  const safeUrl = u => /^https?:\/\//i.test(u || '') ? u : '';

  /* ---------- shared pieces ---------- */
  function ribbon() {
    const cur = currentDay();
    return `<div class="ribbon-wrap"><div class="ribbon" role="list">${plan.map(p =>
      `<a role="listitem" href="#/day/${p.day}" class="${statusOf(p.day)}${p.day === cur ? ' current' : ''}" style="--c:var(--${p.skill})"
        title="วัน ${p.day}: ${esc(p.title)} (${STATUS[statusOf(p.day)]})" aria-label="วัน ${p.day} ${esc(p.title)} ${STATUS[statusOf(p.day)]}"></a>`).join('')}</div>
      <div class="legend">${Object.entries(SKILLS).filter(([k]) => k !== 'intro').map(([k, v]) => `<span><i style="--c:var(--${k})"></i>${v}</span>`).join('')}</div></div>`;
  }
  const chip = k => `<span class="chip" style="--c:var(--${k})">${SKILLS[k]}</span>`;
  const stateBadge = n => `<span class="state ${statusOf(n)}">${STATUS[statusOf(n)]}</span>`;

  /* ---------- views ---------- */
  function viewHome() {
    const cur = plan[currentDay() - 1], done = doneCount(), hrs = totalHours();
    let exam = '–';
    if (state.examDate) { const d = daysBetween(today(), state.examDate); exam = d >= 0 ? d : 'ผ่านแล้ว'; }
    const started = Object.values(state.days).some(d => d.status && d.status !== 'todo');
    return `
      <div class="page-head"><div><h1>IELTS 30 วัน</h1><p class="sub">เป้าหมาย: ${esc(intro[0].v)}</p></div></div>
      <div class="stack">
        <section class="card">${ribbon()}</section>
        <section class="card now" style="--c:var(--${cur.skill})">
          <div class="daynum">${cur.day}</div>
          <div><div>${chip(cur.skill)} <span class="sub">${esc(cur.time)}</span></div>
            <h2 style="margin-top:6px;font-size:22px">${esc(cur.title)}</h2>
            <p class="sub">${esc(cur.outcome)}</p></div>
          <a class="btn primary" href="#/day/${cur.day}">${started ? 'ทำต่อวันนี้' : 'เริ่มวันแรก'}</a>
        </section>
        <section class="stats">
          <div class="stat"><b>${done}<small style="font-size:16px;color:var(--muted)">/30</small></b><span>วันที่เสร็จ</span></div>
          <div class="stat"><b>${hrs % 1 ? hrs.toFixed(1) : hrs}</b><span>ชั่วโมงที่ใช้</span></div>
          <div class="stat"><b>${exam}</b><span>วันถึงวันสอบ</span></div>
          <div class="stat"><b>${plan.filter(p => peek(p.day).mistakes && peek(p.day).mistakes.trim()).length}</b><span>วันที่จดข้อผิดพลาด</span></div>
        </section>
        <details class="card intro"><summary>คู่มือใช้แผน</summary>
          <dl style="margin-top:14px">${intro.map(i => `<dt>${esc(i.k)}</dt><dd>${esc(i.v)}</dd>`).join('')}</dl></details>
      </div>`;
  }

  function viewPlan(filter = 'all') {
    const list = p => filter === 'all' || p.skill === filter;
    return `
      <div class="page-head"><div><h1>แผน 30 วัน</h1><p class="sub">กดวันที่ต้องการเพื่อเปิดรายละเอียดและบันทึกผล</p></div></div>
      <div class="filters" role="group" aria-label="กรองตามทักษะ">
        <button class="btn small" data-filter="all" aria-pressed="${filter === 'all'}">ทั้งหมด</button>
        ${['grammar', 'listening', 'reading', 'writing', 'speaking', 'mock', 'review'].map(k => `<button class="btn small" data-filter="${k}" aria-pressed="${filter === k}">${SKILLS[k]}</button>`).join('')}
      </div>
      ${WEEKS.map(([a, b, name], i) => {
        const items = plan.filter(p => p.day >= a && p.day <= b && list(p));
        if (!items.length) return '';
        const wd = plan.filter(p => p.day >= a && p.day <= b && statusOf(p.day) === 'done').length;
        return `<section class="week"><h2>สัปดาห์ ${i + 1} ${esc(name)}<small>${wd}/${b - a + 1} วัน</small></h2><div class="rows">${items.map(p => `
          <a class="row" href="#/day/${p.day}" style="--c:var(--${p.skill})">
            <span class="n">${p.day}</span>
            <span><span class="t">${esc(p.title)}</span><br><span class="m">${SKILLS[p.skill]} · ${esc(p.time)}</span></span>
            ${stateBadge(p.day)}</a>`).join('')}</div></section>`;
      }).join('') || '<div class="card empty">ไม่มีวันที่ตรงกับตัวกรองนี้</div>'}`;
  }

  function viewDay(n) {
    n = Math.min(30, Math.max(1, +n || 1));
    const p = plan[n - 1], d = peek(n), yt = d.yt || {};
    const checked = d.tasks || [];
    return `
      <div class="crumbs">
        <a class="btn small" href="#/plan">← แผนทั้งหมด</a>
        <span style="display:flex;gap:6px">
          <a class="btn small" href="#/day/${Math.max(1, n - 1)}" ${n === 1 ? 'aria-disabled="true" style="opacity:.4;pointer-events:none"' : ''}>วันก่อนหน้า</a>
          <a class="btn small" href="#/day/${Math.min(30, n + 1)}" ${n === 30 ? 'aria-disabled="true" style="opacity:.4;pointer-events:none"' : ''}>วันถัดไป</a>
        </span>
      </div>
      <div class="day-title" style="--c:var(--${p.skill})">
        <div class="daynum">${n}</div>
        <div>${chip(p.skill)} <span class="sub">แนะนำ ${esc(p.time)}</span><h1 style="margin-top:6px">${esc(p.title)}</h1></div>
      </div>
      <div class="stack" data-day="${n}">
        <section class="card">
          <div class="seg" role="group" aria-label="สถานะ">${Object.entries(STATUS).map(([k, v]) => `<button data-status="${k}" aria-pressed="${(d.status || 'todo') === k}">${v}</button>`).join('')}</div>
          <dl class="kv"><dt>เนื้อหา</dt><dd>${esc(p.learn)}</dd><dt>ผลลัพธ์ที่ต้องได้</dt><dd>${esc(p.outcome)}</dd></dl>
        </section>
        <section class="card"><h2>งานวันนี้</h2>
          <ul class="checks">${p.tasks.map((t, i) => `<li><label><input type="checkbox" data-task="${i}" ${checked[i] ? 'checked' : ''}><span>${esc(t)}</span></label></li>`).join('')}</ul>
        </section>
        <section class="card"><h2>บันทึกผล</h2>
          <div class="grid2">
            <label class="field"><span>วันที่เรียน</span><input type="date" data-f="date" value="${esc(d.date || '')}"></label>
            <label class="field"><span>เวลาที่ใช้ (ชั่วโมง)</span><input type="number" min="0" max="24" step="0.25" inputmode="decimal" data-f="hours" value="${esc(d.hours ?? '')}"></label>
          </div>
          <label class="field"><span>คะแนนหรือผลลัพธ์</span><input type="text" data-f="score" value="${esc(d.score || '')}" placeholder="เช่น Listening 22/40"></label>
          <label class="field"><span>ข้อผิดพลาดที่พบ และสิ่งที่ต้องทบทวน</span><textarea data-f="mistakes" placeholder="จดสิ่งที่พลาด เพื่อกลับมาทบทวนในสมุดข้อผิดพลาด">${esc(d.mistakes || '')}</textarea></label>
        </section>
        <section class="card"><h2>วิดีโอสำหรับวันนี้</h2>
          <p class="sub">${esc(p.search)}</p>
          <div class="yt-actions"><a class="btn small" target="_blank" rel="noopener" href="${ytSearch(p.search)}">ค้นหาใน YouTube</a>
            ${safeUrl(yt.link) ? `<a class="btn small" target="_blank" rel="noopener" href="${esc(yt.link)}">เปิดคลิปที่เลือก</a>` : ''}</div>
          <label class="field"><span>ลิงก์คลิป</span><input type="url" data-y="link" value="${esc(yt.link || '')}" placeholder="https://www.youtube.com/watch?v=…"></label>
          <label class="field"><span>ช่องหรือผู้สอน</span><input type="text" data-y="channel" value="${esc(yt.channel || '')}"></label>
          <label class="field"><span>สรุปและจุดที่ต้องจำ</span><textarea data-y="notes">${esc(yt.notes || '')}</textarea></label>
          <label class="switch"><input type="checkbox" data-y="practiced" ${yt.practiced ? 'checked' : ''}> ฝึกตามคลิปแล้ว</label>
        </section>
      </div>`;
  }

  function viewNotebook() {
    const notes = plan.filter(p => (peek(p.day).mistakes || '').trim());
    const scores = plan.filter(p => (peek(p.day).score || '').trim());
    return `
      <div class="page-head"><div><h1>สมุดข้อผิดพลาด</h1><p class="sub">รวมที่จดไว้ในแต่ละวัน ใช้ทบทวนก่อนสอบ</p></div>
        <button class="btn" data-print>พิมพ์หน้านี้</button></div>
      <div class="stack">
        <section class="card"><h2>ข้อผิดพลาดและสิ่งที่ต้องทบทวน</h2>
          ${notes.length ? notes.map(p => `<div class="note" style="--c:var(--${p.skill})"><a class="n" href="#/day/${p.day}">${p.day}</a>
            <div><strong>${esc(p.title)}</strong> <small>${peek(p.day).date ? fmtDate(peek(p.day).date) : ''}</small><p>${esc(peek(p.day).mistakes)}</p></div></div>`).join('')
            : '<p class="empty">ยังไม่มีข้อผิดพลาดที่จดไว้ เปิดวันที่เรียนแล้วจดในช่อง “ข้อผิดพลาดที่พบ”</p>'}
        </section>
        <section class="card"><h2>บันทึกคะแนน</h2>
          ${scores.length ? `<div class="scroll"><table><thead><tr><th>วัน</th><th>หัวข้อ</th><th>วันที่</th><th>คะแนน</th></tr></thead><tbody>${scores.map(p =>
            `<tr><td><a href="#/day/${p.day}">${p.day}</a></td><td>${esc(p.title)}</td><td>${fmtDate(peek(p.day).date)}</td><td>${esc(peek(p.day).score)}</td></tr>`).join('')}</tbody></table></div>`
            : '<p class="empty">ยังไม่มีคะแนน เริ่มจากวัน 1 ที่ให้ทำ mini test</p>'}
        </section>
      </div>`;
  }

  function viewVideos() {
    return `
      <div class="page-head"><div><h1>วิดีโอ</h1><p class="sub">หัวข้อค้นหาของแต่ละวัน กดเพื่อค้นใน YouTube</p></div></div>
      <div class="rows">${plan.map(p => { const y = peek(p.day).yt || {};
        return `<div class="row" style="--c:var(--${p.skill})"><a class="n" href="#/day/${p.day}">${p.day}</a>
          <span><a class="t" style="text-decoration:none" target="_blank" rel="noopener" href="${ytSearch(p.search)}">${esc(p.search)}</a><br>
          <span class="m">${y.channel ? esc(y.channel) : 'ยังไม่เลือกคลิป'}${safeUrl(y.link) ? ` · <a target="_blank" rel="noopener" href="${esc(y.link)}">เปิดคลิป</a>` : ''}</span></span>
          <span class="state ${y.practiced ? 'done' : ''}">${y.practiced ? 'ฝึกแล้ว' : 'ยังไม่ฝึก'}</span></div>`; }).join('')}</div>`;
  }

  function viewSettings() {
    return `
      <div class="page-head"><div><h1>ตั้งค่า</h1><p class="sub">ข้อมูลเก็บในเบราว์เซอร์เครื่องนี้เท่านั้น ใช้ Export เพื่อสำรองหรือย้ายเครื่อง</p></div></div>
      <div class="stack">
        <section class="card"><h2>วันสำคัญ</h2>
          <div class="grid2">
            <label class="field"><span>วันเริ่มแผน (ใช้เลือก “วันนี้” อัตโนมัติ)</span><input type="date" data-s="startDate" value="${esc(state.startDate)}"></label>
            <label class="field"><span>วันสอบ</span><input type="date" data-s="examDate" value="${esc(state.examDate)}"></label>
          </div>
          <div class="actions"><button class="btn small" data-set-start>เริ่มวันนี้</button></div>
        </section>
        <section class="card"><h2>สำรองข้อมูล</h2>
          <div class="actions">
            <button class="btn" data-export-json>Export JSON</button>
            <label class="btn" tabindex="0">Import JSON<input type="file" accept="application/json" hidden data-import></label>
            <button class="btn" data-export-csv>Export CSV (เปิดใน Excel)</button>
          </div>
        </section>
        <section class="card"><h2>ธีม</h2>
          <div class="seg" role="group" aria-label="ธีม">${[['auto', 'ตามเครื่อง'], ['light', 'สว่าง'], ['dark', 'มืด']].map(([k, v]) => `<button data-theme="${k}" aria-pressed="${themePref() === k}">${v}</button>`).join('')}</div>
        </section>
        <section class="card"><h2>เริ่มใหม่</h2><p class="sub">ลบข้อมูลทั้งหมดในเครื่องนี้ ทำได้ครั้งเดียว ควร Export ก่อน</p>
          <div class="actions"><button class="btn danger" data-reset>ลบข้อมูลทั้งหมด</button></div></section>
      </div>`;
  }

  /* ---------- theme ---------- */
  function themePref() { try { return localStorage.getItem('ielts30.theme') || 'auto'; } catch (e) { return 'auto'; } }
  function applyTheme(t) {
    if (t === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t);
  }

  /* ---------- export / import ---------- */
  function download(name, text, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  const csvCell = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  function exportCsv() {
    const head = ['วัน', 'หัวข้อ', 'สถานะ', 'วันที่', 'เวลาที่ใช้ (ชม.)', 'คะแนน/ผลลัพธ์', 'ข้อผิดพลาดที่พบ', 'หัวข้อค้นหา YouTube', 'ลิงก์คลิป', 'ช่อง/ผู้สอน', 'จดสรุป', 'ฝึกแล้ว'];
    const rows = plan.map(p => { const d = peek(p.day), y = d.yt || {};
      return [p.day, p.title, STATUS[d.status || 'todo'], d.date, d.hours, d.score, d.mistakes, p.search, y.link, y.channel, y.notes, y.practiced ? 'ใช่' : '']; });
    download('ielts-30-day-progress.csv', '﻿' + [head, ...rows].map(r => r.map(csvCell).join(',')).join('\r\n'), 'text/csv;charset=utf-8');
  }
  function importJson(file) {
    const fr = new FileReader();
    fr.onload = () => {
      try {
        const s = JSON.parse(fr.result);
        if (!s || typeof s.days !== 'object') throw new Error('bad');
        if (!confirm('นำเข้าข้อมูลนี้ทับข้อมูลปัจจุบัน?')) return;
        state = { startDate: s.startDate || '', examDate: s.examDate || '', days: s.days }; save(); render(); toast('นำเข้าข้อมูลแล้ว');
      } catch (e) { toast('ไฟล์นี้ไม่ใช่ข้อมูลที่ export จากแอปนี้'); }
    };
    fr.readAsText(file);
  }

  /* ---------- router ---------- */
  let planFilter = 'all';
  function render() {
    const hash = location.hash || '#/';
    const [, route, arg] = hash.split('/');
    const r = route || '';
    let html;
    if (r === 'plan') html = viewPlan(planFilter);
    else if (r === 'day') html = viewDay(arg);
    else if (r === 'notebook') html = viewNotebook();
    else if (r === 'videos') html = viewVideos();
    else if (r === 'settings') html = viewSettings();
    else html = viewHome();
    $('#app').innerHTML = html;
    const active = r === 'day' ? 'plan' : r;
    $('#nav').innerHTML = NAV.map(([h, label, ic]) => {
      const k = h.replace('#/', '');
      return `<a href="${h}" ${k === active ? 'aria-current="page"' : ''}>${svg(ic)}<span>${label}</span></a>`;
    }).join('');
    $('#navFoot').textContent = `เสร็จ ${doneCount()}/30 วัน`;
    document.title = r === 'day' ? `วัน ${+arg || 1} · IELTS 30 วัน` : 'IELTS 30 วัน';
  }
  window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); $('#app').focus({ preventScroll: true }); });

  /* ---------- events ---------- */
  function setStatus(n, s) {
    const d = dayState(n); d.status = s;
    if (s !== 'todo' && !d.date) d.date = today();
    if (s === 'done') d.tasks = plan[n - 1].tasks.map(() => true);
    save();
  }
  document.addEventListener('click', e => {
    const t = e.target.closest('button, label.btn');
    if (!t) return;
    const day = t.closest('[data-day]');
    if (t.dataset.status && day) { setStatus(+day.dataset.day, t.dataset.status); render(); if (t.dataset.status === 'done') toast('บันทึกวัน ' + day.dataset.day + ' เสร็จแล้ว'); }
    else if (t.dataset.filter) { planFilter = t.dataset.filter; render(); }
    else if (t.dataset.theme) { try { localStorage.setItem('ielts30.theme', t.dataset.theme); } catch (er) {} applyTheme(t.dataset.theme); render(); }
    else if (t.hasAttribute('data-export-json')) download('ielts-30-day-backup.json', JSON.stringify(state, null, 2), 'application/json');
    else if (t.hasAttribute('data-export-csv')) exportCsv();
    else if (t.hasAttribute('data-print')) window.print();
    else if (t.hasAttribute('data-set-start')) { state.startDate = today(); save(); render(); toast('ตั้งวันเริ่มเป็นวันนี้แล้ว'); }
    else if (t.hasAttribute('data-reset')) { if (confirm('ลบข้อมูลทั้งหมดในเครื่องนี้? การลบนี้ย้อนกลับไม่ได้')) { state = { startDate: '', examDate: '', days: {} }; save(); render(); toast('ลบข้อมูลแล้ว'); } }
  });
  document.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('label.btn')) { e.preventDefault(); e.target.querySelector('input').click(); }
  });
  let saveT;
  const touch = () => { clearTimeout(saveT); saveT = setTimeout(save, 250); };
  document.addEventListener('input', e => {
    const el = e.target, day = el.closest('[data-day]');
    if (day && el.dataset.f) { dayState(+day.dataset.day)[el.dataset.f] = el.dataset.f === 'hours' ? el.value : el.value; touch(); }
    else if (day && el.dataset.y && el.type !== 'checkbox') { dayState(+day.dataset.day).yt[el.dataset.y] = el.value; touch(); }
    else if (el.dataset.s) { state[el.dataset.s] = el.value; touch(); }
  });
  document.addEventListener('change', e => {
    const el = e.target, day = el.closest('[data-day]');
    if (el.hasAttribute('data-import') && el.files[0]) { importJson(el.files[0]); el.value = ''; return; }
    if (day && el.dataset.task !== undefined) {
      const n = +day.dataset.day, d = dayState(n);
      d.tasks[+el.dataset.task] = el.checked;
      const all = plan[n - 1].tasks.every((_, i) => d.tasks[i]), any = plan[n - 1].tasks.some((_, i) => d.tasks[i]);
      if (all) { d.status = 'done'; if (!d.date) d.date = today(); }
      else if (any && d.status !== 'done') d.status = 'doing';
      else if (d.status === 'done') d.status = 'doing';
      if (any && !d.date) d.date = today();
      save();
      const seg = day.querySelector('.seg'); // refresh status buttons and date without re-rendering the checklist
      seg.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.status === d.status));
      const di = day.querySelector('[data-f="date"]'); if (di) di.value = d.date || '';
    } else if (day && el.dataset.y === 'practiced') { dayState(+day.dataset.day).yt.practiced = el.checked; save(); }
    else if (el.dataset.s || el.dataset.f || el.dataset.y) { save(); if (el.dataset.s) render(); }
  });
  window.addEventListener('pagehide', () => { clearTimeout(saveT); save(); });

  applyTheme(themePref());
  render();
})();
