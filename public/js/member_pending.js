let pending = [];

async function loadPending() {
    try {
        const response = await fetch('/api/members/pending');
        pending = await response.json();
        render();
    } catch (err) {
        console.error(err);
    }
}

function fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}

function render() {
    const body = document.getElementById('pending-body');
    const empty = document.getElementById('empty-state');

    if (pending.length === 0) {
        body.innerHTML = '';
        empty.classList.remove('hidden');
    } else {
        empty.classList.add('hidden');
        body.innerHTML = pending.map(m => `
            <tr class="fade-row hover:bg-paper/60 transition" data-id="${m.member_id}">
                <td class="px-5 py-3 font-medium">${m.first_name} ${m.last_name}</td>
                <td class="px-5 py-3 text-ink-light text-xs">${m.email}</td>
                <td class="px-5 py-3">
                    <span class="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold bg-forest/10 text-forest">${m.member_type || '—'}</span>
                </td>
                <td class="px-5 py-3 text-ink-light">${m.department || '—'}</td>
                <td class="px-5 py-3 text-ink-light text-xs">${m.phone || '—'}</td>
                <td class="px-5 py-3 font-mono text-xs text-ink-light">${fmtDate(m.registered_on)}</td>
                <td class="px-5 py-3 text-right">
                    <button class="text-xs font-medium text-forest hover:text-forest-light mr-3" data-action="approve" data-id="${m.member_id}">Approve</button>
                    <button class="text-xs font-medium text-clay hover:text-clay/70" data-action="reject" data-id="${m.member_id}">Reject</button>
                </td>
            </tr>
        `).join('');
    }
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-msg').textContent = msg;
    toast.classList.remove('translate-y-24', 'opacity-0');
    setTimeout(() => toast.classList.add('translate-y-24', 'opacity-0'), 3000);
}

document.getElementById('pending-body').addEventListener('click', async (e) => {
    const button = e.target.closest('button[data-action]');
    if (!button) return;

    const id = button.dataset.id;
    const action = button.dataset.action;

    try {
        const response = await fetch(`/api/members/${id}/${action}`, { method: 'PUT' });
        const result = await response.json();

        if (response.ok) {
            showToast(action === 'approve' ? `Approved — card ${result.member.card_no}` : 'Registration rejected');
            await loadPending();
        }
    } catch (err) {
        console.error(err);
    }
});

loadPending();