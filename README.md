# QR Code-Based Attendance Management System

A modern web-based attendance management system that uses QR codes for efficient student attendance tracking. Built with React, TypeScript, Express.js, and PostgreSQL.

## 🚀 Features

### Core Functionality
- **QR Code Generation**: Automatic QR code generation for events with unique tokens
- **Real-time Attendance Tracking**: Scan QR codes to mark student attendance instantly
- **Multi-role System**: Separate interfaces for administrators and students
- **Event Management**: Create, manage, and track various types of events
- **Department-wise Organization**: Support for multiple academic departments
- **Section Management**: A, B, C, D, E sections for student organization

### Admin Dashboard
- **Overview Statistics**: Real-time counts of students, events, registrations, and attendance
- **Event Management**: Create and manage college, department, and hackathon events
- **Student Management**: View and filter students by department
- **Attendance Records**: Comprehensive attendance tracking with filtering and export
- **QR Code Scanner**: Built-in QR code scanner for attendance marking
- **Data Export**: Export attendance data to Excel format
- **Department Statistics**: Visual breakdown of students by department

### Student Dashboard
- **Event Registration**: Register for available events
- **QR Code Access**: Download QR codes for registered events
- **Attendance History**: View personal attendance records
- **Profile Management**: Update personal information

### Authentication & Security
- **Role-based Access**: Secure admin and student portals
- **Session Management**: Persistent login sessions
- **Protected Routes**: Authentication middleware for API endpoints

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Shadcn/ui** for UI components
- **React Query** for data fetching and caching
- **React Hook Form** with Zod validation
- **React QR Code** for QR code generation
- **HTML-to-Image** for QR code downloads

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **PostgreSQL** database
- **Drizzle ORM** for database operations
- **Passport.js** for authentication
- **QRCode** library for server-side QR generation
- **XLSX** for Excel file generation

### Development Tools
- **ESLint** for code linting
- **Prettier** for code formatting
- **Cross-env** for environment variables

## 📋 Prerequisites

Before running this project, ensure you have:

- **Node.js** (v18 or higher)
- **npm** or **yarn** package manager
- **PostgreSQL** database server
- **Git** for version control

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd ReactiveAttendance
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup

#### Create PostgreSQL Database
```sql
CREATE DATABASE attendance_system;
```

#### Update Database Configuration
Edit `drizzle.config.ts` with your database credentials:
```typescript
export default {
  schema: "./shared/schema.ts",
  out: "./drizzle",
  driver: 'pg',
  dbCredentials: {
    host: "localhost",
    user: "your_username",
    password: "your_password",
    database: "attendance_system",
  },
}
```

#### Run Database Migrations
```bash
npm run db:generate
npm run db:migrate
```

