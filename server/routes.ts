import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertEventSchema, insertRegistrationSchema, insertAttendanceSchema, insertHackathonSubmissionSchema, insertHackathonRoundSchema, insertHackathonResultSchema } from "@shared/schema";
import { z } from "zod";
import QRCode from "qrcode";
import multer from "multer";
import path from "path";
import fs from "fs";
import { randomBytes } from "crypto";
import * as XLSX from "xlsx";

// File upload configuration
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

function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
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
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
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
        createdBy: req.user.id
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

  // Registration routes
  app.post("/api/registrations", requireAuth, async (req, res) => {
    try {
      const registrationData = insertRegistrationSchema.parse(req.body);
      
      // Check if already registered
      const existingRegistrations = await storage.getUserRegistrations(req.user.id);
      const alreadyRegistered = existingRegistrations.find(r => r.eventId === registrationData.eventId);
      
      if (alreadyRegistered) {
        return res.status(400).json({ message: "Already registered for this event" });
      }
      
      // Generate QR code
      const qrData = {
        userId: req.user.id,
        eventId: registrationData.eventId,
        timestamp: Date.now(),
        token: randomBytes(16).toString('hex')
      };
      
      const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));
      
      const registration = await storage.createRegistration({
        ...registrationData,
        userId: req.user.id,
        qrCode: qrCode
      });
      
      res.status(201).json(registration);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid registration data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create registration" });
      }
    }
  });

  app.get("/api/registrations", requireAuth, async (req, res) => {
    try {
      const registrations = await storage.getUserRegistrations(req.user.id);
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
      
      if (!qrCode || !eventId) {
        return res.status(400).json({ message: "QR code and event ID are required" });
      }
      
      // Parse QR code data
      let qrData;
      try {
        qrData = JSON.parse(qrCode);
      } catch {
        return res.status(400).json({ message: "Invalid QR code format" });
      }
      
      // Validate QR code data
      if (!qrData.userId || !qrData.eventId || qrData.eventId !== eventId) {
        return res.status(400).json({ message: "Invalid QR code data" });
      }
      
      // Check if registration exists
      const registrations = await storage.getUserRegistrations(qrData.userId);
      const registration = registrations.find(r => r.eventId === eventId);
      
      if (!registration) {
        return res.status(404).json({ message: "Registration not found" });
      }
      
      // Check if already attended
      const existingAttendance = await storage.getAttendanceByRegistration(registration.id);
      if (existingAttendance) {
        return res.status(400).json({ message: "Already marked as attended" });
      }
      
      // Mark attendance
      const attendance = await storage.createAttendance({
        userId: qrData.userId,
        eventId: eventId,
        registrationId: registration.id,
        scannedBy: req.user.id
      });
      
      // Update registration status
      await storage.updateRegistrationStatus(registration.id, "attended");
      
      // Get user info for response
      const user = await storage.getUser(qrData.userId);
      
      res.json({
        message: "Attendance marked successfully",
        user: user,
        attendance: attendance
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to process QR scan" });
    }
  });

  // Attendance routes
  app.get("/api/events/:id/attendance", requireAdmin, async (req, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const attendance = await storage.getEventAttendance(eventId);
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  app.get("/api/attendance/export", requireAdmin, async (req, res) => {
    try {
      const { eventId } = req.query;
      
      let attendance;
      if (eventId) {
        attendance = await storage.getEventAttendance(parseInt(eventId as string));
      } else {
        // Get all attendance - this would need to be implemented in storage
        attendance = [];
      }
      
      // Create Excel workbook
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(attendance);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
      
      // Generate buffer
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", "attachment; filename=attendance.xlsx");
      res.send(buffer);
    } catch (error) {
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
