import { 
  users, events, registrations, attendance, hackathonSubmissions, 
  hackathonRounds, hackathonResults,
  type User, type InsertUser, type Event, type InsertEvent,
  type Registration, type InsertRegistration, type Attendance, type InsertAttendance,
  type HackathonSubmission, type InsertHackathonSubmission,
  type HackathonRound, type InsertHackathonRound,
  type HackathonResult, type InsertHackathonResult
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  sessionStore: session.Store;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByStudentId(studentId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  getUsersByDepartment(department: string): Promise<User[]>;
  
  // Event operations
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent & { createdBy: number }): Promise<Event>;
  updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;
  getAllEvents(): Promise<Event[]>;
  getEventsByType(eventType: string): Promise<Event[]>;
  getEventsByDepartment(department: string): Promise<Event[]>;
  getActiveEvents(): Promise<Event[]>;
  
  // Registration operations
  getRegistration(id: number): Promise<Registration | undefined>;
  createRegistration(registration: InsertRegistration & { qrCode: string }): Promise<Registration>;
  getUserRegistrations(userId: number): Promise<Registration[]>;
  getEventRegistrations(eventId: number): Promise<Registration[]>;
  getRegistrationByQRCode(qrCode: string): Promise<Registration | undefined>;
  updateRegistrationStatus(id: number, status: string): Promise<Registration | undefined>;
  
  // Attendance operations
  getAttendance(id: number): Promise<Attendance | undefined>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  getEventAttendance(eventId: number): Promise<Attendance[]>;
  getUserAttendance(userId: number): Promise<Attendance[]>;
  getAttendanceByRegistration(registrationId: number): Promise<Attendance | undefined>;
  
  // Hackathon operations
  createHackathonSubmission(submission: InsertHackathonSubmission): Promise<HackathonSubmission>;
  getSubmissionsByRegistration(registrationId: number): Promise<HackathonSubmission[]>;
  createHackathonRound(round: InsertHackathonRound): Promise<HackathonRound>;
  getEventRounds(eventId: number): Promise<HackathonRound[]>;
  createHackathonResult(result: InsertHackathonResult): Promise<HackathonResult>;
  getRoundResults(roundId: number): Promise<HackathonResult[]>;
  
  // Statistics
  getStats(): Promise<{
    totalStudents: number;
    totalEvents: number;
    totalRegistrations: number;
    totalAttendance: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByStudentId(studentId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.studentId, studentId));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updateUser: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(updateUser).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(asc(users.name));
  }

  async getUsersByDepartment(department: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.department, department));
  }

  // Event operations
  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event || undefined;
  }

  async createEvent(event: InsertEvent & { createdBy: number }): Promise<Event> {
    const [newEvent] = await db.insert(events).values(event).returning();
    return newEvent;
  }

  async updateEvent(id: number, updateEvent: Partial<InsertEvent>): Promise<Event | undefined> {
    const [event] = await db.update(events).set(updateEvent).where(eq(events.id, id)).returning();
    return event || undefined;
  }

  async deleteEvent(id: number): Promise<boolean> {
    const result = await db.delete(events).where(eq(events.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getAllEvents(): Promise<Event[]> {
    return await db.select().from(events).orderBy(desc(events.date));
  }

  async getEventsByType(eventType: string): Promise<Event[]> {
    return await db.select().from(events).where(eq(events.eventType, eventType)).orderBy(desc(events.date));
  }

  async getEventsByDepartment(department: string): Promise<Event[]> {
    return await db.select().from(events).where(eq(events.department, department)).orderBy(desc(events.date));
  }

  async getActiveEvents(): Promise<Event[]> {
    return await db.select().from(events).where(eq(events.isActive, true)).orderBy(desc(events.date));
  }

  // Registration operations
  async getRegistration(id: number): Promise<Registration | undefined> {
    const [registration] = await db.select().from(registrations).where(eq(registrations.id, id));
    return registration || undefined;
  }

  async createRegistration(registration: InsertRegistration & { qrCode: string }): Promise<Registration> {
    const [newRegistration] = await db.insert(registrations).values(registration).returning();
    return newRegistration;
  }

  async getUserRegistrations(userId: number): Promise<Registration[]> {
    return await db.select().from(registrations).where(eq(registrations.userId, userId));
  }

  async getEventRegistrations(eventId: number): Promise<Registration[]> {
    return await db.select().from(registrations).where(eq(registrations.eventId, eventId));
  }

  async getRegistrationByQRCode(qrCode: string): Promise<Registration | undefined> {
    const [registration] = await db.select().from(registrations).where(eq(registrations.qrCode, qrCode));
    return registration || undefined;
  }

  async updateRegistrationStatus(id: number, status: string): Promise<Registration | undefined> {
    const [registration] = await db.update(registrations).set({ status }).where(eq(registrations.id, id)).returning();
    return registration || undefined;
  }

  // Attendance operations
  async getAttendance(id: number): Promise<Attendance | undefined> {
    const [attendanceRecord] = await db.select().from(attendance).where(eq(attendance.id, id));
    return attendanceRecord || undefined;
  }

  async createAttendance(attendanceData: InsertAttendance): Promise<Attendance> {
    const [newAttendance] = await db.insert(attendance).values(attendanceData).returning();
    return newAttendance;
  }

  async getEventAttendance(eventId: number): Promise<Attendance[]> {
    return await db.select().from(attendance).where(eq(attendance.eventId, eventId));
  }

  async getUserAttendance(userId: number): Promise<Attendance[]> {
    return await db.select().from(attendance).where(eq(attendance.userId, userId));
  }

  async getAttendanceByRegistration(registrationId: number): Promise<Attendance | undefined> {
    const [attendanceRecord] = await db.select().from(attendance).where(eq(attendance.registrationId, registrationId));
    return attendanceRecord || undefined;
  }

  // Hackathon operations
  async createHackathonSubmission(submission: InsertHackathonSubmission): Promise<HackathonSubmission> {
    const [newSubmission] = await db.insert(hackathonSubmissions).values(submission).returning();
    return newSubmission;
  }

  async getSubmissionsByRegistration(registrationId: number): Promise<HackathonSubmission[]> {
    return await db.select().from(hackathonSubmissions).where(eq(hackathonSubmissions.registrationId, registrationId));
  }

  async createHackathonRound(round: InsertHackathonRound): Promise<HackathonRound> {
    const [newRound] = await db.insert(hackathonRounds).values(round).returning();
    return newRound;
  }

  async getEventRounds(eventId: number): Promise<HackathonRound[]> {
    return await db.select().from(hackathonRounds).where(eq(hackathonRounds.eventId, eventId));
  }

  async createHackathonResult(result: InsertHackathonResult): Promise<HackathonResult> {
    const [newResult] = await db.insert(hackathonResults).values(result).returning();
    return newResult;
  }

  async getRoundResults(roundId: number): Promise<HackathonResult[]> {
    return await db.select().from(hackathonResults).where(eq(hackathonResults.roundId, roundId));
  }

  // Statistics
  async getStats(): Promise<{
    totalStudents: number;
    totalEvents: number;
    totalRegistrations: number;
    totalAttendance: number;
  }> {
    const [studentsCount] = await db.select({ count: users.id }).from(users).where(eq(users.role, "student"));
    const [eventsCount] = await db.select({ count: events.id }).from(events);
    const [registrationsCount] = await db.select({ count: registrations.id }).from(registrations);
    const [attendanceCount] = await db.select({ count: attendance.id }).from(attendance);

    return {
      totalStudents: studentsCount?.count || 0,
      totalEvents: eventsCount?.count || 0,
      totalRegistrations: registrationsCount?.count || 0,
      totalAttendance: attendanceCount?.count || 0,
    };
  }
}

export const storage = new DatabaseStorage();