### 4. Environment Variables
Create a `.env` file in the root directory:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/attendance_system
NODE_ENV=development
PORT=5000
```

### 5. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## 📁 Project Structure

```
ReactiveAttendance/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility functions and configurations
│   │   ├── pages/         # Main application pages
│   │   └── assets/        # Static assets
│   └── index.html         # HTML entry point
├── server/                # Backend Express.js application
│   ├── auth.ts           # Authentication middleware
│   ├── db.ts             # Database connection
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API route definitions
│   └── storage.ts        # Database operations
├── shared/               # Shared TypeScript definitions
│   └── schema.ts         # Database schema and types
├── uploads/              # File upload directory
└── public/              # Public static files
```

## 🔧 Configuration

### Database Schema
The system uses the following main tables:

- **users**: Student and admin user accounts
- **events**: Event information and details
- **registrations**: Student event registrations with QR codes
- **attendance**: Attendance records with timestamps
- **hackathon_submissions**: File uploads for hackathon events
- **hackathon_rounds**: Hackathon round management
- **hackathon_results**: Results and scoring

### Departments Supported
- CSE (Computer Science Engineering)
- ECE (Electronics & Communication Engineering)
- EEE (Electrical & Electronics Engineering)
- MECH (Mechanical Engineering)
- CIVIL (Civil Engineering)
- IT (Information Technology)
- BIO TECH (Biotechnology)
- ADS (Artificial Intelligence & Data Science)
- AML (Applied Mathematics & Logic)
- CYBER (Cybersecurity)
- EIE (Electronics & Instrumentation Engineering)
- CHEM (Chemical Engineering)
- MBA (Master of Business Administration)
- ME (Master of Engineering)

### Sections
- A, B, C, D, E

## 🎯 Usage Guide

### Admin Access

1. **Login**: Use admin credentials to access the admin dashboard
2. **Create Events**: 
   - Navigate to "Events" tab
   - Click "Create Event"
   - Fill in event details (title, description, type, date, time, venue)
   - Select department for department-specific events
3. **Manage Students**: 
   - View all registered students
   - Filter by department
   - Monitor student registrations
4. **Track Attendance**:
   - Use QR scanner to mark attendance
   - View attendance records with filtering
   - Export attendance data to Excel
5. **Monitor Statistics**:
   - Real-time overview of system metrics
   - Department-wise student distribution

### Student Access

1. **Registration**: Create student account with department and section
2. **Login**: Access student dashboard
3. **Register for Events**:
   - Browse available events
   - Register for events of interest
4. **Download QR Codes**:
   - Access QR codes for registered events
   - Download QR codes for offline use
5. **View Attendance**: Check personal attendance history

### QR Code System

1. **Generation**: QR codes are automatically generated when students register for events
2. **Content**: QR codes contain encrypted data with user ID, event ID, and unique token
3. **Scanning**: Admin can scan QR codes to mark attendance instantly
4. **Security**: Each QR code has a unique token to prevent duplication

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/logout` - User logout

### Events
- `GET /api/events` - Get all events
- `POST /api/events` - Create new event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

### Registrations
- `GET /api/registrations` - Get user registrations
- `POST /api/registrations` - Register for event
- `DELETE /api/registrations/:id` - Cancel registration

### Attendance
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance/scan` - Mark attendance via QR scan
- `GET /api/attendance/export` - Export attendance to Excel

### Statistics
- `GET /api/stats` - Get system statistics
- `GET /api/users` - Get user list

## 🛡️ Security Features

- **Authentication Middleware**: Protected routes require valid sessions
- **Role-based Access**: Admin and student routes are properly segregated
- **Input Validation**: All inputs are validated using Zod schemas
- **SQL Injection Prevention**: Using parameterized queries with Drizzle ORM
- **Session Management**: Secure session handling with Passport.js

## 📊 Data Export

### Excel Export Features
- **Event-specific Export**: Export attendance for specific events
- **All Attendance Export**: Export complete attendance records
- **Formatted Data**: Properly formatted Excel files with headers
- **Dynamic Filenames**: Files named based on export scope

### Export Data Structure
```typescript
{
  Name: string,           // Student name
  StudentID: string,      // Student ID
  Department: string,     // Student department
  Event: string,          // Event title
  CheckInTime: Date,      // Attendance timestamp
  Status: string          // Attendance status
}
```

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run db:generate  # Generate database migrations
npm run db:migrate   # Run database migrations
```

### Code Quality
- **TypeScript**: Full type safety across the application
- **ESLint**: Code linting and style enforcement
- **Prettier**: Automatic code formatting
- **Component Architecture**: Reusable UI components

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify PostgreSQL is running
   - Check database credentials in `drizzle.config.ts`
   - Ensure database exists

2. **Port Already in Use**
   - Kill existing processes on port 5000
   - Or change port in server configuration

3. **QR Code Not Generating**
   - Check browser console for errors
   - Verify QR code libraries are installed
   - Ensure proper data format for QR generation

4. **Attendance Not Updating**
   - Check network tab for API errors
   - Verify authentication status
   - Check database connection

### Debug Mode
Enable detailed logging by setting `NODE_ENV=development` in your environment variables.

## 📈 Performance Optimizations

- **React Query**: Efficient data caching and background updates
- **Polling**: Real-time statistics updates every 5 seconds
- **Lazy Loading**: Components loaded on demand
- **Optimized Queries**: Efficient database queries with proper indexing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the troubleshooting section above

---

**Version**: 1.0.0  
**Last Updated**: December 2024  
**Maintainer**: Development Team 