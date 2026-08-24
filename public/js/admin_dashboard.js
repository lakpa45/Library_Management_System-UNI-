const dateElement = document.getElementById("today-date");
const today = new Date();
dateElement.textContent = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
});

// Recent Circulation Activity (still placeholder until borrow/return is built)
const seedActivity = [];
const seedDue = [];

const activity =
    JSON.parse(
        localStorage.getItem('library_activity') || 'null'
    ) || seedActivity;
const dueItems =
    JSON.parse(
        localStorage.getItem('library_due') || 'null'
    ) || seedDue;
localStorage.setItem(
    'library_activity',
    JSON.stringify(activity)
);
localStorage.setItem(
    'library_due',
    JSON.stringify(dueItems)
);

// Real stats from the database
async function loadStats() {
    try {
        const response = await fetch('/api/dashboard/stats');
        const stats = await response.json();

        animateCount('stat-books', stats.books);
        animateCount('stat-borrowers', stats.borrowers);
        animateCount('stat-overdue', stats.overdue);
    } catch (err) {
        console.error(err);
    }
}

loadStats();

function toggleAdminMenu() {
    document.getElementById("adminMenu").classList.toggle("hidden");
}

function logout() {
    if (confirm("Are you sure you want to logout?")) {
        window.location.href = "login.html";
    }
}
function openPasswordModal() {
    document.getElementById("passwordModal").classList.remove("hidden");
}

function closePasswordModal() {
    document.getElementById("passwordModal").classList.add("hidden");

    document.getElementById("currentPassword").value = "";
    document.getElementById("newPassword").value = "";
    document.getElementById("confirmPassword").value = "";
    document.getElementById("passwordMessage").textContent = "";
}

function changePassword(event) {
    event.preventDefault();

    const currentPassword =
        document.getElementById("currentPassword").value;

    const newPassword =
        document.getElementById("newPassword").value;

    const confirmPassword =
        document.getElementById("confirmPassword").value;

    const message =
        document.getElementById("passwordMessage");

    // Get the stored password
    const storedPassword =
        localStorage.getItem("adminPassword") || "admin123";

    // Check current password
    if (currentPassword !== storedPassword) {
        message.textContent = "Current password is incorrect.";
        message.className = "text-sm mb-4 text-red-600";
        return;
    }

    // Check new password
    if (newPassword.length < 6) {
        message.textContent =
            "New password must be at least 6 characters.";
        message.className = "text-sm mb-4 text-red-600";
        return;
    }

    // Check confirmation
    if (newPassword !== confirmPassword) {
        message.textContent =
            "New passwords do not match.";
        message.className = "text-sm mb-4 text-red-600";
        return;
    }

    // Save new password
    localStorage.setItem("adminPassword", newPassword);

    message.textContent =
        "Password changed successfully!";
    message.className = "text-sm mb-4 text-green-600";

    setTimeout(() => {
        closePasswordModal();
    }, 1500);
}

function animateCount(
    id,
    target,
    prefix = ''
) {
    const el =
        document.getElementById(id);
    let cur = 0;
    const step =
        Math.max(
            1,
            Math.ceil(target / 40)
        );
    const t =
        setInterval(() => {
            cur += step;
            if (cur >= target) {
                cur = target;
                clearInterval(t);
            }
            el.textContent =
                prefix +
                cur.toLocaleString('en-IN');
        }, 20);
}
const statusStyles = {
    active:
        'bg-[#1B4332]/10 text-[#1B4332]',
    returned:
        'bg-[#3E6B56]/15 text-[#3E6B56]',
    overdue:
        'bg-[#9E4A4A]/10 text-[#9E4A4A]'
};
const activityBody =
    document.getElementById(
        'activity-body'
    );
activityBody.innerHTML =
    activity.map(a => `
      <tr class="hover:bg-[#F5EFE6]/70 transition">
        <td class="px-5 py-3 font-medium">
          ${a.member}
        </td>
        <td class="px-5 py-3 text-[#4A5A50]">
          ${a.title}
        </td>
        <td class="px-5 py-3">
          ${a.action}
        </td>
        <td class="px-5 py-3 font-mono text-xs text-[#8A7B5C]">
          ${a.date}
        </td>
        <td class="px-5 py-3">
          <span
            class="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize stamp ${statusStyles[a.status]}"
          >
            ${a.status}
          </span>
        </td>
      </tr>
    `).join('');
