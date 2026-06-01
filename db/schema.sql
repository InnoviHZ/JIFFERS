CREATE TABLE IF NOT EXISTS safe_places (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    lga TEXT NOT NULL,
    capacity INTEGER,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    contact_person TEXT,
    contact_phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Initial place types
INSERT INTO safe_places (name, type, lga, capacity, lat, lng, contact_person, contact_phone) VALUES
('Dutse General Hospital', 'Hospital', 'Dutse', 500, 11.7, 9.3, 'Dr. Ahmed', '+234123456789'),
('Central Primary School', 'School', 'Hadejia', 300, 12.4, 10.0, 'Mr. Ibrahim', '+234987654321');
