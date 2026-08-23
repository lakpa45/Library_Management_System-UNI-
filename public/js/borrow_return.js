const FINE_PER_DAY = 5;

let members = [];
let books = [];
let loans = [];

async function loadActiveLoans() {
    try {
        const response = await fetch('/api/loans/active');
        loans = await response.json();
        renderLoans();
    } catch (err) {
        console.error(err);
    }
}

function todayISO() { return new Date().toISOString().slice(0,10); }
function daysBetween(a, b) { return Math.round((new Date(b) - new Date(a)) / 86400000); }
function fmtDate(iso) { return iso ? new Date(iso).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'; }

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

function wireAutocomplete({ inputId, suggestId, hiddenId, fetchItems, renderItem, onSelect }) {
    const input = document.getElementById(inputId);
    const box = document.getElementById(suggestId);
    const hidden = document.getElementById(hiddenId);

    input.addEventListener('input', async () => {
        hidden.value = '';
        const q = input.value.trim();
        if (!q) { box.classList.add('hidden'); box.innerHTML=''; return; }

        const items = await fetchItems(q);
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
    fetchItems: async (q) => {
        const res = await fetch(`/api/loans/members/search?q=${encodeURIComponent(q)}`);
        return res.json();
    },
    renderItem: (m) => `<span class="font-medium">${m.first_name} ${m.last_name}</span> <span class="text-ink-light text-xs">· ${m.email}</span>`,
    onSelect: (m) => {
        document.getElementById('i-member-search').value = `${m.first_name} ${m.last_name}`;
        document.getElementById('i-member-id').value = m.member_id;
        showError('i-member-search', false);
    }
});

wireAutocomplete({
    inputId: 'i-book-search', suggestId: 'i-book-suggest', hiddenId: 'i-book-id',
    fetchItems: async (q) => {
        const res = await fetch(`/api/loans/books/search?q=${encodeURIComponent(q)}`);
        return res.json();
    },
    renderItem: (b) => `<span class="font-medium">${b.title}</span> <span class="text-xs text-sage">· ${b.available_copies} available</span>`,
    onSelect: (b) => {
        document.getElementById('i-book-search').value = b.title;
        document.getElementById('i-book-id').value = b.book_id;
        showError('i-book-search', false);
    }
});

wireAutocomplete({
    inputId: 'r-loan-search', suggestId: 'r-loan-suggest', hiddenId: 'r-loan-id',
    fetchItems: async (q) => {
        const lower = q.toLowerCase();
        return loans.filter(l =>
            `${l.first_name} ${l.last_name}`.toLowerCase().includes(lower) ||
            l.title.toLowerCase().includes(lower)
        );
    },
    renderItem: (l) => `<span class="font-medium">${l.title}</span> <span class="text-ink-light text-xs">· ${l.first_name} ${l.last_name}</span>`,
    onSelect: (l) => {
        document.getElementById('r-loan-search').value = `${l.title} — ${l.first_name} ${l.last_name}`;
        document.getElementById('r-loan-id').value = l.issue_id;
        showError('r-loan-search', false);
        const detail = document.getElementById('r-loan-detail');
        detail.classList.remove('hidden');
        document.getElementById('r-d-title').textContent = l.title;
        document.getElementById('r-d-member').textContent = `${l.first_name} ${l.last_name}`;
        document.getElementById('r-d-due').textContent = fmtDate(l.due_date);
        const overdueDays = Math.max(0, daysBetween(l.due_date, todayISO()));
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

issueForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const memberId = document.getElementById('i-member-id').value;
    const bookId = document.getElementById('i-book-id').value;
    let valid = true;
    if (!memberId) { showError('i-member-search', true); valid = false; }
    if (!bookId) { showError('i-book-search', true); valid = false; }
    if (!valid) return;

    const period = Number(periodSel.value);
    const base = issueDate.value || todayISO();
    const due = new Date(new Date(base).getTime() + period * 86400000).toISOString().slice(0,10);

    try {
        const response = await fetch('/api/loans/issue', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                member_id: memberId,
                book_id: bookId,
                issue_date: base,
                due_date: due
            })
        });

        const result = await response.json();

        if (response.ok) {
            showToast('Book issued', `Due ${fmtDate(due)}`);
            issueForm.reset();
            document.getElementById('i-member-id').value = '';
            document.getElementById('i-book-id').value = '';
            issueDate.value = todayISO();
            periodSel.value = '14';
            updateDuePreview();
            await loadActiveLoans();
        } else {
            showError('i-book-search', true);
            const msg = document.querySelector('[data-err="i-book-search"]');
            msg.textContent = result.message;
            msg.classList.remove('hidden');
        }
    } catch (err) {
        console.error(err);
    }
});

