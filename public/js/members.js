let members = JSON.parse(localStorage.getItem('library_members') || 'null');
  if (!members || members.length === 0) {
    members = seedMembers;
    localStorage.setItem('library_members', JSON.stringify(members));
  }
  let state = { search:'', type:'all', sort:'recent' };
  function fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
  }
  function isExpired(iso) {
    if (!iso) return false;
    return new Date(iso) < new Date();
  }
  function renderStats() {
    document.getElementById('stat-total').textContent = members.length;
    document.getElementById('stat-student').textContent = members.filter(m => m.type === 'Student').length;
    document.getElementById('stat-faculty').textContent = members.filter(m => m.type === 'Faculty').length;
    document.getElementById('stat-expired').textContent = members.filter(m => isExpired(m.expiry)).length;
  }
  function getFiltered() {
    let list = [...members];
    if (state.type !== 'all') list = list.filter(m => m.type === state.type);
    if (state.search.trim()) {
      const q = state.search.trim().toLowerCase();
      list = list.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.cardNo.toLowerCase().includes(q) ||
        (m.rollId || '').toLowerCase().includes(q)
      );
    }
    if (state.sort === 'name') list.sort((a,b) => a.name.localeCompare(b.name));
    else if (state.sort === 'expiry') list.sort((a,b) => new Date(a.expiry || '9999-12-31') - new Date(b.expiry || '9999-12-31'));
    else list.sort((a,b) => new Date(b.registeredOn) - new Date(a.registeredOn));
    return list;
  }
  function initials(name) {
    return name.split(' ').filter(Boolean).slice(0,2).map(w => w[0].toUpperCase()).join('');
  }
  function render() {
    const list = getFiltered();
    const body = document.getElementById('members-body');
    const empty = document.getElementById('empty-state');
    if (list.length === 0) {
      body.innerHTML = '';
      empty.classList.remove('hidden');
    } else {
      empty.classList.add('hidden');
      body.innerHTML = list.map(m => {
        const expired = isExpired(m.expiry);
        return `
        <tr class="fade-row hover:bg-paper/60 transition cursor-pointer" data-card="${m.cardNo}">
          <td class="px-5 py-3">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-forest/10 text-forest flex items-center justify-center font-display text-xs shrink-0">${initials(m.name)}</div>
              <span class="font-medium">${m.name}</span>
            </div>
          </td>
          <td class="px-5 py-3 font-mono text-xs text-ink-light">${m.cardNo}</td>
          <td class="px-5 py-3">
            <span class="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold stamp bg-forest/10 text-forest">${m.type}</span>
          </td>
          <td class="px-5 py-3 text-ink-light">${m.department}</td>
          <td class="px-5 py-3 text-ink-light text-xs">
            <p>${m.phone}</p>
          </td>
          <td class="px-5 py-3">
            <span class="text-xs font-medium ${expired ? 'text-clay' : 'text-ink-light'}">${fmtDate(m.expiry)}${expired ? ' · Expired' : ''}</span>
          </td>
          <td class="px-5 py-3 text-right">
            <button class="text-xs font-medium text-brass-dark hover:text-brass" data-view="${m.cardNo}">View</button>
          </td>
        </tr>`;
      }).join('');
    }
    renderStats();
  }
  document.getElementById('search').addEventListener('input', (e) => { state.search = e.target.value; render(); });
  document.getElementById('sort').addEventListener('change', (e) => { state.sort = e.target.value; render(); });
  document.getElementById('type-chips').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-type]');
    if (!btn) return;
    state.type = btn.dataset.type;
    document.querySelectorAll('#type-chips .chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    render();
  });
  const drawer = document.getElementById('drawer');
  const backdrop = document.getElementById('drawer-backdrop');
  let activeCard = null;
  function openDrawer(cardNo) {
    const m = members.find(x => x.cardNo === cardNo);
    if (!m) return;
    activeCard = cardNo;
    document.getElementById('d-name').textContent = m.name;
    document.getElementById('d-card').textContent = m.cardNo;
    document.getElementById('d-type').textContent = m.type;
    document.getElementById('d-dept').textContent = m.department;
    document.getElementById('d-roll').textContent = m.rollId || '—';
    document.getElementById('d-email').textContent = m.email;
    document.getElementById('d-phone').textContent = m.phone;
    document.getElementById('d-dob').textContent = fmtDate(m.dob);
    document.getElementById('d-reg').textContent = fmtDate(m.registeredOn);
    document.getElementById('d-expiry').textContent = fmtDate(m.expiry);
    document.getElementById('d-address').textContent = m.address || '—';
    drawer.classList.remove('translate-x-full');
    backdrop.classList.remove('opacity-0', 'pointer-events-none');
  }
  function closeDrawer() {
    drawer.classList.add('translate-x-full');
    backdrop.classList.add('opacity-0', 'pointer-events-none');
    activeCard = null;
  }
  document.getElementById('members-body').addEventListener('click', (e) => {
    const row = e.target.closest('tr[data-card]');
    if (row) openDrawer(row.dataset.card);
  });
  document.getElementById('drawer-close').addEventListener('click', closeDrawer);
  backdrop.addEventListener('click', closeDrawer);
  document.getElementById('drawer-delete').addEventListener('click', () => {
    if (!activeCard) return;
    members = members.filter(m => m.cardNo !== activeCard);
    localStorage.setItem('library_members', JSON.stringify(members));
    closeDrawer();
    render();
    const toast = document.getElementById('toast');
    document.getElementById('toast-msg').textContent = 'Member removed';
    toast.classList.remove('translate-y-24', 'opacity-0');
    setTimeout(() => toast.classList.add('translate-y-24', 'opacity-0'), 2500);
  });
  render();