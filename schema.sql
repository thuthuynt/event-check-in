-- Multi-Event Running Check-in System Database Schema

-- Drop existing tables if they exist
DROP TABLE IF EXISTS participants;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS users;

-- Create users table for authentication
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_name TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Create events table for event management
CREATE TABLE events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    event_name TEXT NOT NULL,
    event_start_date TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create participants table with all required fields
CREATE TABLE participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    participant_id TEXT,
    start_time TEXT,
    bib_no TEXT,
    id_card_passport TEXT,
    last_name TEXT,
    first_name TEXT,
    tshirt_size TEXT,
    birthday_year TEXT,
    nationality TEXT,
    phone TEXT,
    email TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    blood_type TEXT,
    medical_information TEXT,
    medicines_using TEXT,
    parent_full_name TEXT,
    parent_date_of_birth TEXT,
    parent_email TEXT,
    parent_id_card_passport TEXT,
    parent_relationship TEXT,
    full_name TEXT,
    name_on_bib TEXT,
    signature TEXT,
    uploaded_image TEXT,
    checkin_at TEXT,
    checkin_by TEXT,
    note TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Create indexes for better search performance
CREATE INDEX idx_participants_event_id ON participants(event_id);
CREATE INDEX idx_participants_bib_no ON participants(bib_no);
CREATE INDEX idx_participants_last_name ON participants(last_name);
CREATE INDEX idx_participants_first_name ON participants(first_name);
CREATE INDEX idx_participants_phone ON participants(phone);
CREATE INDEX idx_participants_email ON participants(email);
CREATE INDEX idx_participants_checkin_at ON participants(checkin_at);
CREATE INDEX idx_events_user_id ON events(user_id);

-- Insert sample data for testing
INSERT INTO users (user_name, password_hash) VALUES 
('admin', '$2b$10$rQZ8kF5Q8kF5Q8kF5Q8kF5Q8kF5Q8kF5Q8kF5Q8kF5Q8kF5Q8kF5Q8kF5Q'), -- password: admin123
('organizer1', '$2b$10$rQZ8kF5Q8kF5Q8kF5Q8kF5Q8kF5Q8kF5Q8kF5Q8kF5Q8kF5Q8kF5Q8kF5Q'); -- password: organizer123

INSERT INTO events (user_id, event_name, event_start_date) VALUES 
(1, 'Spring Marathon 2024', '2024-04-15'),
(1, 'Summer 5K Run', '2024-06-20'),
(2, 'Autumn Trail Run', '2024-09-10');

INSERT INTO participants (
    event_id, start_time, bib_no, id_card_passport, last_name, first_name, 
    tshirt_size, birthday_year, nationality, phone, email,
    emergency_contact_name, emergency_contact_phone, blood_type,
    medical_information, medicines_using, full_name, name_on_bib
) VALUES 
(1, '08:00', '001', 'A1234567', 'Smith', 'John', 'L', '1990', 'USA', '+1234567890', 'john.smith@email.com', 'Jane Smith', '+1234567891', 'O+', 'None', 'None', 'John Smith', 'J. Smith'),
(1, '08:15', '002', 'B2345678', 'Johnson', 'Sarah', 'M', '1985', 'Canada', '+1987654321', 'sarah.johnson@email.com', 'Mike Johnson', '+1987654322', 'A+', 'Asthma', 'Inhaler', 'Sarah Johnson', 'S. Johnson'),
(1, '08:30', '003', 'C3456789', 'Brown', 'Michael', 'XL', '1992', 'UK', '+44123456789', 'michael.brown@email.com', 'Lisa Brown', '+44123456790', 'B+', 'None', 'None', 'Michael Brown', 'M. Brown');