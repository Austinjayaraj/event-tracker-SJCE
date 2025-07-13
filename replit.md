# QR Code-Based Attendance Management System

## Overview

This is a full-stack web application for St. Joseph's College of Engineering designed to manage student attendance using QR code technology. The system features dual dashboards for administrators and students, with comprehensive event management, registration, and attendance tracking capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.
UI/UX Preferences: User wants the application to look good and attractive with React frontend.

## Recent Changes

- **July 13, 2025**: Successfully implemented complete QR code attendance management system
  - Built full-stack application with React frontend and Express backend
  - Implemented role-based authentication (admin/student dashboards)
  - Added PostgreSQL database with all required tables
  - Created sample data including admin user (username: admin, password: admin123)
  - Added student user (username: student01, password: student123)
  - Implemented QR code generation and scanning functionality
  - Added file upload system for hackathon submissions
  - Applied college branding with custom colors and styling
  - Server running on port 5000 with proper configuration

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom college branding
- **State Management**: TanStack Query for server state and React hooks for local state
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Authentication**: Passport.js with local strategy and session-based auth
- **Session Storage**: PostgreSQL-backed sessions via connect-pg-simple
- **Password Security**: Scrypt-based hashing with salt
- **File Uploads**: Multer for handling hackathon submissions
- **QR Code Generation**: QRCode library for generating attendance codes

### Database Design
- **Primary Database**: PostgreSQL via Neon Database
- **ORM**: Drizzle ORM with type-safe schema definitions
- **Schema Location**: `/shared/schema.ts` for type sharing between client and server
- **Migrations**: Drizzle Kit for database schema management

## Key Components

### Authentication System
- Role-based access control (Admin/Student)
- Session-based authentication with secure password hashing
- Protected routes with automatic redirection
- User management with department and section organization

### Event Management
- Three event types: College Events, Department Events, and Hackathons
- CRUD operations for event creation, modification, and deletion
- Event scheduling with date, time, and venue management
- Department-specific event filtering

### Registration & QR Code System
- Automatic QR code generation upon event registration
- Unique QR codes for each student-event combination
- QR code download and sharing capabilities
- Registration status tracking

### Attendance Tracking
- QR code scanning for attendance verification
- Real-time attendance status updates
- Attendance reporting and analytics
- Admin oversight of attendance records

### Hackathon Features
- File upload system for hackathon submissions (PDF, ZIP, DOC, DOCX)
- Multi-round hackathon support
- Submission management and viewing
- Results tracking and management

## Data Flow

1. **User Authentication**: Users log in through role-specific interfaces
2. **Event Discovery**: Students browse available events filtered by type/department
3. **Registration Process**: Students register for events and receive QR codes
4. **Attendance Scanning**: QR codes are scanned to mark attendance
5. **File Submissions**: Hackathon participants upload required files
6. **Administrative Oversight**: Admins manage events, view attendance, and handle submissions

## External Dependencies

### Core Libraries
- **@neondatabase/serverless**: PostgreSQL connection via Neon
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI component primitives
- **react-hook-form**: Form handling with validation
- **zod**: Runtime type validation
- **passport**: Authentication middleware
- **multer**: File upload handling
- **qrcode**: QR code generation

### Development Tools
- **vite**: Fast development server and build tool
- **tsx**: TypeScript execution for development
- **esbuild**: Fast bundling for production
- **tailwindcss**: Utility-first CSS framework

## Deployment Strategy

### Development Environment
- **Development Server**: Vite dev server with HMR
- **Database**: Neon PostgreSQL with connection pooling
- **Session Storage**: PostgreSQL-backed sessions
- **File Storage**: Local filesystem with multer

### Production Build
- **Frontend**: Vite build with optimized assets
- **Backend**: esbuild bundling for Node.js deployment
- **Database**: Neon PostgreSQL with proper environment variables
- **Static Assets**: Served through Express static middleware

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string (required)
- **SESSION_SECRET**: Session encryption key (required)
- **NODE_ENV**: Environment mode (development/production)

### Security Considerations
- CSRF protection through session validation
- Secure password hashing with scrypt
- File upload restrictions and validation
- Database connection pooling for performance
- Environment-based configuration management

The application follows a modern full-stack architecture with type safety throughout the entire stack, from database schemas to frontend components, ensuring maintainable and reliable code.