const sqlite3 = require('sqlite3').verbose();

class Database {
    constructor() {
        this.db = new sqlite3.Database('./codes.db', (err) => {
            if (err) {
                console.error('Failed to connect to database:', err);
            } else {
                console.log('Connected to database.');
                this.setup();
            }
        });
    }

    setup() {
        this.db.run(`
            CREATE TABLE IF NOT EXISTS tokens (
                id INTEGER PRIMARY KEY,
                key TEXT UNIQUE NOT NULL,
                uses INTEGER NOT NULL
            )
        `, (err) => {
            if (err) {
                console.error('Error creating table:', err);
            } else {
                console.log('Table "tokens" is ready.');
            }
        });
    }

    insertKey(key, uses) {
        this.db.run(
            'INSERT OR IGNORE INTO tokens (key, uses) VALUES (?, ?)',
            [key, uses],
            (err) => {
                if (err) {
                    console.error('Error inserting key:', err);
                } else {
                    console.log(`Inserted key: ${key} with uses: ${uses}`);
                }
            }
        );
    }

    verifyKey(key) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT * FROM tokens WHERE key = ? AND uses > 0',
                [key],
                (err, row) => {
                    if (err) {
                        console.error('Database error:', err);
                        reject(err);
                    } else if (row) {
                        console.log('Valid key found:', key);
                        this.db.run('UPDATE tokens SET uses = uses - 1 WHERE key = ?', [key], (updateErr) => {
                            if (updateErr) {
                                console.error('Error updating uses:', updateErr);
                                reject(updateErr);
                            } else {
                                resolve(true);
                            }
                        });
                    } else {
                        console.log('Invalid or expired key:', key);
                        resolve(false);
                    }
                }
            );
        });
    }

    getUsesLeft(key) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT uses FROM tokens WHERE key = ?',
                [key],
                (err, row) => {
                    if (err) {
                        console.error('Error fetching uses left:', err);
                        reject(err);
                    } else if (row) {
                        resolve(row.uses);
                    } else {
                        resolve(null);
                    }
                }
            );
        });
    }
}

module.exports = Database;