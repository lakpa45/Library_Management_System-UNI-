const FINE_PER_DAY = 5; 
  const seedMembers = [
    { cardNo:'STU-2026-0001', name:'sahil', type:'Student', department:'Computer Science' },
    { cardNo:'FAC-2026-0002', name:'pihang', type:'Faculty', department:'Computer Science' },
    { cardNo:'STU-2026-0003', name:'donge', type:'Student', department:'Computer Science' },
    { cardNo:'STF-2026-0004', name:'hibu', type:'Staff', department:'Computer Science' },
    { cardNo:'STU-2026-0005', name:'kisan', type:'Student', department:'Computer Science' },
  ];
  const seedBooks = [
    { id:'BK-1001', title:'Design Patterns', author:'Gamma, Helm, Johnson, Vlissides', isbn:'9780201633610', copies:3 },
    { id:'BK-1002', title:'Clean Architecture', author:'Robert C. Martin', isbn:'9780134494166', copies:2 },
    { id:'BK-1003', title:'The Pragmatic Programmer', author:'Hunt & Thomas', isbn:'9780135957059', copies:4 },
    { id:'BK-1004', title:'Database System Concepts', author:'Silberschatz, Korth, Sudarshan', isbn:'9780078022159', copies:2 },
    { id:'BK-1005', title:'Introduction to Algorithms', author:'Cormen, Leiserson, Rivest, Stein', isbn:'9780262046305', copies:3 },
    { id:'BK-1006', title:'Operating System Concepts', author:'Silberschatz, Galvin, Gagne', isbn:'9781119800361', copies:2 },
    { id:'BK-1007', title:'Compiler Design', author:'Aho, Lam, Sethi, Ullman', isbn:'9788131720095', copies:2 },
    { id:'BK-1008', title:'Computer Networks', author:'Andrew S. Tanenbaum', isbn:'9780132126953', copies:3 },
  ];

  let members = JSON.parse(localStorage.getItem('library_members') || 'null');
  if (!members || members.length === 0) { members = seedMembers; localStorage.setItem('library_members', JSON.stringify(members)); }

  let books = JSON.parse(localStorage.getItem('library_catalog') || 'null');
  if (!books || books.length === 0) { books = seedBooks; localStorage.setItem('library_catalog', JSON.stringify(books)); }

  let loans = JSON.parse(localStorage.getItem('library_loans') || 'null');
  if (!loans) {
    const today = new Date();
    const d = (n) => new Date(today.getTime() + n*86400000).toISOString().slice(0,10);
    loans = [
      { id:'LN-0001', bookId:'BK-1004', bookTitle:'Database System Concepts', memberCard:'STU-2026-0005', memberName:'hibu', issueDate:d(-19), dueDate:d(-8), returnDate:null },
      { id:'LN-0002', bookId:'BK-1007', bookTitle:'Compiler Design', memberCard:'STU-2026-0003', memberName:'kishan', issueDate:d(-13), dueDate:d(1), returnDate:null },
      { id:'LN-0003', bookId:'BK-1005', bookTitle:'Introduction to Algorithms', memberCard:'STU-2026-0001', memberName:'lakpa', issueDate:d(-4), dueDate:d(10), returnDate:null },
    ];
    localStorage.setItem('library_loans', JSON.stringify(loans));
  }

  function persistLoans() { localStorage.setItem('library_loans', JSON.stringify(loans)); }
  function persistBooks() { localStorage.setItem('library_catalog', JSON.stringify(books)); }

  function todayISO() { return new Date().toISOString().slice(0,10); }
  function daysBetween(a, b) { return Math.round((new Date(b) - new Date(a)) / 86400000); }
  function fmtDate(iso) { return iso ? new Date(iso).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'; }

  function copiesOnLoan(bookId) { return loans.filter(l => l.bookId === bookId && !l.returnDate).length; }
  function availableCopies(book) { return book.copies - copiesOnLoan(book.id); }

  const tabIssue = document.getElementById('tab-issue');
  const tabReturn = document.getElementById('tab-return');
  const issueForm = document.getElementById('issue-form');
  const returnForm = document.getElementById('return-form');
  tabIssue.addEventListener('click', () => {
    tabIssue.classList.add('active'); tabReturn.classList.remove('active');
    tabReturn.classList.add('text-ink-light'); tabIssue.classList.remove('text-ink-light');
    issueForm.classList.remove('hidden'); returnForm.classList.add('hidden');
  });
  tabReturn.addEventListener('click', () => {
    tabReturn.classList.add('active'); tabIssue.classList.remove('active');
    tabIssue.classList.add('text-ink-light'); tabReturn.classList.remove('text-ink-light');
    returnForm.classList.remove('hidden'); issueForm.classList.add('hidden');
  });
  function wireAutocomplete({ inputId, suggestId, hiddenId, getItems, renderItem, onSelect }) {
    const input = document.getElementById(inputId);
    const box = document.getElementById(suggestId);
    const hidden = document.getElementById(hiddenId);

    input.addEventListener('input', () => {
      hidden.value = '';
      const q = input.value.trim().toLowerCase();
      if (!q) { box.classList.add('hidden'); box.innerHTML=''; return; }
      const items = getItems(q).slice(0, 8);
      if (items.length === 0) {
        box.innerHTML = `<div class="px-3.5 py-2.5 text-xs text-ink-light">No matches</div>`;
      } else {
        box.innerHTML = items.map((it, idx) => `<div class="suggest-item px-3.5 py-2.5 text-sm cursor-pointer" data-idx="${idx}">${renderItem(it)}</div>`).join('');
      }
      box.classList.remove('hidden');
      box.dataset.items = JSON.stringify(items);
    });

    box.addEventListener('click', (e) => {
      const row = e.target.closest('[data-idx]');
      if (!row) return;
      const items = JSON.parse(box.dataset.items || '[]');
      const item = items[Number(row.dataset.idx)];
      onSelect(item);
      box.classList.add('hidden');
    });

    document.addEventListener('click', (e) => {
      if (!box.contains(e.target) && e.target !== input) box.classList.add('hidden');
    });
  }

  wireAutocomplete({
    inputId: 'i-member-search', suggestId: 'i-member-suggest', hiddenId: 'i-member-id',
    getItems: (q) => members.filter(m => m.name.toLowerCase().includes(q) || m.cardNo.toLowerCase().includes(q)),
    renderItem: (m) => `<span class="font-medium">${m.name}</span> <span class="text-ink-light text-xs font-mono">· ${m.cardNo}</span>`,
    onSelect: (m) => { document.getElementById('i-member-search').value = `${m.name} (${m.cardNo})`; document.getElementById('i-member-id').value = m.cardNo; showError('i-member-search', false); }
  });

  wireAutocomplete({
    inputId: 'i-book-search', suggestId: 'i-book-suggest', hiddenId: 'i-book-id',
    getItems: (q) => books.filter(b => b.title.toLowerCase().includes(q) || b.isbn.includes(q)),
    renderItem: (b) => {
      const avail = availableCopies(b);
      return `<span class="font-medium">${b.title}</span> <span class="text-xs ${avail>0?'text-sage':'text-clay'}">· ${avail>0? avail+' available' : 'none available'}</span>`;
    },
    onSelect: (b) => { document.getElementById('i-book-search').value = b.title; document.getElementById('i-book-id').value = b.id; showError('i-book-search', false); }
  });

  wireAutocomplete({
    inputId: 'r-loan-search', suggestId: 'r-loan-suggest', hiddenId: 'r-loan-id',
    getItems: (q) => loans.filter(l => !l.returnDate && (l.memberName.toLowerCase().includes(q) || l.bookTitle.toLowerCase().includes(q))),
    renderItem: (l) => `<span class="font-medium">${l.bookTitle}</span> <span class="text-ink-light text-xs">· ${l.memberName}</span>`,
    onSelect: (l) => {
      document.getElementById('r-loan-search').value = `${l.bookTitle} — ${l.memberName}`;
      document.getElementById('r-loan-id').value = l.id;
      showError('r-loan-search', false);
      const detail = document.getElementById('r-loan-detail');
      detail.classList.remove('hidden');
      document.getElementById('r-d-title').textContent = l.bookTitle;
      document.getElementById('r-d-member').textContent = l.memberName;
      document.getElementById('r-d-due').textContent = fmtDate(l.dueDate);
      const overdueDays = Math.max(0, daysBetween(l.dueDate, todayISO()));
      const fine = overdueDays * FINE_PER_DAY;
      const fineEl = document.getElementById('r-d-fine');
      fineEl.textContent = `₹${fine}`;
      fineEl.className = 'font-mono font-semibold ' + (fine > 0 ? 'text-clay' : 'text-sage');
    }
  });

  const issueDate = document.getElementById('i-issue-date');
  const periodSel = document.getElementById('i-period');
  issueDate.value = todayISO();

  function updateDuePreview() {
    const period = Number(periodSel.value);
    const base = issueDate.value || todayISO();
    const due = new Date(new Date(base).getTime() + period * 86400000);
    document.getElementById('i-due-preview').textContent = fmtDate(due.toISOString().slice(0,10));
  }
  issueDate.addEventListener('change', updateDuePreview);
  periodSel.addEventListener('change', updateDuePreview);
  updateDuePreview();

  function showError(id, show) {
    const input = document.getElementById(id);
    const msg = document.querySelector(`[data-err="${id}"]`);
    if (input) input.classList.toggle('field-err', show);
    if (msg) msg.classList.toggle('hidden', !show);
  }

  function showToast(title, body) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-title').textContent = title;
    document.getElementById('toast-body').textContent = body;
    toast.classList.remove('translate-y-24', 'opacity-0');
    setTimeout(() => toast.classList.add('translate-y-24', 'opacity-0'), 3200);
  }

  issueForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const memberCard = document.getElementById('i-member-id').value;
    const bookId = document.getElementById('i-book-id').value;
    let valid = true;
    if (!memberCard) { showError('i-member-search', true); valid = false; }
    if (!bookId) { showError('i-book-search', true); valid = false; }
    if (!valid) return;

    const book = books.find(b => b.id === bookId);
    if (availableCopies(book) <= 0) {
      showError('i-book-search', true);
      document.querySelector('[data-err="i-book-search"]').textContent = 'No copies available for this title.';
      document.querySelector('[data-err="i-book-search"]').classList.remove('hidden');
      return;
    }

    const member = members.find(m => m.cardNo === memberCard);
    const period = Number(periodSel.value);
    const base = issueDate.value || todayISO();
    const due = new Date(new Date(base).getTime() + period * 86400000).toISOString().slice(0,10);

    const loan = {
      id: 'LN-' + String(loans.length + 1).padStart(4, '0') + '-' + Date.now().toString().slice(-4),
      bookId: book.id,
      bookTitle: book.title,
      memberCard: member.cardNo,
      memberName: member.name,
      issueDate: base,
      dueDate: due,
      returnDate: null,
    };
    loans.push(loan);
    persistLoans();

    showToast('Book issued', `${book.title} → ${member.name}, due ${fmtDate(due)}`);
    issueForm.reset();
    document.getElementById('i-member-id').value = '';
    document.getElementById('i-book-id').value = '';
    issueDate.value = todayISO();
    periodSel.value = '14';
    updateDuePreview();
    renderLoans();
  });

  const returnDate = document.getElementById('r-return-date');
  returnDate.value = todayISO();

  returnForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const loanId = document.getElementById('r-loan-id').value;
    if (!loanId) { showError('r-loan-search', true); return; }

    const loan = loans.find(l => l.id === loanId);
    const retDate = returnDate.value || todayISO();
    const overdueDays = Math.max(0, daysBetween(loan.dueDate, retDate));
    const fine = overdueDays * FINE_PER_DAY;

    loan.returnDate = retDate;
    loan.fine = fine;
    loan.condition = document.getElementById('r-condition').value;
    persistLoans();

    showToast('Book returned', fine > 0 ? `${loan.bookTitle} — fine of ₹${fine} recorded` : `${loan.bookTitle} returned on time`);
    returnForm.reset();
    document.getElementById('r-loan-id').value = '';
    document.getElementById('r-loan-detail').classList.add('hidden');
    returnDate.value = todayISO();
    renderLoans();
  });

  let loanFilterState = { text:'', status:'all' };

  function renderLoans() {
    const activeLoans = loans.filter(l => !l.returnDate);
    let list = activeLoans;

    if (loanFilterState.text.trim()) {
      const q = loanFilterState.text.trim().toLowerCase();
      list = list.filter(l => l.bookTitle.toLowerCase().includes(q) || l.memberName.toLowerCase().includes(q));
    }
    if (loanFilterState.status === 'overdue') list = list.filter(l => daysBetween(l.dueDate, todayISO()) > 0);
    if (loanFilterState.status === 'active') list = list.filter(l => daysBetween(l.dueDate, todayISO()) <= 0);

    list.sort((a,b) => new Date(a.dueDate) - new Date(b.dueDate));

    const body = document.getElementById('loans-body');
    const empty = document.getElementById('loans-empty');

    if (list.length === 0) {
      body.innerHTML = '';
      empty.classList.remove('hidden');
    } else {
      empty.classList.add('hidden');
      body.innerHTML = list.map(l => {
        const overdueDays = daysBetween(l.dueDate, todayISO());
        const isOverdue = overdueDays > 0;
        const isDueToday = overdueDays === 0;
        const statusLabel = isOverdue ? `Overdue · ₹${overdueDays * FINE_PER_DAY}` : (isDueToday ? 'Due today' : 'On time');
        const statusClass = isOverdue ? 'bg-clay/10 text-clay' : (isDueToday ? 'bg-brass/15 text-brass-dark' : 'bg-forest/10 text-forest');
        return `
        <tr class="fade-row hover:bg-paper/60 transition">
          <td class="px-5 py-3 font-medium">${l.bookTitle}</td>
          <td class="px-5 py-3 text-ink-light">${l.memberName}</td>
          <td class="px-5 py-3 font-mono text-xs text-ink-light">${fmtDate(l.issueDate)}</td>
          <td class="px-5 py-3 font-mono text-xs">${fmtDate(l.dueDate)}</td>
          <td class="px-5 py-3">
            <span class="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold stamp ${statusClass}">${statusLabel}</span>
          </td>
        </tr>`;
      }).join('');
    }

    document.getElementById('stat-out').textContent = activeLoans.length;
    document.getElementById('stat-today').textContent = activeLoans.filter(l => daysBetween(l.dueDate, todayISO()) === 0).length;
    const overdueLoans = activeLoans.filter(l => daysBetween(l.dueDate, todayISO()) > 0);
    document.getElementById('stat-overdue').textContent = overdueLoans.length;
    const pendingFines = overdueLoans.reduce((sum, l) => sum + daysBetween(l.dueDate, todayISO()) * FINE_PER_DAY, 0);
    document.getElementById('stat-fines').textContent = `₹${pendingFines}`;
  }

  document.getElementById('loan-filter').addEventListener('input', (e) => { loanFilterState.text = e.target.value; renderLoans(); });
  document.getElementById('loan-status-filter').addEventListener('change', (e) => { loanFilterState.status = e.target.value; renderLoans(); });

  renderLoans();