const returnDateInput = document.getElementById('r-return-date');
returnDateInput.value = todayISO();

returnForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const loanId = document.getElementById('r-loan-id').value;
    if (!loanId) { showError('r-loan-search', true); return; }

    const retDate = returnDateInput.value || todayISO();

    try {
        const response = await fetch(`/api/loans/return/${loanId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ return_date: retDate })
        });

        const result = await response.json();

        if (response.ok) {
            showToast('Book returned', result.fine > 0 ? `Fine of ₹${result.fine} recorded` : 'Returned on time');
            returnForm.reset();
            document.getElementById('r-loan-id').value = '';
            document.getElementById('r-loan-detail').classList.add('hidden');
            returnDateInput.value = todayISO();
            await loadActiveLoans();
        }
    } catch (err) {
        console.error(err);
    }
});

let loanFilterState = { text:'', status:'all' };

function renderLoans() {
    let list = loans;

    if (loanFilterState.text.trim()) {
        const q = loanFilterState.text.trim().toLowerCase();
        list = list.filter(l => l.title.toLowerCase().includes(q) || `${l.first_name} ${l.last_name}`.toLowerCase().includes(q));
    }
    if (loanFilterState.status === 'overdue') list = list.filter(l => daysBetween(l.due_date, todayISO()) > 0);
    if (loanFilterState.status === 'active') list = list.filter(l => daysBetween(l.due_date, todayISO()) <= 0);

    list.sort((a,b) => new Date(a.due_date) - new Date(b.due_date));

    const body = document.getElementById('loans-body');
    const empty = document.getElementById('loans-empty');

    if (list.length === 0) {
        body.innerHTML = '';
        empty.classList.remove('hidden');
    } else {
        empty.classList.add('hidden');
        body.innerHTML = list.map(l => {
            const overdueDays = daysBetween(l.due_date, todayISO());
            const isOverdue = overdueDays > 0;
            const isDueToday = overdueDays === 0;
            const statusLabel = isOverdue ? `Overdue · ₹${overdueDays * FINE_PER_DAY}` : (isDueToday ? 'Due today' : 'On time');
            const statusClass = isOverdue ? 'bg-clay/10 text-clay' : (isDueToday ? 'bg-brass/15 text-brass-dark' : 'bg-forest/10 text-forest');
            return `
            <tr class="fade-row hover:bg-paper/60 transition">
                <td class="px-5 py-3 font-medium">${l.title}</td>
                <td class="px-5 py-3 text-ink-light">${l.first_name} ${l.last_name}</td>
                <td class="px-5 py-3 font-mono text-xs text-ink-light">${fmtDate(l.issue_date)}</td>
                <td class="px-5 py-3 font-mono text-xs">${fmtDate(l.due_date)}</td>
                <td class="px-5 py-3">
                    <span class="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold stamp ${statusClass}">${statusLabel}</span>
                </td>
            </tr>`;
        }).join('');
    }

    document.getElementById('stat-out').textContent = loans.length;
    document.getElementById('stat-today').textContent = loans.filter(l => daysBetween(l.due_date, todayISO()) === 0).length;
    const overdueLoans = loans.filter(l => daysBetween(l.due_date, todayISO()) > 0);
    document.getElementById('stat-overdue').textContent = overdueLoans.length;
    const pendingFines = overdueLoans.reduce((sum, l) => sum + daysBetween(l.due_date, todayISO()) * FINE_PER_DAY, 0);
    document.getElementById('stat-fines').textContent = `₹${pendingFines}`;
}

document.getElementById('loan-filter').addEventListener('input', (e) => { loanFilterState.text = e.target.value; renderLoans(); });
document.getElementById('loan-status-filter').addEventListener('change', (e) => { loanFilterState.status = e.target.value; renderLoans(); });

loadActiveLoans();