# Event Check-in System

A comprehensive web-based check-in system for running events built with Cloudflare Workers, D1 database, and R2 storage. The system allows event staff to search for participants, capture their photo and signature, and record their check-in information.

## Features

### 🔍 Search Functionality
- Search participants by bib number, name, phone, or email
- Real-time search results with debouncing
- Display basic participant information and check-in status
- Easy participant selection for check-in

### 👤 Participant Management
- Complete participant information display
- Current check-in status tracking
- Emergency contact information
- Medical information and notes
- Parent/guardian details for minors

### 📸 Photo Capture
- Camera access for photo capture
- Photo preview before saving
- Option to retake photos
- Automatic photo optimization and storage

### ✍️ Digital Signature
- Digital signature pad with mouse and touch support
- Clear and re-sign functionality
- Signature saved as high-quality image
- Touch-friendly interface for tablets

### ✅ Check-in Process
- Step-by-step guided check-in process
- Staff member identification
- Optional check-in notes
- Automatic timestamp recording
- Progress tracking with visual indicators

### 📊 Statistics Dashboard
- Real-time check-in statistics
- Total participants count
- Checked-in vs remaining participants
- Completion percentage

## Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Backend**: Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2
- **Framework**: React Router 7
- **Deployment**: Cloudflare Pages

## Database Schema

The system uses a comprehensive `participants` table with the following structure:

```sql
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
```

## API Endpoints

### Search Participants
```
GET /api/search?q={query}
```
Search participants by bib number, name, phone, or email.

### Get Participant Details
```
GET /api/participant/{id}
GET /api/participant/bib/{bibNo}
```
Retrieve detailed participant information.

### Check-in Participant
```
POST /api/checkin
```
Complete participant check-in with photo and signature.

### Statistics
```
GET /api/stats
GET /api/recent-checkins?limit={number}
```
Get check-in statistics and recent check-ins.

## Setup and Deployment

### Prerequisites

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Node.js**: Version 18 or higher
3. **Wrangler CLI**: Cloudflare's command-line tool

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd event-check-in
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Cloudflare D1 Database**
   ```bash
   # Create D1 database
   wrangler d1 create ducklytics-db
   
   # Note the database ID from the output
   # Update wrangler.json with the correct database_id
   ```

4. **Set up Cloudflare R2 Storage**
   ```bash
   # Create R2 bucket
   wrangler r2 bucket create event-check-in-storage
   ```

5. **Initialize Database Schema**
   ```bash
   # Apply the schema
   wrangler d1 execute ducklytics-db --file=./schema.sql
   ```

6. **Configure Environment**
   Update `wrangler.json` with your database and R2 bucket details:
   ```json
   {
     "d1_databases": [
       {
         "binding": "DUCKLYTICS_PROD",
         "database_name": "ducklytics-db",
         "database_id": "your-database-id-here"
       }
     ],
     "r2_buckets": [
       {
         "binding": "EVENT_STORAGE",
         "bucket_name": "event-check-in-storage"
       }
     ]
   }
   ```

### Development

1. **Start development server**
   ```bash
   npm run dev
   ```

2. **Access the application**
   Open [http://localhost:8788](http://localhost:8788) in your browser

### Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy to Cloudflare**
   ```bash
   npm run deploy
   ```

3. **Verify deployment**
   Check your Cloudflare dashboard for the deployed worker URL

## Usage Guide

### For Event Staff

1. **Search for Participants**
   - Use the search bar to find participants by bib number, name, phone, or email
   - Click on a participant from the search results

2. **Review Participant Details**
   - Check all participant information
   - Verify emergency contacts and medical information
   - Note any special requirements

3. **Start Check-in Process**
   - Click "Start Check-in Process" button
   - Enter your name as the check-in staff member

4. **Capture Photo**
   - Position the participant in the camera frame
   - Click "Capture Photo" to take the picture
   - Review and confirm or retake if needed

5. **Collect Signature**
   - Have the participant sign using mouse or touch screen
   - Click "Confirm Signature" when satisfied

6. **Complete Check-in**
   - Review all information
   - Add any notes if needed
   - Click "Complete Check-in" to finish

### Data Management

- **Adding Participants**: Use the database directly or create an import script
- **Viewing Statistics**: Check the dashboard for real-time statistics
- **Accessing Photos/Signatures**: Files are stored in R2 with URLs in the database

## Security Considerations

- **Camera Access**: Requires HTTPS and user permission
- **Data Storage**: All data encrypted in transit and at rest
- **Access Control**: Consider implementing authentication for production use
- **File Uploads**: Images are validated and optimized before storage

## Browser Compatibility

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Mobile Devices**: iOS Safari, Chrome Mobile
- **Tablets**: iPad, Android tablets
- **Camera Support**: Required for photo capture functionality

## Troubleshooting

### Common Issues

1. **Camera not working**
   - Ensure HTTPS is enabled
   - Check browser permissions
   - Try refreshing the page

2. **Database connection errors**
   - Verify D1 database binding in wrangler.json
   - Check database ID is correct

3. **R2 storage issues**
   - Verify R2 bucket binding
   - Check bucket permissions

4. **Search not working**
   - Ensure database has participant data
   - Check API endpoint responses

### Support

For technical support or feature requests, please contact the development team or create an issue in the repository.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Built with ❤️ for running events worldwide**