// Hearth pantry app — main logic
(function(){
  const K = 'hearth_v1';

  function dn(n) {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().split('T')[0];
  }

  const seed = [
    { id: 1, name: 'Whole milk', qty: '1 gallon', cat: 'Fridge', exp: dn(2) },
    { id: 2, name: 'Baby spinach', qty: '5 oz', cat: 'Fridge', exp: dn(4) },
    { id: 3, name: 'Strawberries', qty: '1 lb', cat: 'Fridge', exp: dn(5) },
    { id: 4, name: 'Eggs', qty: '1 dozen', cat: 'Fridge', exp: dn(14) },
    { id: 5, name: 'Greek yogurt', qty: '32 oz', cat: 'Fridge', exp: dn(10) },
    { id: 6, name: 'White rice', qty: '5 lb', cat: 'Pantry', exp: '' },
    { id: 7, name: 'Spaghetti', qty: '1 box', cat: 'Pantry', exp: '' },
    { id: 8, name: 'Olive oil', qty: '500 ml', cat: 'Pantry', exp: dn(180) },
    { id: 9, name: 'Frozen peas', qty: '12 oz', cat: 'Freezer', exp: dn(120) }
  ];

  let st = { items: [], shop: [], nid: 10, f: 'all' };
  try {
    const x = localStorage.getItem(K);
    if (x) { st = JSON.parse(x); }
    else { st.items = seed; sv(); }
  } catch (e) { st.items = seed; }

  function sv() {
    try { localStorage.setItem(K, JSON.stringify(st)); } catch (e) {}
  }

  function du(d) {
    if (!d) return null;
    const t = new Date(); t.setHours(0, 0, 0, 0);
    return Math.round((new Date(d) - t) / 86400000);
  }

  function bg(d) {
    const n = du(d);
    if (n === null) return { c: 'l', t: 'long shelf' };
    if (n < 0) return { c: 'u', t: 'expired' };
    if (n <= 3) return { c: 'u', t: n + 'd' };
    if (n <= 7) return { c: 's', t: n + 'd' };
    if (n <= 30) return { c: 'k', t: n + 'd' };
    return { c: 'l', t: Math.round(n / 30) + 'mo' };
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function ri() {
    const arr = st.f === 'all' ? st.items.slice() : st.items.filter(i => i.cat === st.f);
    arr.sort((a, b) => {
      const x = du(a.exp), y = du(b.exp);
      if (x === null && y === null) return a.name.localeCompare(b.name);
      if (x === null) return 1;
      if (y === null) return -1;
      return x - y;
    });
    document.getElementById('cnt').textContent = st.items.length + ' item' + (st.items.length === 1 ? '' : 's');
    const el = document.getElementById('items');
    if (arr.length === 0) {
      el.innerHTML = '<div class="empty">No items here yet</div>';
      return;
    }
    el.innerHTML = arr.map(i => {
      const b = bg(i.exp);
      return `<div class="row">
        <div class="row-main">
          <div class="row-name">${esc(i.name)}</div>
          <div class="row-sub">${esc(i.qty)} · ${i.cat}</div>
        </div>
        <div class="row-actions">
          <span class="bdg ${b.c}">${b.t}</span>
          <button class="ib" data-e="${i.id}" aria-label="Edit"><i class="ti ti-edit"></i></button>
          <button class="ib" data-d="${i.id}" aria-label="Delete"><i class="ti ti-trash"></i></button>
        </div>
      </div>`;
    }).join('');
    el.querySelectorAll('[data-d]').forEach(b => {
      b.addEventListener('click', () => {
        st.items = st.items.filter(i => i.id !== parseInt(b.dataset.d));
        sv(); ri(); re(); rr();
      });
    });
    el.querySelectorAll('[data-e]').forEach(b => {
      b.addEventListener('click', () => om(parseInt(b.dataset.e)));
    });
  }

  function re() {
    const w = st.items.filter(i => i.exp).sort((a, b) => du(a.exp) - du(b.exp)).filter(i => du(i.exp) <= 7);
    const el = document.getElementById('exp-list');
    if (w.length === 0) {
      el.innerHTML = '<div class="empty">Nothing expiring soon</div>';
      return;
    }
    el.innerHTML = w.map(i => {
      const n = du(i.exp);
      const urgent = n <= 3;
      const styles = urgent
        ? 'background: var(--urgent-bg);'
        : 'background: var(--soon-bg);';
      const tc = urgent ? 'var(--urgent-deep)' : 'var(--soon-deep)';
      const sc = urgent ? 'var(--urgent-text)' : 'var(--soon-text)';
      const pb = urgent ? 'var(--urgent-pill)' : 'var(--soon-pill)';
      const label = urgent ? 'Urgent' : 'Soon';
      const dt = n < 0 ? `Expired ${Math.abs(n)}d ago` : `Expires in ${n}d`;
      return `<div class="exp-card" style="${styles}">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div>
            <div style="font-size: 15px; font-weight: 500; color: ${tc};">${esc(i.name)}</div>
            <div style="font-size: 12px; color: ${sc}; margin-top: 2px;">${dt}</div>
          </div>
          <span class="bdg" style="background: ${pb}; color: ${tc};">${label}</span>
        </div>
      </div>`;
    }).join('');
  }

  function rr() {
    const el = document.getElementById('rec-list');
    if (st.items.length === 0) {
      el.innerHTML = '<div class="empty">Add items first to get recipes</div>';
      return;
    }
    const ns = st.items.map(i => i.name.toLowerCase());
    const h = w => ns.some(n => n.indexOf(w) >= 0);
    const recipes = [];
    if (h('spinach') && h('milk') && h('pasta')) recipes.push({ n: 'Creamy spinach pasta', u: ['spinach', 'milk', 'pasta'], t: '20 min' });
    if (h('strawberr') && h('milk')) recipes.push({ n: 'Strawberry smoothie', u: ['strawberries', 'milk', 'yogurt'], t: '5 min' });
    if (h('egg') && h('spinach')) recipes.push({ n: 'Spinach omelette', u: ['eggs', 'spinach'], t: '10 min' });
    if (h('rice') && h('egg')) recipes.push({ n: 'Egg fried rice', u: ['rice', 'eggs', 'peas'], t: '15 min' });
    if (h('yogurt') && h('strawberr')) recipes.push({ n: 'Berry yogurt parfait', u: ['yogurt', 'strawberries'], t: '5 min' });
    if (h('pasta') && h('olive')) recipes.push({ n: 'Garlic olive oil pasta', u: ['pasta', 'olive oil'], t: '15 min' });
    if (h('chicken') && h('rice')) recipes.push({ n: 'Chicken and rice', u: ['chicken', 'rice'], t: '30 min' });
    if (h('banana') && h('milk')) recipes.push({ n: 'Banana milkshake', u: ['bananas', 'milk'], t: '5 min' });
    if (recipes.length === 0) {
      el.innerHTML = '<div class="empty">No matching recipes for your current items — real AI recipes coming soon</div>';
      return;
    }
    el.innerHTML = recipes.slice(0, 5).map(x => `<div class="recipe-card">
      <div class="recipe-head">
        <div class="recipe-name">${x.n}</div>
        <div class="recipe-tag">uses ${x.u.length}</div>
      </div>
      <div class="recipe-sub">${x.u.join(', ')} · ${x.t}</div>
    </div>`).join('');
  }

  function rs() {
    const el = document.getElementById('slist');
    if (st.shop.length === 0) {
      el.innerHTML = '<div class="empty">Shopping list is empty</div>';
      return;
    }
    el.innerHTML = st.shop.map((it, i) => `<div class="shop-row ${it.done ? 'done' : ''}">
      <button class="ib" data-t="${i}" aria-label="Toggle"><i class="ti ti-${it.done ? 'checkbox' : 'square'}"></i></button>
      <div class="shop-text">${esc(it.name)}</div>
      <button class="ib" data-sd="${i}" aria-label="Remove"><i class="ti ti-x"></i></button>
    </div>`).join('');
    el.querySelectorAll('[data-t]').forEach(b => {
      b.addEventListener('click', () => {
        st.shop[parseInt(b.dataset.t)].done = !st.shop[parseInt(b.dataset.t)].done;
        sv(); rs();
      });
    });
    el.querySelectorAll('[data-sd]').forEach(b => {
      b.addEventListener('click', () => {
        st.shop.splice(parseInt(b.dataset.sd), 1);
        sv(); rs();
      });
    });
  }

  function om(eid) {
    const it = eid ? st.items.find(i => i.id === eid) : null;
    const c = document.getElementById('mc');
    c.innerHTML = `<div class="modal-bg">
      <div class="modal">
        <h2>${it ? 'Edit item' : 'Add item'}</h2>
        <label class="fl">Name</label>
        <input id="fn" type="text" value="${it ? esc(it.name) : ''}" placeholder="e.g. Whole milk" />
        <label class="fl">Quantity</label>
        <input id="fq" type="text" value="${it ? esc(it.qty) : ''}" placeholder="e.g. 1 gallon" />
        <label class="fl">Location</label>
        <select id="fc">${['Fridge', 'Pantry', 'Freezer'].map(x => `<option${it && it.cat === x ? ' selected' : ''}>${x}</option>`).join('')}</select>
        <label class="fl">Expires (optional)</label>
        <input id="fe" type="date" value="${it ? it.exp : ''}" />
        <div style="display: flex; gap: 10px; margin-top: 8px;">
          <button id="fcn" class="btn">Cancel</button>
          <button id="fs" class="btn btn-primary">Save</button>
        </div>
      </div>
    </div>`;
    document.getElementById('fcn').addEventListener('click', () => c.innerHTML = '');
    document.getElementById('mc').querySelector('.modal-bg').addEventListener('click', e => {
      if (e.target.classList.contains('modal-bg')) c.innerHTML = '';
    });
    document.getElementById('fs').addEventListener('click', () => {
      const n = document.getElementById('fn').value.trim();
      if (!n) return;
      const d = {
        name: n,
        qty: document.getElementById('fq').value.trim() || '1',
        cat: document.getElementById('fc').value,
        exp: document.getElementById('fe').value
      };
      if (it) { Object.assign(it, d); }
      else { st.items.push({ id: st.nid++, name: d.name, qty: d.qty, cat: d.cat, exp: d.exp }); }
      sv(); c.innerHTML = ''; ri(); re(); rr();
    });
  }

  function sim() {
    const d = document.getElementById('dz');
    const o = document.getElementById('scan-out');
    d.innerHTML = `<i class="ti ti-loader-2 spin" style="font-size: 36px; color: var(--info-text);"></i>
      <div style="font-size: 14px; margin-top: 10px;">Reading receipt...</div>
      <div style="font-size: 12px; color: var(--text-3); margin-top: 4px;">decoding store abbreviations</div>`;
    setTimeout(() => {
      d.innerHTML = `<i class="ti ti-camera" style="font-size: 36px; color: var(--text-3);"></i>
        <div style="font-size: 14px; margin-top: 10px;">Tap to scan another</div>`;
      const sc = [
        { r: 'GV WHL MLK GAL', name: 'Whole milk', qty: '1 gallon', cat: 'Fridge', exp: dn(7) },
        { r: 'ORG BABY SPNCH', name: 'Organic baby spinach', qty: '5 oz', cat: 'Fridge', exp: dn(6) },
        { r: 'BNNAS', name: 'Bananas', qty: '1 bunch', cat: 'Pantry', exp: dn(5) },
        { r: 'GV LRG EGGS DZ', name: 'Large eggs', qty: '1 dozen', cat: 'Fridge', exp: dn(21) },
        { r: 'CHKN BRST FAM', name: 'Chicken breast', qty: '2.5 lb', cat: 'Fridge', exp: dn(3) }
      ];
      o.innerHTML = `<div style="font-size: 13px; color: var(--text-2); margin-bottom: 10px;">${sc.length} items detected — review and add</div>` +
        sc.map((s, i) => `<div class="scan-item">
          <div style="flex: 1; min-width: 0;">
            <div class="scan-name">${s.name}</div>
            <div class="scan-raw">${s.r} → ${s.qty}</div>
          </div>
          <button class="ib" data-sn="${i}" aria-label="Add"><i class="ti ti-plus" style="font-size: 18px; color: var(--info-text);"></i></button>
        </div>`).join('') +
        '<button id="aall" class="btn btn-primary" style="margin-top: 10px;">Add all to pantry</button>';
      window._sc = sc;
      o.querySelectorAll('[data-sn]').forEach(b => {
        b.addEventListener('click', () => {
          const s = window._sc[parseInt(b.dataset.sn)];
          st.items.push({ id: st.nid++, name: s.name, qty: s.qty, cat: s.cat, exp: s.exp });
          sv();
          b.innerHTML = '<i class="ti ti-check" style="font-size: 18px; color: var(--ok-text);"></i>';
          b.disabled = true;
          ri(); re(); rr();
        });
      });
      document.getElementById('aall').addEventListener('click', () => {
        window._sc.forEach(s => {
          st.items.push({ id: st.nid++, name: s.name, qty: s.qty, cat: s.cat, exp: s.exp });
        });
        sv(); ri(); re(); rr();
        o.innerHTML = `<div style="text-align: center; padding: 24px; color: var(--ok-text); font-size: 14px;">
          <i class="ti ti-check" style="font-size: 28px;"></i>
          <div>Added ${window._sc.length} items</div>
        </div>`;
      });
    }, 1200);
  }

  document.querySelectorAll('.tab').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
      document.querySelectorAll('.screen').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      document.getElementById('scr-' + b.dataset.s).classList.add('active');
      window.scrollTo(0, 0);
    });
  });

  document.querySelectorAll('.pill').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.pill').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      st.f = b.dataset.f;
      ri();
    });
  });

  document.getElementById('add').addEventListener('click', () => om());
  document.getElementById('dz').addEventListener('click', sim);

  document.getElementById('sa').addEventListener('click', () => {
    const i = document.getElementById('si');
    const v = i.value.trim();
    if (v) {
      st.shop.push({ name: v, done: false });
      i.value = '';
      sv(); rs();
    }
  });
  document.getElementById('si').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('sa').click();
  });

  document.getElementById('rst').addEventListener('click', () => {
    if (confirm('Reset all data? This cannot be undone.')) {
      localStorage.removeItem(K);
      st = { items: seed.slice(), shop: [], nid: 10, f: 'all' };
      sv(); ri(); re(); rr(); rs();
    }
  });

  ri(); re(); rr(); rs();
})();
