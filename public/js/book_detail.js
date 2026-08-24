function libEscapeHtmlDetail(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

document.addEventListener('DOMContentLoaded', async () => {
    const loadingEl = document.getElementById('bookLoading');
    const contentEl = document.getElementById('bookDetailContent');
    const notFoundEl = document.getElementById('bookNotFound');

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
        loadingEl.hidden = true;
        notFoundEl.hidden = false;
        return;
    }

    try {
        const response = await fetch('/api/books/' + encodeURIComponent(id));

        if (response.status === 404) {
            loadingEl.hidden = true;
            notFoundEl.hidden = false;
            return;
        }
        if (!response.ok) throw new Error('Failed to load book');

        const book = await response.json();

        document.getElementById('bookCover').src = book.cover_image || '/images/1stbook.jpg';
        document.getElementById('bookCover').alt = book.title || 'Book cover';
        document.getElementById('bookTitle').textContent = book.title || 'Untitled';
        document.getElementById('bookCategory').textContent = book.category_name || 'Uncategorized';
        document.getElementById('bookIsbn').textContent = book.isbn ? `ISBN: ${book.isbn}` : '';
        document.getElementById('bookDescription').textContent = book.description || 'No description available.';

        const available = Number(book.available_copies) || 0;
        const total = Number(book.total_copies) || 0;
        const availabilityEl = document.getElementById('bookAvailability');

        if (total === 0) {
            availabilityEl.textContent = 'No copies in catalog';
            availabilityEl.classList.add('bg-red-50', 'text-red-600');
        } else if (available > 0) {
            availabilityEl.textContent = `${available} of ${total} copies available`;
            availabilityEl.classList.add('bg-green-50', 'text-green-700');
        } else {
            availabilityEl.textContent = 'All copies currently checked out';
            availabilityEl.classList.add('bg-red-50', 'text-red-600');
        }

        document.title = `${book.title || 'Book'} — APNA Library`;

        loadingEl.hidden = true;
        contentEl.hidden = false;
    } catch (err) {
        console.error('Failed to load book:', err);
        loadingEl.hidden = true;
        notFoundEl.hidden = false;
    }
});