class Database {
    constructor() {
        this.sqlite3 = require('sqlite3').verbose();
        this.db = new this.sqlite3.Database('./codes.db');
        this.db.run('CREATE TABLE IF NOT EXISTS tokens (id INTEGER PRIMARY KEY, key TEXT, uses INTEGER)');
        console.log('Database initialized.');
    }

    insertKey(key, uses) {
        this.db.get('SELECT * FROM tokens WHERE key = ?', [key], (err, row) => {
            if (err) {
                console.error('Database error:', err);
                return;
            }
    
            if (!row) {
                // Nøglen findes ikke, indsæt den
                this.db.run('INSERT INTO tokens (key, uses) VALUES (?, ?)', [key, uses], (err) => {
                    if (err) console.error('Error inserting key:', err);
                    else {
                        console.clear();
                        console.log('New key created:', key);
                    }
                });
            } else {
                console.log('Key already exists:', key);
            }
        });
    }
    
    getKey(key, uses) {
        this.db.get('SELECT * FROM tokens WHERE key = ? AND uses = ?', [key, uses], (err, row) => {
            if (row) {
                console.log('Kode er gyldig!');
                this.db.run('UPDATE tokens SET uses = ? WHERE key = ?', [uses - 1, key]);
            } else {
                console.log('Kode er ugyldig eller allerede brugt.');
            }
        });
    }

    getAllKeys() {
        return new Promise((resolve, reject) => {
            this.db.all('SELECT * FROM tokens', (err, rows) => {
                if (err) {
                    console.error('Database error:', err);
                    reject(err);
                    return;
                }
                resolve(rows);
            });
        });
    }

    verifyKey(key) {
        return new Promise((resolve, reject) => {
            if (!key) {
                console.log('Ingen kode angivet.');
                resolve(0);
                return;
            }
    
            this.db.get('SELECT * FROM tokens WHERE key = ? AND uses > 0', [key], (err, row) => {
                if (err) {
                    console.error('Database error:', err);
                    reject(err);
                    return;
                }
    
                if (row) {
                    console.log('Kode er gyldig!');
                    this.db.run('UPDATE tokens SET uses = uses - 1 WHERE key = ?', [key]);
                    resolve(true);
                } else {
                    console.log('Kode er ugyldig eller allerede brugt.');
                    resolve(false);
                }
            });
        });
    }

    getUsesLeft(key) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT uses FROM tokens WHERE key = ?', [key], (err, row) => {
                if (err) {
                    console.error('Database error:', err);
                    reject(err);
                    return;
                }

                if (row) {
                    resolve(row.uses);
                } else {
                    resolve(0);
                }
            });
        });
    }

    clearDatabase() {
        this.db.run('DELETE FROM tokens', (err) => {
            if (err) {
                console.error('Error clearing table:', err);
            } else {
                console.log('All data cleared from the table.');
            }
        });
    }
    
}

module.exports = Database;