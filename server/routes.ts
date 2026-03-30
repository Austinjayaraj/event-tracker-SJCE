import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertEventSchema, insertRegistrationSchema, insertRegistrationBackendSchema, insertAttendanceSchema, insertHackathonSubmissionSchema, insertHackathonRoundSchema, insertHackathonResultSchema } from "@shared/schema";
import { z } from "zod";
import QRCode from "qrcode";
import multer from "multer";
import path from "path";
import fs from "fs";
import { randomBytes } from "crypto";
import * as XLSX from "xlsx";

// File upload configuration for documents
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), "uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  fileFilter: (req, file, cb) => {
    const allowedTypes = /zip|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only ZIP, PDF, DOC, DOCX files are allowed"));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Photo upload configuration for images
const photoUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), "uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
      cb(null, "photo-" + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype.startsWith('image/');
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, GIF image files are allowed"));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit for photos
  }
});

function requireAuth(req: any, res: any, next: any) {
  console.log("requireAuth:", { isAuthenticated: req.isAuthenticated?.(), user: req.user });
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

function requireAdmin(req: any, res: any, next: any) {
  if (!req.isAuthenticated() || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);

  // Dashboard stats
  app.get("/api/stats", requireAuth, async (req, res) => {
    try {
      console.log("Fetching stats...");
      const stats = await storage.getStats();
      console.log("Stats fetched:", stats);
      res.json(stats);
    } catch (error) {
      console.error("Stats fetch error:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Debug endpoint to check database contents
  app.get("/api/debug/database", requireAdmin, async (req, res) => {
    try {
      console.log("Debug: Checking database contents...");
      
      // Get raw counts
      const users = await storage.getAllUsers();
      const events = await storage.getActiveEvents();
      const registrations = await storage.getAllRegistrations();
      const attendance = await storage.getAllAttendance();
      
      const debugInfo = {
        users: {
          total: users.length,
          students: users.filter(u => u.role === "student").length,
          admins: users.filter(u => u.role === "admin").length,
          sample: users.slice(0, 3).map(u => ({ id: u.id, name: u.name, role: u.role }))
        },
        events: {
          total: events.length,
          sample: events.slice(0, 3).map(e => ({ id: e.id, title: e.title, eventType: e.eventType }))
        },
        registrations: {
          total: registrations.length,
          sample: registrations.slice(0, 3).map(r => ({ id: r.id, userId: r.userId, eventId: r.eventId }))
        },
        attendance: {
          total: attendance.length,
          sample: attendance.slice(0, 3).map(a => ({ id: a.id, userId: a.userId, eventId: a.eventId }))
        }
      };
      
      console.log("Debug info:", debugInfo);
      res.json(debugInfo);
    } catch (error) {
      console.error("Debug error:", error);
      res.status(500).json({ message: "Failed to fetch debug info", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Event routes
  app.get("/api/events", requireAuth, async (req, res) => {
    try {
      const { type, department } = req.query;
      let events;
      
      if (type) {
        events = await storage.getEventsByType(type as string);
      } else if (department) {
        events = await storage.getEventsByDepartment(department as string);
      } else {
        events = await storage.getActiveEvents();
      }
      
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.post("/api/events", requireAdmin, async (req, res) => {
    try {
      const eventData = insertEventSchema.parse(req.body);
      const event = await storage.createEvent({
        ...eventData,
        createdBy: req.user!.id
      });
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid event data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create event" });
      }
    }
  });

  app.put("/api/events/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const eventData = insertEventSchema.partial().parse(req.body);
      const event = await storage.updateEvent(id, eventData);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid event data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update event" });
      }
    }
  });

  app.delete("/api/events/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteEvent(id);
      
      if (!success) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json({ message: "Event deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete event" });
    }
  });

  // Photo upload for registration
  app.post("/api/registrations/upload-photo", requireAuth, photoUpload.single("photo"), async (req, res) => {
    try {
      console.log("Photo upload request received");
      console.log("Request body:", req.body);
      console.log("Request file:", req.file);
      console.log("Request headers:", req.headers);
      
      if (!req.file) {
        console.log("No file received in request");
        return res.status(400).json({ message: "No photo uploaded" });
      }

      const { registrationId } = req.body;
      if (!registrationId) {
        console.log("No registration ID provided");
        return res.status(400).json({ message: "Registration ID is required" });
      }

      console.log("Updating registration photo for ID:", registrationId);
      // Update registration with photo path
      const updatedRegistration = await storage.updateRegistrationPhoto(parseInt(registrationId), req.file.filename);
      
      if (!updatedRegistration) {
        console.log("Registration not found for ID:", registrationId);
        return res.status(404).json({ message: "Registration not found" });
      }

      console.log("Photo uploaded successfully:", req.file.filename);
      res.json({
        message: "Photo uploaded successfully",
        photoPath: req.file.filename,
        registration: updatedRegistration
      });
    } catch (error) {
      console.error("Photo upload error:", error);
      res.status(500).json({ message: "Failed to upload photo" });
    }
  });

  // Registration routes
  app.post("/api/registrations", requireAuth, async (req, res) => {
    console.log("Registration raw body:", req.body);
    try {
      const registrationData = insertRegistrationSchema.parse(req.body);
      // Check if already registered
      const existingRegistrations = await storage.getUserRegistrations(req.user!.id);
      const alreadyRegistered = existingRegistrations.find(r => r.eventId === registrationData.eventId);
      if (alreadyRegistered) {
        return res.status(400).json({ message: "Already registered for this event" });
      }
      // Fetch user and event details
      const user = await storage.getUser(req.user!.id);
      const event = await storage.getEvent(registrationData.eventId);
      if (!user || !event) {
        return res.status(400).json({ message: "User or event not found" });
      }
      // Generate QR code with detailed info
      const qrData = {
        userId: user.id,
        name: user.name,
        studentId: user.studentId,
        department: user.department,
        eventId: event.id,
        eventTitle: event.title,
        timestamp: Date.now(),
        token: randomBytes(16).toString('hex')
      };
      // const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));
      const qrCode = qrData.token; // Store only the short token in the DB
      // Validate backend registration object
      const backendRegistration = insertRegistrationBackendSchema.parse({
        ...registrationData,
        userId: user.id,
        qrCode: qrCode
      });
      const registration = await storage.createRegistration(backendRegistration);
      res.status(201).json(registration);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Zod validation error:", error.errors);
        return res.status(400).json({ message: "Invalid registration data", errors: error.errors });
      }
      // Add detailed error logging
      console.error("Registration error (raw):", error);
      if (error instanceof Error) {
        console.error("Registration error (stack):", error.stack);
      } else {
        try {
          console.error("Registration error (JSON):", JSON.stringify(error, null, 2));
        } catch {}
      }
      res.status(500).json({ message: "Failed to create registration" });
    }
  });

  app.get("/api/registrations", requireAuth, async (req, res) => {
    try {
      const registrations = await storage.getUserRegistrations(req.user!.id);
      res.json(registrations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch registrations" });
    }
  });

  app.get("/api/events/:id/registrations", requireAdmin, async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const registrations = await storage.getEventRegistrations(eventId);
      res.json(registrations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch event registrations" });
    }
  });

  // QR Code scanning
  app.post("/api/scan-qr", requireAdmin, async (req, res) => {
    try {
      const { qrCode, eventId } = req.body;
      
      console.log("QR Scan request:", { qrCode, eventId });
      
      if (!qrCode || !eventId) {
        return res.status(400).json({ message: "QR code and event ID are required" });
      }
      
      // Parse QR code data
      let qrData;
      try {
        qrData = JSON.parse(qrCode);
        console.log("Parsed QR data:", qrData);
      } catch (parseError) {
        console.error("QR parse error:", parseError);
        return res.status(400).json({ message: "Invalid QR code format" });
      }
      
      // Handle both token-based and full data QR codes
      let registration;
      if (qrData.token) {
        // Token-based QR code (new format)
        try {
          registration = await storage.getRegistrationByQRCode(qrData.token);
          console.log("Found registration by token:", registration);
        } catch (dbError) {
          console.error("Database error when fetching registration by QR code:", dbError);
          return res.status(500).json({ message: "Database error while fetching registration" });
        }
        
        if (!registration) {
          return res.status(404).json({ message: "Registration not found" });
        }
        
        // Validate event ID matches
        if (registration.eventId !== parseInt(eventId)) {
          return res.status(400).json({ message: "QR code is for a different event" });
        }
      } else {
        // Legacy format with full data
        if (!qrData.userId || !qrData.eventId || qrData.eventId !== parseInt(eventId)) {
          console.log("QR validation failed:", { 
            hasUserId: !!qrData.userId, 
            hasEventId: !!qrData.eventId, 
            qrEventId: qrData.eventId, 
            requestEventId: eventId,
            eventIdMatch: qrData.eventId === parseInt(eventId)
          });
          return res.status(400).json({ message: "Invalid QR code data" });
        }
        
        // Check if registration exists
        try {
          const registrations = await storage.getUserRegistrations(qrData.userId);
          console.log("User registrations:", registrations);
          registration = registrations.find(r => r.eventId === parseInt(eventId));
          console.log("Found registration:", registration);
        } catch (dbError) {
          console.error("Database error when fetching user registrations:", dbError);
          return res.status(500).json({ message: "Database error while fetching registrations" });
        }
      }
      
      if (!registration) {
        return res.status(404).json({ message: "Registration not found" });
      }
      
      // Check if already attended
      let existingAttendance;
      try {
        existingAttendance = await storage.getAttendanceByRegistration(registration.id);
        console.log("Existing attendance:", existingAttendance);
      } catch (dbError) {
        console.error("Database error when checking existing attendance:", dbError);
        return res.status(500).json({ message: "Database error while checking attendance" });
      }
      
      if (existingAttendance) {
        return res.status(400).json({ message: "Already marked as attended" });
      }
      
      // Mark attendance
      let attendance;
      try {
        attendance = await storage.createAttendance({
          userId: registration.userId,
          eventId: eventId,
          registrationId: registration.id,
          scannedBy: req.user!.id
        });
        console.log("Created attendance record:", attendance);
      } catch (dbError) {
        console.error("Database error when creating attendance:", dbError);
        return res.status(500).json({ message: "Database error while creating attendance" });
      }
      
      // Update registration status
      try {
        await storage.updateRegistrationStatus(registration.id, "attended");
        console.log("Updated registration status to attended");
      } catch (dbError) {
        console.error("Database error when updating registration status:", dbError);
        // Don't fail the request here, attendance was already marked
        console.warn("Warning: Attendance marked but failed to update registration status");
      }
      
      // Get user info for response
      let user;
      try {
        user = await storage.getUser(registration.userId);
        console.log("Retrieved user info:", user);
      } catch (dbError) {
        console.error("Database error when fetching user:", dbError);
        // Don't fail the request here, we can still return success
        user = null;
      }
      
      res.json({
        message: "Attendance marked successfully",
        user: user,
        attendance: attendance,
        registration: registration
      });
    } catch (error) {
      console.error("Unexpected error in QR scan:", error);
      console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
      res.status(500).json({ 
        message: "Failed to process QR scan",
        error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      });
    }
  });

  // Attendance routes
  app.get("/api/attendance", requireAdmin, async (req, res) => {
    try {
      const attendanceRecords = await storage.getAllAttendance();
      // Fetch user and event details for each record
      const enriched = await Promise.all(attendanceRecords.map(async (record) => {
        const user = await storage.getUser(record.userId);
        const event = await storage.getEvent(record.eventId);
        return {
          ...record,
          user,
          event,
        };
      }));
      res.json(enriched);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  app.get("/api/events/:id/attendance", requireAdmin, async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const attendanceRecords = await storage.getEventAttendance(eventId);
      // Fetch user and event details for each record
      const enriched = await Promise.all(attendanceRecords.map(async (record) => {
        const user = await storage.getUser(record.userId);
        const event = await storage.getEvent(record.eventId);
        return {
          ...record,
          user,
          event,
        };
      }));
      res.json(enriched);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  app.get("/api/attendance/export", requireAdmin, async (req, res) => {
    try {
      const { eventId } = req.query;
      let attendance: any[] = [];
      
      if (eventId) {
        // Export specific event attendance
        console.log("Export requested for eventId:", eventId);
        let raw = await storage.getEventAttendance(parseInt(eventId as string));
        console.log("Raw attendance records:", raw);
        attendance = await Promise.all(raw.map(async (record) => {
          const user = await storage.getUser(record.userId);
          const event = await storage.getEvent(record.eventId);
          return {
            Name: user?.name,
            StudentID: user?.studentId,
            Department: user?.department,
            Event: event?.title,
            CheckInTime: record.attendedAt,
            Status: "Attended"
          };
        }));
      } else {
        // Export all attendance
        console.log("Export requested for all attendance");
        let raw = await storage.getAllAttendance();
        console.log("Raw attendance records:", raw);
        attendance = await Promise.all(raw.map(async (record) => {
          const user = await storage.getUser(record.userId);
          const event = await storage.getEvent(record.eventId);
          return {
            Name: user?.name,
            StudentID: user?.studentId,
            Department: user?.department,
            Event: event?.title,
            CheckInTime: record.attendedAt,
            Status: "Attended"
          };
        }));
      }
      
      console.log("Exporting attendance:", attendance);
      // Create Excel workbook
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(attendance);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      const filename = eventId ? `attendance-${eventId}.xlsx` : "attendance-all.xlsx";
      res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
      res.send(buffer);
    } catch (error) {
      console.error("Export error:", error);
      res.status(500).json({ message: "Failed to export attendance" });
    }
  });

  // User management routes
  app.get("/api/users", requireAdmin, async (req, res) => {
    try {
      const { department } = req.query;
      let users;
      
      if (department) {
        users = await storage.getUsersByDepartment(department as string);
      } else {
        users = await storage.getAllUsers();
      }
      
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.put("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userData = req.body;
      
      const user = await storage.updateUser(id, userData);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteUser(id);
      
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Serve uploaded photos
  app.get("/api/photos/:filename", (req, res) => {
    try {
      const filename = req.params.filename;
      const photoPath = path.join(process.cwd(), "uploads", filename);
      
      if (!fs.existsSync(photoPath)) {
        return res.status(404).json({ message: "Photo not found" });
      }
      
      res.sendFile(photoPath);
    } catch (error) {
      res.status(500).json({ message: "Failed to serve photo" });
    }
  });

  // Hackathon file upload
  app.post("/api/hackathon/upload", requireAuth, upload.array("files"), async (req, res) => {
    try {
      const { registrationId } = req.body;
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }
      
      const submissions = [];
      
      for (const file of files) {
        const submission = await storage.createHackathonSubmission({
          registrationId: parseInt(registrationId),
          fileName: file.originalname,
          filePath: file.path,
          fileSize: file.size
        });
        submissions.push(submission);
      }
      
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to upload files" });
    }
  });

  // List submissions for an event (admin)
  app.get("/api/hackathon/events/:eventId/submissions", requireAdmin, async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const submissions = await storage.getSubmissionsByEvent(eventId);
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });

  // Mark qualifiers for a round (admin)
  app.post("/api/hackathon/events/:eventId/qualify", requireAdmin, async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const { roundName = "Round 2", qualifiers = [], scoreMap = {}, feedbackMap = {} } = req.body as any;
      // Ensure round exists
      const round = await storage.getOrCreateRoundByName(eventId, roundName);
      const created: any[] = [];
      for (const registrationId of qualifiers as number[]) {
        const result = await storage.createHackathonResult({
          roundId: round.id,
          registrationId,
          result: "qualified",
          score: typeof scoreMap?.[registrationId] === 'number' ? scoreMap[registrationId] : null,
          feedback: feedbackMap?.[registrationId] ?? null,
        } as any);
        created.push(result);
      }
      res.status(201).json({ round, results: created });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid payload", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to mark qualifiers" });
      }
    }
  });

  // Public endpoint: results for an event (students can view)
  app.get("/api/hackathon/events/:eventId/results", requireAuth, async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const results = await storage.getEventResults(eventId);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch event results" });
    }
  });

  // Hackathon rounds
  app.post("/api/hackathon/rounds", requireAdmin, async (req, res) => {
    try {
      const roundData = insertHackathonRoundSchema.parse(req.body);
      const round = await storage.createHackathonRound(roundData);
      res.status(201).json(round);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid round data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create round" });
      }
    }
  });

  app.get("/api/events/:id/rounds", requireAuth, async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const rounds = await storage.getEventRounds(eventId);
      res.json(rounds);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch rounds" });
    }
  });

  // Hackathon results
  app.post("/api/hackathon/results", requireAdmin, async (req, res) => {
    try {
      const resultData = insertHackathonResultSchema.parse(req.body);
      const result = await storage.createHackathonResult(resultData);
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid result data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create result" });
      }
    }
  });

  app.get("/api/rounds/:id/results", requireAuth, async (req, res) => {
    try {
      const roundId = parseInt(req.params.id);
      const results = await storage.getRoundResults(roundId);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch results" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