const dueDot = {
    overdue:
        'bg-[#9E4A4A]',
    urgent:
        'bg-[#B6862A]',
    soon:
        'bg-[#C9972F]',
    ok:
        'bg-[#3E6B56]'
};
const dueText = {
    overdue:
        'text-[#9E4A4A]',
    urgent:
        'text-[#B6862A]',
    soon:
        'text-[#B6862A]',
    ok:
        'text-[#4A5A50]'
};
const dueList =
    document.getElementById(
        'due-list'
    );
dueList.innerHTML =
    dueItems.map(d => `
      <li
        class="flex items-center gap-3 px-5 py-3 hover:bg-[#F5EFE6]/60 transition"
      >
        <span
          class="w-2.5 h-2.5 rounded-full status-dot ${dueDot[d.level]} shrink-0"
        ></span>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium truncate">
            ${d.title}
          </p>
          <p class="text-xs text-[#8A7B5C] truncate">
            ${d.member}
          </p>
        </div>
        <span
          class="text-xs font-medium ${dueText[d.level]} shrink-0"
        >
          ${d.due}
        </span>
      </li>
    `).join('');


function libEscapeHtmlDash(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function adminAuthHeaders() {
    return { 'Authorization': 'Bearer ' + localStorage.getItem('adminToken') };
}

function formatActivityDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function statusBadgeClasses(status) {
    if (status === 'Overdue') return 'bg-red-50 text-red-600';
    if (status === 'Completed') return 'bg-green-50 text-green-700';
    return 'bg-amber-50 text-amber-700'; // Active
}

async function loadRecentActivity() {
    const tbody = document.getElementById('activity-body');
    if (!tbody) return;

    try {
        const response = await fetch('/api/dashboard/activity', { headers: adminAuthHeaders() });
        if (!response.ok) throw new Error('Failed to load activity');
        const activity = await response.json();

        if (!activity.length) {
            tbody.innerHTML = '<tr><td colspan="5" class="px-5 py-6 text-center text-[#8A7B5C] text-sm">No recent activity.</td></tr>';
            return;
        }

        tbody.innerHTML = activity.map((row) => `
            <tr>
                <td class="px-5 py-3">${libEscapeHtmlDash(row.member)}</td>
                <td class="px-5 py-3">${libEscapeHtmlDash(row.title)}</td>
                <td class="px-5 py-3">${libEscapeHtmlDash(row.action)}</td>
                <td class="px-5 py-3">${formatActivityDate(row.date)}</td>
                <td class="px-5 py-3">
                    <span class="text-xs font-medium px-2 py-1 rounded-full ${statusBadgeClasses(row.status)}">${row.status}</span>
                </td>
            </tr>
        `).join('');
    } catch (err) {
        console.error('Failed to load recent activity:', err);
        tbody.innerHTML = '<tr><td colspan="5" class="px-5 py-6 text-center text-red-500 text-sm">Couldn\'t load activity.</td></tr>';
    }
}

async function loadDueSoon() {
    const list = document.getElementById('due-list');
    if (!list) return;

    try {
        const response = await fetch('/api/dashboard/due-soon', { headers: adminAuthHeaders() });
        if (!response.ok) throw new Error('Failed to load due list');
        const dueSoon = await response.json();

        if (!dueSoon.length) {
            list.innerHTML = '<li class="px-5 py-6 text-center text-[#8A7B5C] text-sm">Nothing due soon.</li>';
            return;
        }

        list.innerHTML = dueSoon.map((row) => {
            const isOverdue = row.days_remaining < 0;
            const label = isOverdue
                ? `${Math.abs(row.days_remaining)}d overdue`
                : row.days_remaining === 0
                    ? 'Due today'
                    : `Due in ${row.days_remaining}d`;
            return `
                <li class="px-5 py-3 flex items-center justify-between">
                    <div class="min-w-0">
                        <p class="text-sm font-medium text-ink truncate">${libEscapeHtmlDash(row.title)}</p>
                        <p class="text-xs text-[#8A7B5C] truncate">${libEscapeHtmlDash(row.member)}</p>
                    </div>
                    <span class="text-xs font-medium px-2 py-1 rounded-full shrink-0 ${isOverdue ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'}">${label}</span>
                </li>
            `;
        }).join('');
    } catch (err) {
        console.error('Failed to load due list:', err);
        list.innerHTML = '<li class="px-5 py-6 text-center text-red-500 text-sm">Couldn\'t load due list.</li>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadRecentActivity();
    loadDueSoon();
});