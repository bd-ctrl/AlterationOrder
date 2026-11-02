/* [ใหม่ 2026-10-29 ตามที่ขอ] ป๊อปอัป "ข้อมูลลูกค้า" — ดึงจาก Data Lake ผ่านตัวกลาง suitcube-customer-lookup
   ไฟล์แยกทั้งก้อน ไม่แก้โค้ดเดิม · index.html เพิ่มแค่บรรทัด <script src="customer-lookup.js" defer>
   - ปุ่ม "ลูกค้า" วางหน้าปุ่มรายการย้อนหลัง (#histBtn) ใช้ class .hist/.infopop/.infocard ของแอป
   - ดูอย่างเดียว: ไม่เติมฟอร์มบิล ไม่เขียนกลับที่ไหน
   - กุญแจ Data Lake ไม่อยู่ที่นี่ — แนบแค่บัตรผ่าน Lark ของแอป (suitcube_auth_v1) ตัวกลางเช็กกับ /auth/me เอง
   - ข้อความจากข้อมูลทุกช่องใส่ผ่าน textContent (กันชื่อลูกค้ามี HTML) */
(function(){
  'use strict';
  if (window.__customerLookup) return;
  window.__customerLookup = true;

  var PROXY = window.CUSTOMER_LOOKUP_PROXY || 'https://suitcube-customer-lookup.ba-bd5.workers.dev';
  var AUTH_KEY = 'suitcube_auth_v1';
  var ORDERS_FIRST = 3;
  var OPEN_DELAY_MS = 2000;   // กดปุ่ม "ลูกค้า" แล้วรอก่อนเปิดป๊อปอัป
  var MEAS = [['chest','อก'],['waist','เอว'],['shoulder','ไหล่'],['upper_arm','ต้นแขน'],['arm_length','ยาวแขน'],
    ['lower_hip','สะโพก'],['shirt_length_original','ยาวเสื้อ'],['front_length','ยาวหน้า'],['back_length','ยาวหลัง'],
    ['crotch','เป้า'],['thigh','ต้นขา'],['leg_opening','ปลายขา'],['leg_length','ยาวขา']];

  var CSS = [
    '#clBtn svg{width:14px;height:14px;color:var(--gold)}',
    '#clPop .cl-card{width:min(560px,94vw);max-height:86vh;display:flex;flex-direction:column;padding:22px 24px}',
    '#clPop .cl-card h3{margin-bottom:12px}',
    '#clPop .cl-x{background:none;border:none;font-size:24px;line-height:1;color:var(--t3);cursor:pointer;padding:0 2px}',
    '#clPop .cl-back{background:none;border:none;font-family:inherit;font-size:13px;color:var(--goldink);cursor:pointer;padding:0}',
    '#clPop .cl-body{overflow:auto;flex:1 1 auto;min-height:0}',
    '#clPop .cl-search{display:flex;align-items:center;gap:10px;border:1.5px solid var(--rule);border-radius:12px;padding:10px 14px;margin-bottom:6px}',
    '#clPop .cl-search:focus-within{border-color:var(--gold)}',
    '#clPop .cl-search svg{width:17px;height:17px;color:var(--t3);flex:0 0 auto}',
    '#clPop .cl-search input{flex:1;border:none;outline:none;background:transparent;font-family:inherit;font-size:14px;color:var(--ink);min-width:0}',
    '#clPop .cl-hint{font-size:12px;color:var(--t3);margin:0 2px 10px}',
    '#clPop .cl-hint.bad{color:var(--red)}',
    '#clPop .cl-res{display:flex;align-items:center;gap:12px;padding:12px 6px;border-bottom:1px solid var(--rule2);cursor:pointer;width:100%;background:none;border-left:none;border-right:none;border-top:none;font-family:inherit;text-align:left;color:var(--ink)}',
    '#clPop .cl-res:hover,#clPop .cl-res:focus{background:var(--paper);outline:none}',
    '#clPop .cl-nm{font-size:15px;font-weight:500}',
    '#clPop .cl-ph{font-family:"Barlow",sans-serif;font-weight:600;font-size:14px;color:var(--t2)}',
    '#clPop .cl-r{margin-left:auto;text-align:right;font-size:12px;color:var(--t2);flex:0 0 auto}',
    '#clPop .cl-tier{display:inline-block;padding:1px 9px;border-radius:999px;background:rgba(201,162,75,.18);color:var(--goldink);font-weight:600;font-size:11.5px}',
    '#clPop .cl-chip{display:inline-block;padding:1px 9px;border-radius:999px;border:1px solid var(--rule);font-size:11px;color:var(--t2);background:#fff}',
    '#clPop .cl-who .cl-big{font-size:22px;font-weight:600;line-height:1.3}',
    '#clPop .cl-line{font-size:14px;margin-top:2px;display:flex;gap:14px;flex-wrap:wrap}',
    '#clPop .cl-line b{font-family:"Barlow",sans-serif;font-weight:600;font-size:15px}',
    '#clPop .cl-alias{font-size:12px;color:var(--t3);margin-top:4px}',
    '#clPop .cl-chips{margin-top:8px;display:flex;gap:6px;flex-wrap:wrap}',
    '#clPop .cl-sec{margin-top:18px}',
    '#clPop .cl-lbl{display:flex;align-items:baseline;gap:10px;font-weight:600;font-size:15px;margin-bottom:8px;flex-wrap:wrap}',
    '#clPop .cl-lbl .n{font-family:"Antic Slab",serif;font-size:15px;color:var(--gold)}',
    '#clPop .cl-lbl .s{font-weight:400;font-size:12.5px;color:var(--t2)}',
    '#clPop .cl-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}',
    '#clPop .cl-stat{background:var(--paper);border-radius:12px;padding:10px 12px;min-width:0}',
    '#clPop .cl-stat .k{font-size:11.5px;color:var(--t2)}',
    '#clPop .cl-stat .v{font-family:"Barlow",sans-serif;font-weight:700;font-size:20px;line-height:1.2;overflow-wrap:anywhere}',
    '#clPop .cl-stat .v.g{color:var(--goldink)}',
    '#clPop .cl-stat .s{font-size:11px;color:var(--t3)}',
    '#clPop .cl-oc[hidden]{display:none}',
    '#clPop .cl-oc{background:#fff;border:1px solid var(--rule2);border-radius:16px;padding:12px 14px;box-shadow:0 1px 2px rgba(35,34,32,.05);display:flex;flex-direction:column;gap:4px;margin-bottom:10px}',
    '#clPop .cl-orow{display:flex;align-items:center;gap:10px;flex-wrap:wrap}',
    '#clPop .cl-oid{font-family:"Barlow",sans-serif;font-weight:700;font-size:18px;color:var(--green)}',
    '#clPop .cl-od{font-size:12.5px;color:var(--t2)}',
    '#clPop .cl-st{margin-left:auto;font-size:12px;font-weight:600;padding:2px 10px;border-radius:999px;background:rgba(217,119,46,.14);color:var(--orange)}',
    '#clPop .cl-st.done{background:rgba(92,127,79,.14);color:var(--green)}',
    '#clPop .cl-sub{font-size:12.5px;color:var(--t2)}',
    '#clPop .cl-item{display:flex;gap:8px;align-items:center;font-size:13.5px;padding-top:5px;border-top:1px dashed var(--rule2);margin-top:3px;flex-wrap:wrap}',
    '#clPop .cl-sku{font-family:"Barlow",sans-serif;font-weight:700;font-size:13px}',
    '#clPop .cl-ps{margin-left:auto;font-size:12px;color:var(--t2)}',
    '#clPop .cl-urg{color:var(--red);font-weight:700;font-size:12px}',
    '#clPop .cl-more{display:block;width:100%;font-family:inherit;font-size:13px;color:var(--goldink);text-align:center;padding:6px;cursor:pointer;background:none;border:none}',
    '#clPop .cl-meas{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border:1px solid var(--rule2);border-radius:12px;overflow:hidden;background:#fff}',
    '#clPop .cl-meas>div{padding:8px 10px;border-right:1px solid var(--rule2);border-bottom:1px solid var(--rule2)}',
    '#clPop .cl-meas>div:nth-child(4n){border-right:none}',
    '#clPop .cl-meas .k{font-size:11.5px;color:var(--t2)}',
    '#clPop .cl-meas .v{font-family:"Barlow",sans-serif;font-weight:600;font-size:17px}',
    '#clPop .cl-rd{display:flex;gap:10px;align-items:center;padding:10px 0;border-top:1px dashed var(--rule2)}',
    '#clPop .cl-rd:first-child{border-top:none}',
    '#clPop .cl-rd .pt{font-family:"Barlow",sans-serif;font-weight:700;color:var(--goldink);white-space:nowrap}',
    '#clPop .cl-empty{font-size:13px;color:var(--t3);padding:6px 2px}',
    // ตัวรอโหลด: โลโก้ SUITCUBE (รูปเดียวกับ .sc-loader ของแอป ผ่านตัวแปร --logo) + แสงทองวิ่งผ่าน
    '#clPop .cl-load{display:flex;flex-direction:column;align-items:center;gap:9px;padding:26px 0 18px;font-size:12.5px;color:var(--t3)}',
    '#clPop .cl-logo{--h:22px;display:block;flex:none;height:var(--h);width:calc(var(--h)*5.15);-webkit-mask:var(--logo) no-repeat 0 0/100% 100%;mask:var(--logo) no-repeat 0 0/100% 100%;background:linear-gradient(105deg,var(--goldink) 0 40%,#fff4d2 50%,var(--goldink) 60% 100%);background-size:250% 100%;animation:cl-shine 1.7s ease-in-out infinite}',
    '@keyframes cl-shine{from{background-position:100% 0}to{background-position:0 0}}',
    '@media (prefers-reduced-motion:reduce){#clPop .cl-logo{animation:none;background:var(--goldink)}}',
    '#clPop .cl-in{animation:cl-up .42s cubic-bezier(.2,.8,.25,1) both}',
    '@keyframes cl-up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}',
    '@media (prefers-reduced-motion:reduce){#clPop .cl-in{animation:none}}',
    '#clPop .cl-exp{margin-top:6px;padding-top:6px;border-top:1px dashed var(--rule2);display:flex;flex-wrap:wrap;gap:0 8px;font-size:12px;color:var(--goldink)}',
    '#clPop .cl-exp b{font-weight:600}',
    '#clPop .cl-exp span,#clPop .cl-exp b{white-space:nowrap}',
    '#clPop .cl-exp.soon{color:var(--red)}',
    '#clPop .cl-foot{font-size:11.5px;color:var(--t3);margin-top:14px;text-align:center}',
    '@media (max-width:520px){#clPop .cl-stats{grid-template-columns:1fr 1fr}#clPop .cl-meas{grid-template-columns:repeat(3,1fr)}#clPop .cl-meas>div:nth-child(4n){border-right:1px solid var(--rule2)}#clPop .cl-meas>div:nth-child(3n){border-right:none}}'
  ].join('\n');

  /* ---------- ตัวช่วย ---------- */
  function el(tag, cls, text){
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = String(text);
    return e;
  }
  function add(parent){ for (var i = 1; i < arguments.length; i++) if (arguments[i]) parent.appendChild(arguments[i]); return parent; }
  function token(){
    try {
      var o = JSON.parse(localStorage.getItem(AUTH_KEY) || sessionStorage.getItem(AUTH_KEY) || 'null');
      return (o && o.token && +o.expiresAt > Date.now() + 60000) ? o.token : null;
    } catch (e) { return null; }
  }
  function phoneLocal(d){            // 66812345678 -> 081-234-5678
    d = String(d || '').replace(/\D/g, '');
    if (d.indexOf('66') === 0 && d.length >= 10) d = '0' + d.slice(2);
    if (d.length === 10) return d.slice(0,3) + '-' + d.slice(3,6) + '-' + d.slice(6);
    return d;
  }
  function phoneKey(d){             // ใช้เทียบเบอร์ข้ามระบบ: เก็บแค่ 9 หลักท้าย
    d = String(d || '').replace(/\D/g, '');
    return d.length >= 9 ? d.slice(-9) : '';
  }
  function thDate(v){
    if (!v) return '';
    var d = new Date(v);
    if (isNaN(d)) return String(v);
    return d.toLocaleDateString('th-TH', { day:'numeric', month:'short', year:'2-digit' });
  }
  function thMonth(v){
    if (!v) return '';
    var d = new Date(v);
    return isNaN(d) ? String(v) : d.toLocaleDateString('th-TH', { month:'short', year:'2-digit' });
  }
  function num(v){ var n = Number(v); return (v == null || isNaN(n)) ? '—' : n.toLocaleString('th-TH', { maximumFractionDigits:2 }); }
  function baht(v){ return (v == null || isNaN(Number(v))) ? '—' : '฿' + num(v); }
  function present(v){ return v != null && String(v).trim() !== ''; }
  function reveal(list){            // โชว์ทีละชิ้น ห่างกัน 70ms
    list.forEach(function(x, i){ x.style.animationDelay = (i * 70) + 'ms'; x.classList.add('cl-in'); });
  }
  function loading(text){
    var box = el('div', 'cl-load');
    box.setAttribute('role', 'status');
    // ใช้ class sc-loader เพื่อรับ --logo จาก CSS ของแอป · ถ้าแอปไม่มีตัวโหลดนี้ (window.SuitcubeLoader) ก็โชว์แค่ข้อความ
    if (window.SuitcubeLoader) { var lg = el('span', 'sc-loader cl-logo'); lg.setAttribute('aria-hidden', 'true'); box.appendChild(lg); }
    box.appendChild(el('span', null, text));
    return box;
  }

  function api(path){
    var t = token();
    if (!t) return Promise.resolve({ status: 401, json: null });
    return fetch(PROXY + path, { headers: { Authorization: 'Bearer ' + t }, cache: 'no-store' })
      .then(function(r){ return r.json().catch(function(){ return null; }).then(function(j){ return { status: r.status, json: j }; }); })
      .catch(function(){ return { status: 0, json: null }; });
  }
  function errText(r){
    if (r.status === 401) return 'ต้องเข้าสู่ระบบ Lark ก่อน (ลองโหลดหน้าใหม่แล้วล็อกอิน)';
    if (r.status === 0) return 'เชื่อมต่อไม่ได้ ตรวจอินเทอร์เน็ตแล้วลองใหม่';
    return 'ดึงข้อมูลไม่สำเร็จ (' + r.status + ') ลองใหม่อีกครั้ง';
  }

  /* ---------- โครงป๊อปอัป ---------- */
  var pop, card, titleEl, body, searchInput, hintEl, listEl, seq = 0, lastRows = [], lastQuery = '';

  function build(){
    var st = el('style'); st.id = 'clStyle'; st.textContent = CSS; document.head.appendChild(st);

    pop = el('div', 'infopop'); pop.id = 'clPop';
    card = el('div', 'infocard cl-card');
    card.setAttribute('role', 'dialog'); card.setAttribute('aria-modal', 'true'); card.setAttribute('aria-label', 'ข้อมูลลูกค้า');
    titleEl = el('h3');
    body = el('div', 'cl-body');
    add(card, titleEl, body); add(pop, card);
    document.body.appendChild(pop);

    pop.addEventListener('click', function(e){ if (e.target === pop) close(); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && pop.classList.contains('show')) close(); });
  }
  function closeBtn(){
    var x = el('button', 'cl-x', '×'); x.type = 'button'; x.setAttribute('aria-label', 'ปิด');
    x.addEventListener('click', close);
    return x;
  }
  function open(){
    if (!pop) build();
    pop.classList.add('show');
    showSearch();
  }
  function close(){ if (pop) pop.classList.remove('show'); seq++; }

  /* ---------- หน้าค้นหา ---------- */
  function showSearch(){
    titleEl.textContent = '';
    add(titleEl, el('span', null, 'ข้อมูลลูกค้า'), closeBtn());
    body.textContent = '';

    var box = el('div', 'cl-search');
    box.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>';
    searchInput = el('input');
    searchInput.placeholder = 'พิมพ์ชื่อ หรือเบอร์โทร (อย่างน้อย 4 ตัว)';
    searchInput.autocomplete = 'off';
    searchInput.setAttribute('aria-label', 'ค้นหาลูกค้า');
    searchInput.value = lastQuery;
    box.appendChild(searchInput);
    hintEl = el('div', 'cl-hint');
    listEl = el('div');
    add(body, box, hintEl, listEl);

    var timer;
    searchInput.addEventListener('input', function(){ clearTimeout(timer); timer = setTimeout(runSearch, 350); });
    searchInput.addEventListener('keydown', function(e){ if (e.key === 'Enter'){ clearTimeout(timer); runSearch(); } });
    if (lastRows.length) renderList(lastRows); else hintEl.textContent = 'ค้นได้ทั้งลูกค้าหน้าร้าน สมาชิก และลูกค้าสั่งตัด';
    setTimeout(function(){ searchInput.focus(); }, 30);
  }

  function runSearch(){
    var q = searchInput.value.trim();
    var digits = q.replace(/\D/g, '');
    var phoneLike = /^[\d\s\-+()]+$/.test(q);
    lastQuery = q;
    listEl.textContent = '';
    hintEl.className = 'cl-hint';
    if ((phoneLike && digits.length < 4) || (!phoneLike && q.length < 2)) {
      lastRows = [];
      hintEl.textContent = phoneLike ? 'พิมพ์เบอร์อย่างน้อย 4 ตัว' : 'พิมพ์ชื่ออย่างน้อย 2 ตัวอักษร';
      return;
    }
    var my = ++seq;
    hintEl.textContent = ''; hintEl.appendChild(loading('กำลังค้นหา…'));
    api('/search?q=' + encodeURIComponent(q)).then(function(r){
      if (my !== seq) return;
      if (r.status !== 200 || !r.json) { hintEl.className = 'cl-hint bad'; hintEl.textContent = errText(r); return; }
      lastRows = r.json.data || [];
      renderList(lastRows, r.json.limit);
    });
  }

  function renderList(rows, limit){
    listEl.textContent = '';
    hintEl.className = 'cl-hint';
    if (!rows.length) { hintEl.textContent = 'ไม่พบลูกค้า'; return; }
    hintEl.textContent = 'พบ ' + rows.length + ' คน' + (limit && rows.length >= limit ? ' (แสดง ' + limit + ' คนแรก พิมพ์ให้ละเอียดขึ้น)' : '');
    rows.forEach(function(c){
      var b = el('button', 'cl-res'); b.type = 'button';
      var left = el('div');
      add(left, el('div', 'cl-nm', c.name || c.salesforce_name || c.storehub_name || c.feyverly_name || '(ไม่มีชื่อ)'),
                el('div', 'cl-ph', phoneLocal(c.phone_e164_digits) || '—'));
      var right = el('div', 'cl-r');
      add(right, c.member_tier ? el('span', 'cl-tier', c.member_tier) : el('span', 'cl-chip', c.is_registered_member ? 'สมาชิก' : 'ไม่เป็นสมาชิก'));
      var last = c.last_purchase_date || c.last_order_date;
      if (last) add(right, el('br'), document.createTextNode('ซื้อล่าสุด ' + thDate(last)));
      add(b, left, right);
      b.addEventListener('click', function(){ showDetail(c); });
      listEl.appendChild(b);
      b.classList.add('cl-in'); b.style.animationDelay = Math.min(listEl.children.length - 1, 8) * 45 + 'ms';
    });
  }

  /* ---------- หน้ารายละเอียด ---------- */
  function showDetail(c){
    var my = ++seq;
    titleEl.textContent = '';
    var back = el('button', 'cl-back', '‹ กลับไปผลค้นหา'); back.type = 'button';
    back.addEventListener('click', function(){ seq++; showSearch(); });
    add(titleEl, back, closeBtn());
    body.textContent = '';
    body.scrollTop = 0;

    // ส่วนหัว: จากผลค้นหา (มีครบแล้ว ไม่ต้องรอ)
    var who = el('div', 'cl-who');
    add(who, el('div', 'cl-big', c.name || c.salesforce_name || c.storehub_name || c.feyverly_name || '(ไม่มีชื่อ)'));
    var line = el('div', 'cl-line');
    var ph = el('span', null, 'โทร '); add(ph, el('b', null, phoneLocal(c.phone_e164_digits) || '—'));
    add(line, ph, present(c.email) ? el('span', null, c.email) : null);
    who.appendChild(line);
    var alias = [];
    if (present(c.salesforce_name)) alias.push('Salesforce “' + c.salesforce_name + '”');
    if (present(c.storehub_name)) alias.push('StoreHub “' + c.storehub_name + '”');
    if (present(c.feyverly_name)) alias.push('Feyverly “' + c.feyverly_name + '”');
    if (alias.length) who.appendChild(el('div', 'cl-alias', 'ชื่อในแต่ละระบบ: ' + alias.join(' · ')));
    var chips = el('div', 'cl-chips');
    if (c.member_tier) chips.appendChild(el('span', 'cl-tier', c.member_tier + (c.member_since ? ' · สมาชิกตั้งแต่ ' + thMonth(c.member_since) : '')));
    else if (c.is_registered_member) chips.appendChild(el('span', 'cl-tier', 'สมาชิก' + (c.member_since ? ' · ตั้งแต่ ' + thMonth(c.member_since) : '')));
    if (c.in_salesforce) chips.appendChild(el('span', 'cl-chip', 'Salesforce'));
    if (c.in_storehub) chips.appendChild(el('span', 'cl-chip', 'StoreHub'));
    if (c.in_feyverly) chips.appendChild(el('span', 'cl-chip', 'Feyverly'));
    who.appendChild(chips);
    body.appendChild(who);

    var stats = el('div', 'cl-stats');
    var ptStat = stat('แต้มคงเหลือ', c.point_balance != null ? num(c.point_balance) : '—', c.feyverly_lifetime_value != null ? 'สะสมตลอดชีพ ' + baht(c.feyverly_lifetime_value) : '', true);
    add(stats, ptStat,
      stat('ซื้อหน้าร้าน', baht(c.pos_net_sales), (c.pos_bill_count != null ? num(c.pos_bill_count) + ' บิล' : '') + (c.last_purchase_date ? ' · ล่าสุด ' + thDate(c.last_purchase_date) : '')),
      stat('สั่งตัด', c.tailor_order_count != null ? num(c.tailor_order_count) : '—', 'ออเดอร์' + (c.last_order_date ? ' · ล่าสุด ' + thDate(c.last_order_date) : '')));
    add(body, add(el('div', 'cl-sec'), stats));

    var secOrders = section('01', 'ออเดอร์สั่งตัด', '');
    var secMeas = section('02', 'ค่าวัดตัว', '');
    var secRedeem = section('03', 'ประวัติการแลกคูปอง', 'จาก Feyverly');
    var foot = el('div', 'cl-foot', 'ดูอย่างเดียว · ข้อมูลจาก Data Lake (อัปเดตทุกคืน)');
    var rest = [secOrders.wrap, secMeas.wrap, secRedeem.wrap, foot];
    // รอโหลด: ตัวโหลดใหญ่อันเดียวแทน 3 หัวข้อ — ได้ข้อมูลครบทุกส่วนแล้วค่อยโชว์พร้อมกัน (ทยอยเลื่อนขึ้น)
    var wait = loading('กำลังโหลดประวัติลูกค้า…');
    rest.forEach(function(x){ x.hidden = true; });
    add(body, wait, secOrders.wrap, secMeas.wrap, secRedeem.wrap, foot);
    reveal([who, stats.parentNode]);

    var hasSf = c.in_salesforce && present(c.salesforce_name);
    Promise.all([
      hasSf ? api('/detail?name=' + encodeURIComponent(c.salesforce_name)) : null,
      c.in_feyverly ? api('/redemptions?customer_id=' + encodeURIComponent(c.customer_id)) : null
    ]).then(function(res){
      if (my !== seq) return;
      fillOrders(res[0]);
      fillRedeem(res[1]);
      addExpiry(ptStat, res[1]);
      wait.remove();
      rest.forEach(function(x){ x.hidden = false; });
      reveal(rest);
    });

    // 01 + 02: ออเดอร์สั่งตัด (Salesforce) — ค้นด้วยชื่อใน Salesforce แล้วกรองเบอร์ฝั่งนี้
    function fillOrders(r){
      if (!r || r.status === 404) { secOrders.box.appendChild(el('div', 'cl-empty', 'ไม่มีออเดอร์สั่งตัด')); secMeas.box.appendChild(el('div', 'cl-empty', 'ไม่มีค่าวัดตัว')); return; }
      if (r.status !== 200 || !r.json) { secOrders.box.appendChild(el('div', 'cl-empty', errText(r))); secMeas.box.appendChild(el('div', 'cl-empty', '—')); return; }
      var all = r.json.orders || [];
      var key = phoneKey(c.phone_e164_digits);
      var mine = key ? all.filter(function(o){ return phoneKey(o.customer_phone) === key; }) : all;
      if (!mine.length && all.length) {
        // ชื่อตรงแต่เบอร์ในบิลไม่ตรง (หรือบิลไม่มีเบอร์) — โชว์ทั้งหมดแต่เตือน ไม่เดาว่าเป็นคนเดียวกัน
        mine = all;
        secOrders.lbl.appendChild(el('span', 's', '⚠ เบอร์ในบิลไม่ตรงกับเบอร์ลูกค้า อาจเป็นคนชื่อซ้ำ ตรวจก่อนใช้'));
      }
      renderOrders(secOrders.box, mine);
      renderMeas(secMeas, mine);
    }

    // 03: แลกคูปอง (Feyverly)
    function fillRedeem(r){
      if (!r) { secRedeem.box.appendChild(el('div', 'cl-empty', 'ไม่ได้เป็นสมาชิก Feyverly')); return; }
      if (r.status !== 200 || !r.json) { secRedeem.box.appendChild(el('div', 'cl-empty', errText(r))); return; }
      var rows = r.json.data || [];
      if (!rows.length) { secRedeem.box.appendChild(el('div', 'cl-empty', 'ยังไม่เคยแลกคูปอง')); return; }
      var oc = el('div', 'cl-oc'); oc.style.gap = '0'; oc.style.padding = '2px 14px';
      rows.forEach(function(x){
        var row = el('div', 'cl-rd');
        var t = el('div'); t.style.flex = '1'; t.style.minWidth = '0';
        var sub = [thDate(x.redeemed_at), present(x.redemption_location) ? 'สาขา ' + x.redemption_location : ''].filter(Boolean).join(' · ');
        var subEl = el('div', 'cl-sub', sub);
        if (present(x.deal_code)) { subEl.appendChild(document.createTextNode(' · รหัส ')); subEl.appendChild(el('span', 'cl-sku', x.deal_code)); }
        add(t, el('div', null, x.reward_name || '(ไม่มีชื่อรางวัล)'), subEl);
        add(row, t, x.reward_points != null ? el('span', 'pt', '−' + num(x.reward_points) + ' แต้ม') : null);
        oc.appendChild(row);
      });
      secRedeem.box.appendChild(oc);
      if (r.json.limit && rows.length >= r.json.limit) secRedeem.box.appendChild(el('div', 'cl-empty', 'แสดง ' + r.json.limit + ' รายการล่าสุด'));
    }
  }

  // แต้มที่จะหมดอายุ: มาพร้อมผล /redemptions · ไม่มีค่า หรือวันผ่านไปแล้ว (ข้อมูลเก่า) = ไม่โชว์ ไม่เดา
  function addExpiry(box, r){
    var j = r && r.status === 200 && r.json;
    var n = j ? Number(j.points_expiring) : 0;
    if (!(n > 0)) return;
    var d = j.nearest_expiry_date ? new Date(j.nearest_expiry_date) : null;
    if (d && isNaN(d)) d = null;
    var days = d ? (d - Date.now()) / 864e5 : null;
    if (days != null && days < -1) return;
    var line = el('div', 'cl-exp' + (days != null && days <= 30 ? ' soon' : ''));
    add(line, el('b', null, 'จะหมดอายุ ' + num(n) + ' แต้ม'), d ? el('span', null, 'วันที่ ' + thDate(d)) : null);
    box.appendChild(line);
    reveal([line]);
  }

  function stat(k, v, s, gold){
    var d = el('div', 'cl-stat');
    return add(d, el('div', 'k', k), el('div', 'v' + (gold ? ' g' : ''), v), s ? el('div', 's', s) : null);
  }
  function section(n, title, sub){
    var wrap = el('div', 'cl-sec'), lbl = el('div', 'cl-lbl'), box = el('div');
    add(lbl, el('span', 'n', n), document.createTextNode(title), sub ? el('span', 's', sub) : null);
    add(wrap, lbl, box);
    return { wrap: wrap, lbl: lbl, box: box };
  }

  function orderStatus(o){
    var s = o.pickup_status || o.tailor_made_status || '';
    var done = /รับแล้ว|รับสินค้าแล้ว|ส่งแล้ว|completed|picked/i.test(s);
    return { text: s, done: done };
  }
  function renderOrders(box, orders){
    if (!orders.length) { box.appendChild(el('div', 'cl-empty', 'ไม่มีออเดอร์สั่งตัด')); return; }
    var hidden = [];
    orders.forEach(function(o, i){
      var oc = el('div', 'cl-oc');
      var row = el('div', 'cl-orow');
      add(row, el('span', 'cl-oid', o.order_id), o.purchase_date ? el('span', 'cl-od', 'ซื้อ ' + thDate(o.purchase_date)) : null);
      var st = orderStatus(o);
      if (st.text) row.appendChild(el('span', 'cl-st' + (st.done ? ' done' : ''), st.text));
      oc.appendChild(row);
      var sub = [];
      if (present(o.sales_branch_id)) sub.push('สาขา ' + o.sales_branch_id);
      if (present(o.salesperson_id)) sub.push('เซลล์ ' + o.salesperson_id);
      if (o.pickup_appointment_at) sub.push('นัดรับ ' + thDate(o.pickup_appointment_at) + (present(o.pickup_branch_id) ? ' ที่ ' + o.pickup_branch_id : ''));
      if (present(o.pickup_method)) sub.push(o.pickup_method);
      if (sub.length) oc.appendChild(el('div', 'cl-sub', sub.join(' · ')));
      (o.products || []).forEach(function(p){
        var it = el('div', 'cl-item');
        var fab = [p.fabric_code_main, p.fabric_code_secondary, p.fabric_code_trim].filter(present).join(' / ');
        add(it, el('span', 'cl-sku', p.product_id), el('span', null, (p.product_name || '') + (fab ? ' · ผ้า ' + fab : '')),
          p.is_urgent ? el('span', 'cl-urg', 'ด่วน') : null,
          present(p.product_status_latest) ? el('span', 'cl-ps', p.product_status_latest) : null);
        oc.appendChild(it);
      });
      if (i >= ORDERS_FIRST) { oc.hidden = true; hidden.push(oc); }
      box.appendChild(oc);
    });
    if (hidden.length) {
      var more = el('button', 'cl-more', 'ดูอีก ' + hidden.length + ' ออเดอร์ ▾'); more.type = 'button';
      more.addEventListener('click', function(){ hidden.forEach(function(h){ h.hidden = false; }); more.remove(); });
      box.appendChild(more);
    }
  }
  function renderMeas(sec, orders){
    // ค่าวัดตัวล่าสุด: ชิ้นแรกที่มีค่าวัดอย่างน้อย 1 ช่อง ไล่จากออเดอร์ใหม่สุด
    var pick = null, from = null;
    for (var i = 0; i < orders.length && !pick; i++) {
      var ps = orders[i].products || [];
      for (var j = 0; j < ps.length; j++) {
        if (MEAS.some(function(m){ return present(ps[j][m[0]]); })) { pick = ps[j]; from = orders[i]; break; }
      }
    }
    if (!pick) { sec.box.appendChild(el('div', 'cl-empty', 'ไม่มีค่าวัดตัว')); return; }
    sec.lbl.appendChild(el('span', 's', 'จาก ' + from.order_id + ' · ' + pick.product_id + ' (นิ้ว)'));
    var g = el('div', 'cl-meas');
    MEAS.forEach(function(m){
      if (!present(pick[m[0]])) return;
      add(g, add(el('div'), el('div', 'k', m[1]), el('div', 'v', pick[m[0]])));
    });
    sec.box.appendChild(g);
  }

  /* ---------- ปุ่มบนแถบบน ---------- */
  function mountButton(){
    if (document.getElementById('clBtn')) return true;
    var hist = document.getElementById('histBtn');
    if (!hist || !hist.parentNode) return false;
    var b = el('button', 'hist'); b.id = 'clBtn'; b.type = 'button'; b.title = 'ดูข้อมูลลูกค้า';
    b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>';
    b.appendChild(document.createTextNode('ลูกค้า'));
    var opening = false;
    b.addEventListener('click', function(){
      if (opening) return;   // กดซ้ำระหว่างรอไม่นับ
      opening = true;
      b.style.cursor = 'progress';
      setTimeout(function(){ opening = false; b.style.cursor = ''; open(); }, OPEN_DELAY_MS);
    });
    hist.parentNode.insertBefore(b, hist);
    return true;
  }
  function start(){
    if (mountButton()) return;
    // เผื่อแถบบนถูกวาดทีหลัง: ลองอีกไม่กี่ครั้งแล้วเลิก (ไม่กระทบแอปถ้าหาไม่เจอ)
    var tries = 0, iv = setInterval(function(){ if (mountButton() || ++tries > 20) clearInterval(iv); }, 500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
