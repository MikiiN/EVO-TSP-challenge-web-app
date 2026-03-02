CREATE TABLE results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    login TEXT NOT NULL,
    algorithm TEXT NOT NULL,
    description TEXT,            
    distance REAL NOT NULL,
    route TEXT NOT NULL,
    submission_time DATETIME DEFAULT CURRENT_TIMESTAMP
);