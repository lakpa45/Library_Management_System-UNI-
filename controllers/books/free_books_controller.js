const GUTENDEX_URL = 'https://gutendex.com/books/';
const REQUEST_TIMEOUT_MS = 10000;

const firstFormat = (formats, types) => {
    for (const type of types) {
        if (typeof formats?.[type] === 'string' && formats[type]) {
            return formats[type];
        }
    }
    return null;
};

const mapBook = (book) => ({
    id: book.id,
    title: typeof book.title === 'string' ? book.title : '',
    authors: Array.isArray(book.authors)
        ? book.authors.map((author) => author?.name).filter(Boolean)
        : [],
    languages: Array.isArray(book.languages) ? book.languages.filter(Boolean) : [],
    cover: firstFormat(book.formats, ['image/jpeg', 'image/png']),
    readUrl: firstFormat(book.formats, [
        'text/html; charset=utf-8',
        'text/html',
        'text/plain; charset=utf-8',
        'text/plain'
    ]),
    epubUrl: firstFormat(book.formats, ['application/epub+zip']),
    downloadCount: Number.isFinite(book.download_count) ? book.download_count : 0
});

export const getFreeBooks = async (req, res) => {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const rawPage = String(req.query.page ?? '1');

    if (!/^\d+$/.test(rawPage) || Number(rawPage) < 1) {
        return res.status(400).json({ message: 'Page must be a positive integer.' });
    }

    const params = new URLSearchParams({ page: rawPage });
    if (q) params.set('search', q);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(`${GUTENDEX_URL}?${params.toString()}`, {
            signal: controller.signal,
            headers: { Accept: 'application/json' }
        });

        if (!response.ok) {
            return res.status(502).json({ message: 'The free-books service is currently unavailable.' });
        }

        let data;
        try {
            data = await response.json();
        } catch {
            return res.status(502).json({ message: 'The free-books service returned an invalid response.' });
        }

        if (!data || !Array.isArray(data.results)) {
            return res.status(502).json({ message: 'The free-books service returned an invalid response.' });
        }

        return res.status(200).json({
            count: Number.isFinite(data.count) ? data.count : data.results.length,
            next: typeof data.next === 'string' ? data.next : null,
            previous: typeof data.previous === 'string' ? data.previous : null,
            books: data.results.map(mapBook)
        });
    } catch (error) {
        if (error.name === 'AbortError') {
            return res.status(504).json({ message: 'The free-books service took too long to respond.' });
        }
        console.error('Gutendex request failed:', error);
        return res.status(502).json({ message: 'Unable to reach the free-books service.' });
    } finally {
        clearTimeout(timeout);
    }
};
