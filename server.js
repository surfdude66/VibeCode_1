const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('static'));

// Database Setup
const dbPath = path.join(__dirname, 'fitness.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Database connection error:', err.message);
    } else {
        console.log('Connected to SQLite database.');
        createTables();
    }
});

function createTables() {
    db.run(`CREATE TABLE IF NOT EXISTS activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        duration INTEGER NOT NULL,
        intensity TEXT NOT NULL,
        notes TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS wellness (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 10),
        sleep_hours REAL,
        mood_score INTEGER CHECK (mood_score BETWEEN 1 AND 10),
        date DATE DEFAULT CURRENT_DATE
    )`);
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates', 'index.html'));
});

// API - Activities
app.get('/api/activities', (req, res) => {
    db.all('SELECT * FROM activities ORDER BY timestamp DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/activities', (req, res) => {
    const { type, duration, intensity, notes } = req.body;
    db.run(
        'INSERT INTO activities (type, duration, intensity, notes) VALUES (?, ?, ?, ?)',
        [type, duration, intensity, notes],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: this.lastID, type, duration, intensity, notes });
        }
    );
});

// API - Wellness
app.get('/api/wellness', (req, res) => {
    db.all('SELECT * FROM wellness ORDER BY date DESC LIMIT 7', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.reverse()); // Chronological for charts
    });
});

app.post('/api/wellness', (req, res) => {
    const { energy_level, sleep_hours, mood_score } = req.body;
    const today = new Date().toISOString().split('T')[0];

    // Upsert logic
    db.get('SELECT id FROM wellness WHERE date = ?', [today], (err, row) => {
        if (row) {
            db.run(
                'UPDATE wellness SET energy_level = ?, sleep_hours = ?, mood_score = ? WHERE id = ?',
                [energy_level, sleep_hours, mood_score, row.id],
                (err) => {
                    if (err) return res.status(500).json({ error: err.message });
                    res.status(201).json({ status: 'success' });
                }
            );
        } else {
            db.run(
                'INSERT INTO wellness (energy_level, sleep_hours, mood_score) VALUES (?, ?, ?)',
                [energy_level, sleep_hours, mood_score],
                (err) => {
                    if (err) return res.status(500).json({ error: err.message });
                    res.status(201).json({ status: 'success' });
                }
            );
        }
    });
});

app.listen(PORT, () => {
    console.log(`Node.js server running at http://localhost:${PORT}`);
});
