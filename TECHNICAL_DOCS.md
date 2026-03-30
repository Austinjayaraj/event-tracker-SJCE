
# Technical Documentation

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [API Documentation](#api-documentation)
4. [Frontend Architecture](#frontend-architecture)
5. [Backend Architecture](#backend-architecture)
6. [Authentication Flow](#authentication-flow)
7. [QR Code System](#qr-code-system)
8. [State Management](#state-management)
9. [Error Handling](#error-handling)
10. [Performance Considerations](#performance-considerations)
11. [Security Implementation](#security-implementation)
12. [Testing Strategy](#testing-strategy)

## 🏗️ Architecture Overview

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React)       │◄──►│   (Express.js)  │◄──►│   (PostgreSQL)  │
│                 │    │                 │    │                 │
│ - Admin Dashboard│    │ - API Routes    │    │ - Users         │
│ - Student Dashboard│  │ - Authentication│    │ - Events        │
│ - QR Scanner    │    │ - Business Logic│    │ - Registrations │
│ - QR Generator  │    │ - File Upload   │    │ - Attendance    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack Details

#### Frontend Stack
- **React 18**: Component-based UI library
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn/ui**: Pre-built UI components
- **React Query**: Data fetching and caching
- **React Hook Form**: Form management with validation
- **React QR Code**: QR code generation
- **HTML-to-Image**: QR code download functionality

#### Backend Stack
- **Node.js**: JavaScript runtime
- **Express.js**: Web framework
- **TypeScript**: Type safety
- **PostgreSQL**: Relational database
- **Drizzle ORM**: Type-safe database operations
- **Passport.js**: Authentication middleware
- **QRCode**: Server-side QR generation
- **XLSX**: Excel file generation
- **Multer**: File upload handling

## 🗄️ Database Schema

### Core Tables

#### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  student_id TEXT UNIQUE,
  department TEXT,
  section TEXT,
  role TEXT NOT NULL DEFAULT 'student',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

#### Events Table
```sql
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  event_type TEXT NOT NULL,
  date TIMESTAMP NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  venue TEXT NOT NULL,
  department TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by INTEGER REFERENCES users(id) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

#### Registrations Table
```sql
CREATE TABLE registrations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  event_id INTEGER REFERENCES events(id) NOT NULL,
  qr_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'registered',
  registered_at TIMESTAMP DEFAULT NOW() NOT NULL
);
```

#### Attendance Table
```sql
CREATE TABLE attendance (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  event_id INTEGER REFERENCES events(id) NOT NULL,
  registration_id INTEGER REFERENCES registrations(id) NOT NULL,
  attended_at TIMESTAMP DEFAULT NOW() NOT NULL,
  scanned_by INTEGER REFERENCES users(id) NOT NULL
);
```

### Relationships
- **Users** → **Events** (One-to-Many): Users can create multiple events
- **Users** → **Registrations** (One-to-Many): Users can register for multiple events
- **Events** → **Registrations** (One-to-Many): Events can have multiple registrations
- **Registrations** → **Attendance** (One-to-One): Each registration can have one attendance record
- **Users** → **Attendance** (One-to-Many): Users can have multiple attendance records

## 🔌 API Documentation

### Authentication Endpoints

#### POST /api/auth/login
**Purpose**: Authenticate user and create session

**Request Body**:
```json
{
  "username": "string",
  "password": "string"
}
```

**Response**:
```json
{
  "user": {
    "id": 1,
    "username": "admin",
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

#### POST /api/auth/register
**Purpose**: Register new student user

**Request Body**:
```json
{
  "username": "string",
  "password": "string",
  "name": "string",
  "email": "string",
  "studentId": "string",
  "department": "string",
  "section": "string"
}
```

**Response**:
```json
{
  "user": {
    "id": 1,
    "username": "student1",
    "name": "Student Name",
    "email": "student@example.com",
    "studentId": "STU001",
    "department": "CSE",
    "section": "A",
    "role": "student"
  }
}
```

### Event Endpoints

#### GET /api/events
**Purpose**: Get all events (filtered by user role and department)

**Query Parameters**:
- `department` (optional): Filter by department
- `eventType` (optional): Filter by event type

**Response**:
```json
[
  {
    "id": 1,
    "title": "Tech Conference",
    "description": "Annual technology conference",
    "eventType": "college",
    "date": "2024-12-15T10:00:00Z",
    "startTime": "10:00",
    "endTime": "16:00",
    "venue": "Main Auditorium",
    "department": null,
    "isActive": true
  }
]
```

#### POST /api/events
**Purpose**: Create new event (admin only)

**Request Body**:
```json
{
  "title": "string",
  "description": "string",
  "eventType": "college|department|hackathon",
  "date": "2024-12-15T10:00:00Z",
  "startTime": "10:00",
  "endTime": "16:00",
  "venue": "string",
  "department": "string"
}
```

### Registration Endpoints

#### POST /api/registrations
**Purpose**: Register for an event

**Request Body**:
```json
{
  "eventId": 1
}
```

**Response**:
```json
{
  "registration": {
    "id": 1,
    "userId": 1,
    "eventId": 1,
    "qrCode": "unique_token_here",
    "status": "registered",
    "registeredAt": "2024-12-15T10:00:00Z"
  }
}
```

### Attendance Endpoints

#### POST /api/attendance/scan
**Purpose**: Mark attendance via QR code scan

**Request Body**:
```json
{
  "qrData": "encrypted_qr_data"
}
```

**Response**:
```json
{
  "attendance": {
    "id": 1,
    "userId": 1,
    "eventId": 1,
    "registrationId": 1,
    "attendedAt": "2024-12-15T10:30:00Z",
    "scannedBy": 1
  }
}
```

#### GET /api/attendance/export
**Purpose**: Export attendance data to Excel

**Query Parameters**:
- `eventId` (optional): Export specific event attendance

**Response**: Excel file download

### Statistics Endpoints

#### GET /api/stats
**Purpose**: Get system statistics

**Response**:
```json
{
  "totalStudents": 150,
  "totalEvents": 25,
  "totalRegistrations": 1200,
  "totalAttendance": 800
}
```

## 🎨 Frontend Architecture

### Component Structure

```
src/
├── components/
│   ├── ui/                    # Shadcn/ui components
│   ├── file-upload-modal.tsx  # File upload component
│   └── qr-code-modal.tsx      # QR code display component
├── hooks/
│   ├── use-auth.tsx           # Authentication hook
│   ├── use-mobile.tsx         # Mobile detection hook
│   └── use-toast.ts           # Toast notification hook
├── lib/
│   ├── protected-route.tsx    # Route protection component
│   ├── queryClient.ts         # React Query configuration
│   └── utils.ts               # Utility functions
├── pages/
│   ├── admin-dashboard.tsx    # Admin dashboard
│   ├── auth-page.tsx          # Authentication page
│   ├── not-found.tsx          # 404 page
│   └── student-dashboard.tsx  # Student dashboard
└── main.tsx                   # Application entry point
```

### State Management

#### React Query Integration
```typescript
// Query configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 3,
    },
  },
});

// Example query
const { data: stats, isLoading } = useQuery({
  queryKey: ["/api/stats"],
  refetchInterval: 5000, // Poll every 5 seconds
});
```

#### Form Management
```typescript
// React Hook Form with Zod validation
const registerForm = useForm<RegisterForm>({
  resolver: zodResolver(registerSchema),
  defaultValues: {
    username: "",
    password: "",
    name: "",
    email: "",
    studentId: "",
    department: "",
    section: "",
  },
});
```

### Routing and Navigation

#### Protected Routes
```typescript
// Route protection based on authentication
function ProtectedRoute({ children, requiredRole }: Props) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/auth" />;
  if (requiredRole && user.role !== requiredRole) return <Navigate to="/" />;
  
  return <>{children}</>;
}
```

## ⚙️ Backend Architecture

### Server Structure

```
server/
├── auth.ts           # Authentication middleware
├── db.ts             # Database connection
├── index.ts          # Server entry point
├── routes.ts         # API route definitions
└── storage.ts        # Database operations
```

### Middleware Stack

```typescript
// Express middleware configuration
app.use(express.json());
app.use(express.static("public"));
app.use(session({
  secret: "your-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));
app.use(passport.initialize());
app.use(passport.session());
```

### Authentication Flow

```typescript
// Passport.js local strategy
passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    const user = await storage.getUserByUsername(username);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return done(null, false);
    }
    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));
```

## 🔐 Authentication Flow

### Login Process
1. **User submits credentials** → Frontend sends POST to `/api/auth/login`
2. **Server validates credentials** → Passport.js authenticates user
3. **Session creation** → User session stored in database
4. **Response sent** → User data returned to frontend
5. **State update** → React Query updates user state
6. **Route protection** → Protected routes check authentication

### Registration Process
1. **User fills registration form** → Form validation with Zod
2. **Password hashing** → bcrypt hashes password
3. **User creation** → Database stores new user
4. **Session creation** → User automatically logged in
5. **State update** → Frontend updates user state

### Session Management
```typescript
// Session serialization
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});
```

## 📱 QR Code System

### QR Code Generation

#### Backend Generation
```typescript
// Generate unique token and QR code
const token = crypto.randomBytes(32).toString('hex');
const qrData = {
  userId: user.id,
  eventId: event.id,
  token: token
};
const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));
```

#### Frontend Display
```typescript
// React QR Code component
<QRCode
  value={JSON.stringify({
    userId: registration.userId,
    eventId: registration.eventId,
    token: registration.qrCode
  })}
  size={200}
  bgColor="#f3f4f6"
  fgColor="#222"
  level="H"
/>
```

### QR Code Scanning

#### Scanner Implementation
```typescript
// QR code scanning with react-qr-reader
const handleScan = (data: string | null) => {
  if (data) {
    try {
      const qrData = JSON.parse(data);
      qrScanMutation.mutate({ qrData });
    } catch (error) {
      toast({ title: "Invalid QR Code", variant: "destructive" });
    }
  }
};
```

#### Attendance Marking
```typescript
// Process scanned QR code
const qrScanMutation = useMutation({
  mutationFn: async ({ qrData }: { qrData: any }) => {
    const response = await apiRequest("POST", "/api/attendance/scan", { qrData });
    return response.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
    toast({ title: "Attendance marked successfully" });
  },
});
```

## 📊 State Management

### React Query Configuration

#### Query Client Setup
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 3,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});
```

#### Data Fetching Patterns
```typescript
// Optimistic updates
const createEventMutation = useMutation({
  mutationFn: createEvent,
  onMutate: async (newEvent) => {
    await queryClient.cancelQueries({ queryKey: ["/api/events"] });
    const previousEvents = queryClient.getQueryData(["/api/events"]);
    queryClient.setQueryData(["/api/events"], (old: any) => [...old, newEvent]);
    return { previousEvents };
  },
  onError: (err, newEvent, context) => {
    queryClient.setQueryData(["/api/events"], context?.previousEvents);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ["/api/events"] });
  },
});
```

### Local State Management

#### Form State
```typescript
// React Hook Form with validation
const eventForm = useForm<EventForm>({
  resolver: zodResolver(eventSchema),
  defaultValues: {
    title: "",
    description: "",
    eventType: "college",
    date: "",
    startTime: "",
    endTime: "",
    venue: "",
    department: "",
  },
});
```

#### UI State
```typescript
// Component state management
const [activeTab, setActiveTab] = useState("overview");
const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
const [createEventOpen, setCreateEventOpen] = useState(false);
const [scannerOpen, setScannerOpen] = useState(false);
```

## 🛡️ Error Handling

### Frontend Error Handling

#### API Error Handling
```typescript
// Centralized error handling
const apiRequest = async (method: string, url: string, data?: any) => {
  try {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Request failed");
    }
    
    return response;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};
```

#### Component Error Boundaries
```typescript
// Error boundary for React components
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Component Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}
```

### Backend Error Handling

#### Global Error Handler
```typescript
// Express error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  
  console.error("API Error:", err);
  
  res.status(status).json({ message });
});
```

#### Route-level Error Handling
```typescript
// Try-catch in route handlers
app.post("/api/registrations", requireAuth, async (req, res) => {
  try {
    // Route logic
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: "Invalid data", 
        errors: error.errors 
      });
    }
    console.error("Registration error:", error);
    res.status(500).json({ message: "Failed to create registration" });
  }
});
```

## ⚡ Performance Considerations

### Frontend Optimizations

#### React Query Optimizations
```typescript
// Optimized queries with proper caching
const { data: stats } = useQuery({
  queryKey: ["/api/stats"],
  refetchInterval: 5000, // Real-time updates
  staleTime: 30000, // Consider data fresh for 30 seconds
});
```

#### Component Optimization
```typescript
// Memoized components for performance
const EventCard = React.memo(({ event }: { event: Event }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{event.title}</CardTitle>
      </CardHeader>
    </Card>
  );
});
```

### Backend Optimizations

#### Database Query Optimization
```typescript
// Efficient database queries
async getStats(): Promise<Stats> {
  const [studentsCount] = await db
    .select({ count: users.id })
    .from(users)
    .where(eq(users.role, "student"));
  
  return {
    totalStudents: studentsCount?.count || 0,
    // ... other stats
  };
}
```

#### Caching Strategy
```typescript
// In-memory caching for frequently accessed data
const cache = new Map();

