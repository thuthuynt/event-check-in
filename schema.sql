-- Event Check-in System Database Schema

-- Drop existing tables if they exist
DROP TABLE IF EXISTS participants;

-- Create participants table with all required fields
CREATE TABLE participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    start_time TEXT,
    bib_no TEXT UNIQUE NOT NULL,
    id_card_passport TEXT,
    last_name TEXT NOT NULL,
    first_name TEXT NOT NULL,
    tshirt_size TEXT,
    birthday_year INTEGER,
    nationality TEXT,
    phone TEXT,
    email TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    blood_type TEXT,
    medical_information TEXT,
    medicines_using TEXT,
    parent_guardian_full_name TEXT,
    parent_guardian_dob TEXT,
    parent_guardian_email TEXT,
    parent_guardian_id_card TEXT,
    parent_guardian_relationship TEXT,
    full_name TEXT,
    name_on_bib TEXT,
    signature_url TEXT,
    uploaded_image_url TEXT,
    checkin_at TEXT,
    checkin_by TEXT,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better search performance
CREATE INDEX idx_participants_bib_no ON participants(bib_no);
CREATE INDEX idx_participants_last_name ON participants(last_name);
CREATE INDEX idx_participants_first_name ON participants(first_name);
CREATE INDEX idx_participants_phone ON participants(phone);
CREATE INDEX idx_participants_email ON participants(email);
CREATE INDEX idx_participants_checkin_at ON participants(checkin_at);

-- Insert sample data for testing
INSERT INTO participants (
    start_time, bib_no, id_card_passport, last_name, first_name, 
    tshirt_size, birthday_year, nationality, phone, email,
    emergency_contact_name, emergency_contact_phone, blood_type,
    medical_information, medicines_using, full_name, name_on_bib
) VALUES 
('08:00', '001', 'A1234567', 'Smith', 'John', 'L', 1990, 'USA', '+1234567890', 'john.smith@email.com', 'Jane Smith', '+1234567891', 'O+', 'None', 'None', 'John Smith', 'J. Smith'),
('08:15', '002', 'B2345678', 'Johnson', 'Sarah', 'M', 1985, 'Canada', '+1987654321', 'sarah.johnson@email.com', 'Mike Johnson', '+1987654322', 'A+', 'Asthma', 'Inhaler', 'Sarah Johnson', 'S. Johnson'),
('08:30', '003', 'C3456789', 'Brown', 'Michael', 'XL', 1992, 'UK', '+44123456789', 'michael.brown@email.com', 'Lisa Brown', '+44123456790', 'B+', 'None', 'None', 'Michael Brown', 'M. Brown');