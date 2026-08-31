const FINE_PER_DAY = 5;
let loans = [], books = [], selectedMember = null, returnMember = null;
let filters = { text: '', status: 'all' };
const el = (id) => document.getElementById(id);
const today = () => new Date().toISOString().slice(0, 10);
const days = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);
const dateText = (value) => value ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const safe = (value) => String(value ?? '').replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));

async function api(url, options) {
    const response = await fetch(url, options);
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.message || 'Request failed.');
    return body;
}

function errorFor(id, message = '') {
    el(id)?.classList.toggle('field-err', Boolean(message));
    const node = document.querySelector(`[data-err="${id}"]`);
    if (node) { node.textContent = message; node.classList.toggle('hidden', !message); }
}

function toast(title, message, isError = false) {
    el('toast-title').textContent = title; el('toast-body').textContent = message;
    el('toast').classList.toggle('bg-clay', isError); el('toast').classList.toggle('bg-forest', !isError);
    el('toast').classList.remove('translate-y-24', 'opacity-0');
    setTimeout(() => el('toast').classList.add('translate-y-24', 'opacity-0'), 3500);
}

function memberHtml(m) {
    const borrowing = m.active_borrowings ? `${m.active_borrowings} active borrowing${m.active_borrowings === 1 ? '' : 's'}` : 'No active borrowings';
    return `<p class="font-semibold">${safe(m.first_name)} ${safe(m.last_name)}</p><p>Username: ${safe(m.username)}</p><p>Unique ID: ${safe(m.unique_id || 'Not assigned')}</p><p>Status: ${safe(m.status)} · ${borrowing}</p>`;
}

function enableBorrow() { el('borrow-button').disabled = !(selectedMember && el('i-book-id').value); }

async function findMember(inputId, detailId, mode) {
    const q = el(inputId).value.trim();
    if (!q) return errorFor(inputId, 'Enter an exact member unique ID or username.');
    const button = el(mode === 'borrow' ? 'i-member-find' : 'r-member-find');
    button.disabled = true;
    try {
        const member = await api(`/api/loans/members/search?q=${encodeURIComponent(q)}`);
        errorFor(inputId); el(detailId).innerHTML = memberHtml(member); el(detailId).classList.remove('hidden');
        if (mode === 'borrow') { selectedMember = member; el('i-member-id').value = member.member_id; enableBorrow(); }
        else { returnMember = member; await loadMemberLoans(member.member_id); }
    } catch (err) {
        errorFor(inputId, err.message); el(detailId).classList.add('hidden');
        if (mode === 'borrow') { selectedMember = null; el('i-member-id').value = ''; enableBorrow(); }
        else { returnMember = null; el('member-active-loans').innerHTML = ''; }
    } finally { button.disabled = false; }
}

async function loadBooks(q = '') {
    try { books = await api(`/api/loans/books/search?q=${encodeURIComponent(q)}`); renderBooks(); }
    catch (err) { errorFor('i-book-search', err.message); }
}

function renderBooks() {
    el('i-book-suggest').innerHTML = books.length ? books.map((b, i) => `<button type="button" data-book="${i}" class="suggest-item block w-full text-left px-3.5 py-2.5 text-sm"><span class="font-medium">${safe(b.title)}</span><span class="text-xs text-sage"> · ID ${b.book_id} · ${b.available_quantity} available</span><span class="block text-xs text-ink-light">ISBN: ${safe(b.isbn || 'Not recorded')}</span></button>`).join('') : '<div class="px-3.5 py-2.5 text-xs text-ink-light">No available physical books match.</div>';
    el('i-book-suggest').classList.remove('hidden');
}

function selectBook(b) {
    el('i-book-search').value = b.title; el('i-book-id').value = b.book_id; el('i-book-suggest').classList.add('hidden');
    el('i-book-detail').innerHTML = `<p class="font-semibold">${safe(b.title)}</p><p>Author: ${safe(b.author || 'Not recorded')}</p><p>Unique ID: ${b.book_id}</p><p>Available quantity: ${b.available_quantity}</p>`;
    el('i-book-detail').classList.remove('hidden'); errorFor('i-book-search'); enableBorrow();
}

async function loadLoans() {
    try { loans = await api('/api/loans/active'); renderLoans(); }
    catch (err) { toast('Could not load borrowings', err.message, true); }
}

async function loadMemberLoans(memberId) {
    const list = await api(`/api/loans/members/${memberId}/active`);
    el('member-active-loans').innerHTML = list.length ? list.map((loan) => `<article class="bg-paper rounded-lg p-3 border border-ink/10"><p class="font-medium text-sm">${safe(loan.title)}</p><p class="text-xs text-ink-light mt-1">Book ID ${loan.book_id} · Due ${dateText(loan.due_date)}</p><button type="button" data-return="${loan.issue_id}" class="mt-3 w-full bg-forest hover:bg-forest-light disabled:opacity-50 text-paper font-semibold text-xs rounded-full py-2">Return</button></article>`).join('') : '<p class="text-sm text-ink-light bg-paper rounded-lg p-4 border border-ink/10">This member has no active borrowed books.</p>';
}

function updateDue() {
    const value = el('i-issue-date').value || today(), due = new Date(`${value}T00:00:00`);
    due.setDate(due.getDate() + Number(el('i-period').value)); el('i-due-preview').textContent = dateText(due.toISOString().slice(0, 10));
}