const getCachedData = async (key: string, fetcher: () => Promise<any>) => {
  if (cache.has(key)) {
    return cache.get(key);
  }
  
  const data = await fetcher();
  cache.set(key, data);
  return data;
};
```

## 🔒 Security Implementation

### Authentication Security

#### Password Security
```typescript
// Password hashing with bcrypt
const hashPassword = (password: string): string => {
  return bcrypt.hashSync(password, 10);
};

const verifyPassword = (password: string, hash: string): boolean => {
  return bcrypt.compareSync(password, hash);
};
```

#### Session Security
```typescript
// Secure session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || "your-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));
```

### Input Validation

#### Zod Schema Validation
```typescript
// Comprehensive input validation
const registerSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  studentId: z.string().min(1),
  department: z.string().min(1),
  section: z.string().min(1),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
```

#### SQL Injection Prevention
```typescript
// Using Drizzle ORM for safe queries
const getUser = async (id: number): Promise<User | null> => {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, id));
  
  return user || null;
};
```

## 🧪 Testing Strategy

### Frontend Testing

#### Component Testing
```typescript
// Example component test with React Testing Library
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

test('renders login form', () => {
  render(
    <QueryClientProvider client={queryClient}>
      <AuthPage />
    </QueryClientProvider>
  );
  
  expect(screen.getByText('Login')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
});
```

#### API Testing
```typescript
// Mock API calls for testing
jest.mock('@/lib/queryClient', () => ({
  apiRequest: jest.fn(),
  queryClient: {
    invalidateQueries: jest.fn(),
    setQueryData: jest.fn(),
  },
}));
```

### Backend Testing

#### Route Testing
```typescript
// Example route test with Jest and Supertest
import request from 'supertest';
import app from '../server';

describe('POST /api/auth/login', () => {
  it('should authenticate valid user', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'password'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.user).toBeDefined();
  });
});
```

#### Database Testing
```typescript
// Database integration tests
describe('User Storage', () => {
  beforeEach(async () => {
    await db.delete(users);
  });

  it('should create user', async () => {
    const user = await storage.createUser({
      username: 'testuser',
      password: 'password',
      name: 'Test User',
      email: 'test@example.com',
      role: 'student'
    });
    
    expect(user.id).toBeDefined();
    expect(user.username).toBe('testuser');
  });
});
```

## 📈 Monitoring and Logging

### Application Logging

#### Structured Logging
```typescript
// Centralized logging utility
const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data);
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error);
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data);
  }
};
```

#### Performance Monitoring
```typescript
// Request timing middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
});
```

---

**Documentation Version**: 1.0.0  
**Last Updated**: December 2024  
**Maintainer**: Development Team 