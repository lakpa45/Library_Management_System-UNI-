import express from 'express';
import path from 'path';

import { fileURLToPath } from 'url';

const __filenam = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;


const app = express();

app.get('./views/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'view', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server runnin on port ${PORT} `);
});
