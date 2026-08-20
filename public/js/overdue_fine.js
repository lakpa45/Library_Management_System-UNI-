const FINE_PER_DAY = 5; 
  const today = new Date();
  const d = (n) => new Date(today.getTime() + n * 86400000).toISOString().slice(0,10);

  let loans = JSON.parse(localStorage.getItem('library_loans') || 'null');
  if (!loans) {
    loans = [
    ];
    localStorage.setItem('library_loans', JSON.stringify(loans));
  }

  function persistLoans() { localStorage.setItem('library_loans', JSON.stringify(loans)); }

  function todayISO() { return new Date().toISOString().slice(0,10); }
  function daysBetween(a, b) { return Math.round((new Date(b) - new Date(a)) / 86400000); }
  function fmtDate(iso) { return iso ? new Date(iso).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'; }

  function outstandingFine(loan) {
    const overdueDays = Math.max(0, daysBetween(loan.dueDate, todayISO()));
    const accrued = overdueDays * FINE_PER_DAY;
    const paid = loan.paidAmount || 0;
    return Math.max(0, accrued - paid);
  }
  function overdueDaysOf(loan) { return Math.max(0, daysBetween(loan.dueDate, todayISO())); }

  let state = { search:'', sev:'all', sort:'days' };

  function getOverdueLoans() {
    let list = loans.filter(l => !l.returnDate && !l.waived && overdueDaysOf(l) > 0);
    if (state.search.trim()) {
      const q = state.search.trim().toLowerCase();
      list = list.filter(l => l.memberName.toLowerCase().includes(q) || l.bookTitle.toLowerCase().includes(q));
    }
    if (state.sev !== 'all') {
      list = list.filter(l => {
        const dd = overdueDaysOf(l);
        if (state.sev === 'mild') return dd >= 1 && dd <= 7;
        if (state.sev === 'moderate') return dd >= 8 && dd <= 20;
        if (state.sev === 'severe') return dd >= 21;
      });
    }
    if (state.sort === 'fine') list.sort((a,b) => outstandingFine(b) - outstandingFine(a));
    else if (state.sort === 'name') list.sort((a,b) => a.memberName.localeCompare(b.memberName));
    else list.sort((a,b) => overdueDaysOf(b) - overdueDaysOf(a));
    return list;
  }

  function severityColor(days) {
    if (days >= 21) return 'text-clay';
    if (days >= 8) return 'text-brass-dark';
    return 'text-ink';
  }

  function renderStats() {
    const overdue = loans.filter(l => !l.returnDate && !l.waived && overdueDaysOf(l) > 0);
    document.getElementById('stat-count').textContent = overdue.length;
    const outstanding = overdue.reduce((sum, l) => sum + outstandingFine(l), 0);
    document.getElementById('stat-outstanding').textContent = `₹${outstanding}`;
    const avg = overdue.length ? Math.round(overdue.reduce((s,l) => s + overdueDaysOf(l), 0) / overdue.length) : 0;
    document.getElementById('stat-avg').textContent = avg;
  }

  function renderOverdue() {
    const list = getOverdueLoans();
    const body = document.getElementById('overdue-body');
    const empty = document.getElementById('overdue-empty');

    if (list.length === 0) {
      body.innerHTML = '';
      empty.classList.remove('hidden');
    } else {
      empty.classList.add('hidden');
      body.innerHTML = list.map(l => {
        const dd = overdueDaysOf(l);
        const fine = outstandingFine(l);
        return `
        <tr class="fade-row hover:bg-paper/60 transition">
          <td class="px-5 py-3 font-medium">${l.bookTitle}</td>
          <td class="px-5 py-3 text-ink-light">${l.memberName}</td>
          <td class="px-5 py-3 font-mono text-xs">${fmtDate(l.dueDate)}</td>
          <td class="px-5 py-3">
            <span class="text-sm font-semibold ${severityColor(dd)}">${dd} day${dd === 1 ? '' : 's'}</span>
          </td>
          <td class="px-5 py-3">
            <span class="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold stamp bg-clay/10 text-clay">₹${fine}</span>
          </td>
          <td class="px-5 py-3 text-right whitespace-nowrap">
            <button class="text-xs font-medium text-brass-dark hover:text-brass mr-3" data-remind="${l.id}">Remind</button>
            <button class="text-xs font-medium text-forest hover:text-forest-light mr-3" data-pay="${l.id}">Collect</button>
            <button class="text-xs font-medium text-ink-light hover:text-clay" data-waive="${l.id}">Waive</button>
          </td>
        </tr>`;
      }).join('');
    }
    renderStats();
  }

  function renderCollected() {
    const body = document.getElementById('collected-body');
    const empty = document.getElementById('collected-empty');
    const list = [...payments].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 25);
    if (list.length === 0) {
      body.innerHTML = '';
      empty.classList.remove('hidden');
    } else {
      empty.classList.add('hidden');
      body.innerHTML = list.map(p => `
        <tr class="hover:bg-paper/60 transition">
          <td class="px-5 py-3 font-medium">${p.bookTitle}</td>
          <td class="px-5 py-3 text-ink-light">${p.memberName}</td>
          <td class="px-5 py-3 font-mono text-sage">₹${p.amount}</td>
          <td class="px-5 py-3 font-mono text-xs text-ink-light">${fmtDate(p.date)}</td>
        </tr>
      `).join('');
    }
  }

  document.getElementById('search').addEventListener('input', (e) => { state.search = e.target.value; renderOverdue(); });
  document.getElementById('sort').addEventListener('change', (e) => { state.sort = e.target.value; renderOverdue(); });
  document.getElementById('severity-chips').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-sev]');
    if (!btn) return;
    state.sev = btn.dataset.sev;
    document.querySelectorAll('#severity-chips .chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    renderOverdue();
  });

  function showToast(title, body) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-title').textContent = title;
    document.getElementById('toast-body').textContent = body;
    toast.classList.remove('translate-y-24', 'opacity-0');
    setTimeout(() => toast.classList.add('translate-y-24', 'opacity-0'), 3200);
  }

  const backdrop = document.getElementById('confirm-backdrop');
  const modal = document.getElementById('confirm-modal');
  let confirmAction = null;

  function openConfirm(title, body, onConfirm) {
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-body').textContent = body;
    confirmAction = onConfirm;
    backdrop.classList.remove('opacity-0', 'pointer-events-none');
    modal.classList.remove('scale-95');
  }
  function closeConfirm() {
    backdrop.classList.add('opacity-0', 'pointer-events-none');
    modal.classList.add('scale-95');
    confirmAction = null;
  }
  document.getElementById('confirm-cancel').addEventListener('click', closeConfirm);
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeConfirm(); });
  document.getElementById('confirm-ok').addEventListener('click', () => {
    if (confirmAction) confirmAction();
    closeConfirm();
  });
  document.getElementById('overdue-body').addEventListener('click', (e) => {
    const remindBtn = e.target.closest('[data-remind]');
    const payBtn = e.target.closest('[data-pay]');
    const waiveBtn = e.target.closest('[data-waive]');
    if (remindBtn) {
      const loan = loans.find(l => l.id === remindBtn.dataset.remind);
      showToast('Reminder sent', `Notified ${loan.memberName} about "${loan.bookTitle}"`);
      return;
    }
    if (payBtn) {
      const loan = loans.find(l => l.id === payBtn.dataset.pay);
      const amount = outstandingFine(loan);
      openConfirm('Collect fine', `Record ₹${amount} collected from ${loan.memberName} for "${loan.bookTitle}"?`, () => {
        loan.paidAmount = (loan.paidAmount || 0) + amount;
        persistLoans();
        showToast('Fine collected', `₹${amount} recorded for ${loan.memberName}`);
        renderOverdue(); renderCollected();
      });
      return;
    }
    if (waiveBtn) {
      const loan = loans.find(l => l.id === waiveBtn.dataset.waive);
      const amount = outstandingFine(loan);
      openConfirm('Waive fine', `Waive the ₹${amount} fine for ${loan.memberName} on "${loan.bookTitle}"? The book remains on loan.`, () => {
        loan.waived = true;
        persistLoans();
        showToast('Fine waived', `${loan.memberName}'s fine on "${loan.bookTitle}" was waived`);
        renderOverdue();
      });
      return;
    }
  });
  renderOverdue();