const express = require('express');
const sqlite3 = require('better-sqlite3');
const cors = require('cors');
const app = express();

const db = new sqlite3('db/jiffers.db');

app.use(cors());
app.use(express.json());

// Safe places endpoints
app.get('/api/safe-places', (req, res) => {
    const { lga } = req.query;
    const places = db.prepare('SELECT * FROM safe_places WHERE lga = ?').all(lga);
    res.json(places);
});

app.post('/api/safe-places', (req, res) => {
    const { name, type, lga, capacity, lat, lng, contact_person, contact_phone } = req.body;
    const result = db.prepare(`
        INSERT INTO safe_places (name, type, lga, capacity, lat, lng, contact_person, contact_phone)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, type, lga, capacity, lat, lng, contact_person, contact_phone);
    res.json({ id: result.lastInsertRowid });
});

app.listen(3000, () => console.log('Server running on port 3000'));
