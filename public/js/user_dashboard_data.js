function libEscapeHtmlUser(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function userAuthHeaders() {
    return { 'Authorization': 'Bearer ' + localStorage.getItem('token') };
}

function userAuthHeadersJson() {
    return { ...userAuthHeaders(), 'Content-Type': 'application/json' };
}

function formatDueDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysUntil(dateStr) {
    const due = new Date(dateStr);
    due.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((due - today) / 86400000);
}

async function handleRenewClick(issueId, btn) {
    btn.disabled = true;
    btn.textContent = 'Renewing…';
    try {
        const response = await fetch(`/api/loans/renew/${issueId}`, {
            method: 'PUT',
            headers: userAuthHeaders()
        });
        if (!response.ok) throw new Error('Renew failed');
        await loadMyLoans(); // re-fetch so the due date and badges update
    } catch (err) {
        console.error('Renew failed:', err);
        btn.disabled = false;
        btn.textContent = 'Renew';
        alert("Couldn't renew this book. Please try again or contact the librarian.");
    }
}

async function loadMyLoans() {
    const grid = document.querySelector('.books__grid');
    if (!grid) return;

    try {
        const response = await fetch('/api/loans/my-loans', { headers: userAuthHeaders() });
        if (!response.ok) throw new Error('Failed to load loans');
        const loans = await response.json();

        document.querySelectorAll('.stat-card strong')[0].textContent = loans.length;
        const dueSoonCount = loans.filter((l) => daysUntil(l.due_date) <= 2).length;
        document.querySelectorAll('.stat-card strong')[1].textContent = dueSoonCount;

        if (!loans.length) {
            grid.innerHTML = '<p style="padding:20px;color:#888;">You have no books currently borrowed.</p>';
            return;
        }

        grid.innerHTML = loans.map((loan) => {
            const days = daysUntil(loan.due_date);
            const isOverdue = days < 0;
            const isWarn = days <= 2;
            const statusLabel = isOverdue
                ? 'Overdue'
                : days === 0 ? 'Due today'
                : days <= 2 ? `Due in ${days} day${days === 1 ? '' : 's'}`
                : 'On time';

            return `
                <article class="book-card">
                    <div class="book-card__media">
                        <span class="book-card__status ${isWarn ? 'book-card__status--warn' : ''}">${statusLabel}</span>
                        <i class="fa-solid fa-book"></i>
                    </div>
                    <div class="book-card__body">
                        <h3>${libEscapeHtmlUser(loan.title)}</h3>
                        <div class="book-card__due"><span>Due date</span><strong>${formatDueDate(loan.due_date)}</strong></div>
                        <div class="book-card__actions">
                            <button class="primary" data-issue-id="${loan.issue_id}">Renew</button>
                            <button data-book-id="${loan.book_id}">Details</button>
                        </div>
                    </div>
                </article>
            `;
        }).join('');

        grid.querySelectorAll('.book-card__actions .primary').forEach((btn) => {
            btn.addEventListener('click', () => handleRenewClick(btn.dataset.issueId, btn));
        });
        grid.querySelectorAll('.book-card__actions button:not(.primary)').forEach((btn) => {
            btn.addEventListener('click', () => {
                window.location.href = `/book.html?id=${btn.dataset.bookId}`;
            });
        });
    } catch (err) {
        console.error('Failed to load loans:', err);
        grid.innerHTML = '<p style="padding:20px;color:#c62828;">Couldn\'t load your borrowed books.</p>';
    }
}

async function loadMyActivity() {
    const panel = document.querySelector('.split .panel:first-child');
    if (!panel) return;

    try {
        const response = await fetch('/api/loans/my-activity', { headers: userAuthHeaders() });
        if (!response.ok) throw new Error('Failed to load activity');
        const activity = await response.json();

        const rowsHtml = activity.length
            ? activity.map((a) => {
                const icon = a.action === 'Returned' ? 'fa-rotate-left' : 'fa-arrow-right-to-bracket';
                return `
                    <div class="activity-row">
                        <span class="activity-row__ic"><i class="fa-solid ${icon}"></i></span>
                        <div class="activity-row__body">
                            <strong>${a.action} "${libEscapeHtmlUser(a.title)}"</strong>
                        </div>
                        <span class="activity-row__time">${formatDueDate(a.date)}</span>
                    </div>
                `;
            }).join('')
            : '<p style="padding:20px;color:#888;">No activity yet.</p>';

        const heading = panel.querySelector('h2');
        panel.innerHTML = '';
        if (heading) panel.appendChild(heading);
        panel.insertAdjacentHTML('beforeend', rowsHtml);
    } catch (err) {
        console.error('Failed to load activity:', err);
    }
}

async function loadMyProfile() {
    const nameEl = document.getElementById('userDashboardName');
    const form = document.querySelector('.account__fields');

    try {
        const response = await fetch('/api/members/me', { headers: userAuthHeaders() });
        if (!response.ok) throw new Error('Failed to load profile');
        const member = await response.json();

        if (nameEl) nameEl.textContent = member.first_name || 'there';

        if (form) {
            form.querySelector('input[type="text"]').value = `${member.first_name || ''} ${member.last_name || ''}`.trim();
            form.querySelector('input[type="email"]').value = member.email || '';
            form.querySelector('input[type="tel"]').value = member.phone || '';
            const cardInput = form.querySelectorAll('input[type="text"]')[1];
            if (cardInput) cardInput.value = member.card_no || 'Pending approval';
        }
    } catch (err) {
        console.error('Failed to load profile:', err);
        if (nameEl) nameEl.textContent = 'there';
    }
}

function initAccountForm() {
    const form = document.querySelector('.account__fields');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const fullName = form.querySelector('input[type="text"]').value.trim();
        const email = form.querySelector('input[type="email"]').value.trim();
        const phone = form.querySelector('input[type="tel"]').value.trim();

        const nameParts = fullName.split(' ');
        const first_name = nameParts[0];
        const last_name = nameParts.slice(1).join(' ') || first_name;

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving…';

        try {
            const response = await fetch('/api/members/me', {
                method: 'PUT',
                headers: userAuthHeadersJson(),
                body: JSON.stringify({ first_name, last_name, email, phone })
            });

            if (!response.ok) throw new Error('Save failed');

            if (window.libToast) window.libToast('Account details saved');
            document.getElementById('userDashboardName').textContent = first_name;
        } catch (err) {
            console.error('Failed to save profile:', err);
            if (window.libToast) window.libToast("Couldn't save changes. Please try again.");
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadMyLoans();
    loadMyActivity();
    loadMyProfile();
    initAccountForm();
});