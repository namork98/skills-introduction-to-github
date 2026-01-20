const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database path
const dbPath = path.join(__dirname, 'inaruwa_delivery.db');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database.');
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase() {
  // Create users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating users table:', err.message);
    } else {
      console.log('Users table ready.');
    }
  });

  // Create sessions table for simple session management
  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error('Error creating sessions table:', err.message);
    } else {
      console.log('Sessions table ready.');
    }
  });
}

// User operations
const User = {
  // Create a new user
  create: (email, hashedPassword) => {
    return new Promise((resolve, reject) => {
      const sql = 'INSERT INTO users (email, password) VALUES (?, ?)';
      db.run(sql, [email, hashedPassword], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, email });
        }
      });
    });
  },

  // Find user by email
  findByEmail: (email) => {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM users WHERE email = ?';
      db.get(sql, [email], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  },

  // Find user by ID
  findById: (id) => {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT id, email, created_at FROM users WHERE id = ?';
      db.get(sql, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }
};

// Session operations
const Session = {
  // Create a new session
  create: (userId, token, expiresAt) => {
    return new Promise((resolve, reject) => {
      const sql = 'INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)';
      db.run(sql, [userId, token, expiresAt], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, token });
        }
      });
    });
  },

  // Find session by token
  findByToken: (token) => {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT s.*, u.email
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.token = ? AND s.expires_at > datetime('now')
      `;
      db.get(sql, [token], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  },

  // Delete expired sessions
  cleanup: () => {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM sessions WHERE expires_at <= datetime(\'now\')';
      db.run(sql, [], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  }
};

// Cleanup expired sessions periodically
setInterval(() => {
  Session.cleanup().catch(console.error);
}, 60 * 60 * 1000); // Run every hour

module.exports = { db, User, Session };