el('tab-issue').onclick = () => { el('tab-issue').classList.add('active'); el('tab-return').classList.remove('active'); el('issue-form').classList.remove('hidden'); el('return-form').classList.add('hidden'); };
el('tab-return').onclick = () => { el('tab-return').classList.add('active'); el('tab-issue').classList.remove('active'); el('return-form').classList.remove('hidden'); el('issue-form').classList.add('hidden'); };
el('i-member-find').onclick = () => findMember('i-member-search', 'i-member-detail', 'borrow');
el('r-member-find').onclick = () => findMember('r-member-search', 'r-member-detail', 'return');
['i-member-search', 'r-member-search'].forEach((id) => el(id).addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); el(id === 'i-member-search' ? 'i-member-find' : 'r-member-find').click(); } }));
el('i-member-search').oninput = () => { selectedMember = null; el('i-member-id').value = ''; el('i-member-detail').classList.add('hidden'); enableBorrow(); };

let bookTimer;
el('i-book-search').oninput = () => { el('i-book-id').value = ''; el('i-book-detail').classList.add('hidden'); enableBorrow(); clearTimeout(bookTimer); bookTimer = setTimeout(() => loadBooks(el('i-book-search').value.trim()), 200); };
el('i-book-search').onfocus = () => loadBooks(el('i-book-search').value.trim());
el('i-book-suggest').onclick = (e) => { const button = e.target.closest('[data-book]'); if (button) selectBook(books[Number(button.dataset.book)]); };
document.addEventListener('click', (e) => { if (!el('i-book-suggest').contains(e.target) && e.target !== el('i-book-search')) el('i-book-suggest').classList.add('hidden'); });

el('i-issue-date').value = today(); el('i-issue-date').onchange = updateDue; el('i-period').onchange = updateDue; updateDue();
el('issue-form').onsubmit = async (e) => {
    e.preventDefault(); if (!selectedMember || !el('i-book-id').value) return;
    const button = el('borrow-button'), issueDate = el('i-issue-date').value || today(), due = new Date(`${issueDate}T00:00:00`);
    due.setDate(due.getDate() + Number(el('i-period').value)); button.disabled = true;
    try {
        await api('/api/loans/issue', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ member_id: selectedMember.member_id, book_id: Number(el('i-book-id').value), issue_date: issueDate, due_date: due.toISOString().slice(0, 10) }) });
        toast('Book borrowed', `Due ${dateText(due.toISOString().slice(0, 10))}`); el('i-book-id').value = ''; el('i-book-search').value = ''; el('i-book-detail').classList.add('hidden');
        await Promise.all([loadBooks(), loadLoans(), findMember('i-member-search', 'i-member-detail', 'borrow')]);
    } catch (err) { toast('Borrow failed', err.message, true); } finally { enableBorrow(); }
};

el('member-active-loans').onclick = async (e) => {
    const button = e.target.closest('[data-return]'); if (!button || !returnMember) return; button.disabled = true;
    try { await api(`/api/loans/return/${button.dataset.return}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ return_date: today() }) }); toast('Book returned', 'The physical copy is available again.'); await Promise.all([loadMemberLoans(returnMember.member_id), loadBooks(), loadLoans()]); await findMember('r-member-search', 'r-member-detail', 'return'); }
    catch (err) { button.disabled = false; toast('Return failed', err.message, true); }
};

function renderLoans() {
    let list = loans.slice(), q = filters.text.trim().toLowerCase();
    if (q) list = list.filter((l) => l.title.toLowerCase().includes(q) || `${l.first_name} ${l.last_name}`.toLowerCase().includes(q));
    if (filters.status === 'overdue') list = list.filter((l) => days(l.due_date, today()) > 0);
    if (filters.status === 'active') list = list.filter((l) => days(l.due_date, today()) <= 0);
    el('loans-empty').classList.toggle('hidden', list.length > 0);
    el('loans-body').innerHTML = list.map((l) => { const overdue = days(l.due_date, today()), status = overdue > 0 ? `Overdue · ₹${overdue * FINE_PER_DAY}` : overdue === 0 ? 'Due today' : 'On time'; return `<tr><td class="px-5 py-3 font-medium">${safe(l.title)}</td><td class="px-5 py-3 text-ink-light">${safe(l.first_name)} ${safe(l.last_name)}</td><td class="px-5 py-3 font-mono text-xs">${dateText(l.issue_date)}</td><td class="px-5 py-3 font-mono text-xs">${dateText(l.due_date)}</td><td class="px-5 py-3 text-xs">${status}</td></tr>`; }).join('');
    el('stat-out').textContent = loans.length; el('stat-today').textContent = loans.filter((l) => days(l.due_date, today()) === 0).length;
    const overdue = loans.filter((l) => days(l.due_date, today()) > 0); el('stat-overdue').textContent = overdue.length; el('stat-fines').textContent = `₹${overdue.reduce((sum, l) => sum + days(l.due_date, today()) * FINE_PER_DAY, 0)}`;
}
el('loan-filter').oninput = (e) => { filters.text = e.target.value; renderLoans(); };
el('loan-status-filter').onchange = (e) => { filters.status = e.target.value; renderLoans(); };
Promise.all([loadBooks(), loadLoans()]);
