import { 
  users, events, registrations, attendance, hackathonSubmissions, 
  hackathonRounds, hackathonResults,
  type User, type InsertUser, type Event, type InsertEvent,
  type Registration, type InsertRegistration, type Attendance, type InsertAttendance,
  type HackathonSubmission, type InsertHackathonSubmission,
  type HackathonRound, type InsertHackathonRound,
  type HackathonResult, type InsertHackathonResult,
  mentorshipRequests, type MentorshipRequest, type InsertMentorshipRequest
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, count } from "drizzle-orm";
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
  createRegistration(registration: InsertRegistration & { qrCode: string; userId: number }): Promise<Registration>;
  getUserRegistrations(userId: number): Promise<Registration[]>;
  getEventRegistrations(eventId: number): Promise<Registration[]>;
  getRegistrationByQRCode(qrCode: string): Promise<Registration | undefined>;
  updateRegistrationStatus(id: number, status: string): Promise<Registration | undefined>;
  updateRegistrationPhoto(id: number, photoPath: string): Promise<Registration | undefined>;
  getAllRegistrations(): Promise<Registration[]>;
  
  // Attendance operations
  getAttendance(id: number): Promise<Attendance | undefined>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  getEventAttendance(eventId: number): Promise<Attendance[]>;
  getUserAttendance(userId: number): Promise<Attendance[]>;
  getAttendanceByRegistration(registrationId: number): Promise<Attendance | undefined>;
  getAllAttendance(): Promise<Attendance[]>;
  
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

  // Advanced features
  getEdaStats(): Promise<any>;
  createMentorshipRequest(mentorship: Pick<InsertMentorshipRequest, "mentorId" | "menteeId" | "message">): Promise<MentorshipRequest>;
  getMentors(): Promise<User[]>;
  getRecommendations(userId: number): Promise<Event[]>;
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

  async createRegistration(registration: InsertRegistration & { qrCode: string; userId: number }): Promise<Registration> {
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
    try {
      console.log("Searching for registration with QR code:", qrCode);
      const [registration] = await db.select().from(registrations).where(eq(registrations.qrCode, qrCode));
      console.log("Found registration:", registration);
      return registration || undefined;
    } catch (error) {
      console.error("Error in getRegistrationByQRCode:", error);
      throw error;
    }
  }

  async updateRegistrationStatus(id: number, status: string): Promise<Registration | undefined> {
    const [registration] = await db.update(registrations).set({ status }).where(eq(registrations.id, id)).returning();
    return registration || undefined;
  }

  async updateRegistrationPhoto(id: number, photoPath: string): Promise<Registration | undefined> {
    const [registration] = await db.update(registrations).set({ photoPath }).where(eq(registrations.id, id)).returning();
    return registration || undefined;
  }

  async getAllRegistrations(): Promise<Registration[]> {
    return await db.select().from(registrations);
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

  async getAllAttendance(): Promise<Attendance[]> {
    return await db.select().from(attendance);
  }

  // Hackathon operations
  async createHackathonSubmission(submission: InsertHackathonSubmission): Promise<HackathonSubmission> {
    const [newSubmission] = await db.insert(hackathonSubmissions).values(submission).returning();
    return newSubmission;
  }

  async getSubmissionsByRegistration(registrationId: number): Promise<HackathonSubmission[]> {
    return await db.select().from(hackathonSubmissions).where(eq(hackathonSubmissions.registrationId, registrationId));
  }

  async getSubmissionsByEvent(eventId: number): Promise<(HackathonSubmission & { registration: Registration; user: User })[]> {
    // Join submissions -> registrations -> users filtered by event
    const rows = await db
      .select()
      .from(hackathonSubmissions)
      .innerJoin(registrations, eq(hackathonSubmissions.registrationId, registrations.id))
      .innerJoin(users, eq(registrations.userId, users.id))
      .where(eq(registrations.eventId, eventId));
    // drizzle returns composite rows; normalize shape
    return rows.map((r: any) => ({
      ...r.hackathon_submissions,
      registration: r.registrations,
      user: r.users,
    }));
  }

  async createHackathonRound(round: InsertHackathonRound): Promise<HackathonRound> {
    const [newRound] = await db.insert(hackathonRounds).values(round).returning();
    return newRound;
  }

  async getEventRounds(eventId: number): Promise<HackathonRound[]> {
    return await db.select().from(hackathonRounds).where(eq(hackathonRounds.eventId, eventId));
  }

  async getOrCreateRoundByName(eventId: number, roundName: string): Promise<HackathonRound> {
    const existing = await db.select().from(hackathonRounds).where(eq(hackathonRounds.eventId, eventId));
    const found = existing.find(r => r.roundName.toLowerCase() === roundName.toLowerCase());
    if (found) return found;
    const [created] = await db.insert(hackathonRounds).values({ eventId, roundName, description: roundName }).returning();
    return created;
  }

  async createHackathonResult(result: InsertHackathonResult): Promise<HackathonResult> {
    const [newResult] = await db.insert(hackathonResults).values(result).returning();
    
    if (result.result === 'winner') {
      const [reg] = await db.select().from(registrations).where(eq(registrations.id, result.registrationId));
      if (reg) {
        await this.updateUser(reg.userId, { isMentor: true });
      }
    }
    
    return newResult;
  }

  async getRoundResults(roundId: number): Promise<HackathonResult[]> {
    return await db.select().from(hackathonResults).where(eq(hackathonResults.roundId, roundId));
  }

  async getEventResults(eventId: number): Promise<(HackathonResult & { round: HackathonRound })[]> {
    // Fetch all rounds for the event and their results
    const rounds = await this.getEventRounds(eventId);
    if (rounds.length === 0) return [];
    const all: (HackathonResult & { round: HackathonRound })[] = [] as any;
    for (const rnd of rounds) {
      const results = await this.getRoundResults(rnd.id);
      for (const res of results) {
        all.push({ ...(res as any), round: rnd });
      }
    }
    return all;
  }

  // Statistics
  async getStats(): Promise<{
    totalStudents: number;
    totalEvents: number;
    totalRegistrations: number;
    totalAttendance: number;
  }> {
    console.log("Getting stats from database...");
    
    try {
      // Get all users first to debug
      const allUsers = await db.select().from(users);
      console.log("All users in database:", allUsers.length);
      console.log("Users with role 'student':", allUsers.filter(u => u.role === "student").length);
      
      // Get all events to debug
      const allEvents = await db.select().from(events);
      console.log("All events in database:", allEvents.length);
      
      // Get all registrations to debug
      const allRegistrations = await db.select().from(registrations);
      console.log("All registrations in database:", allRegistrations.length);
      
      // Get all attendance to debug
      const allAttendance = await db.select().from(attendance);
      console.log("All attendance in database:", allAttendance.length);
      
      // Now do the count queries
      const [studentsCount] = await db.select({ count: count() }).from(users).where(eq(users.role, "student"));
      console.log("Students count query result:", studentsCount);
      
      const [eventsCount] = await db.select({ count: count() }).from(events);
      console.log("Events count query result:", eventsCount);
      
      const [registrationsCount] = await db.select({ count: count() }).from(registrations);
      console.log("Registrations count query result:", registrationsCount);
      
      const [attendanceCount] = await db.select({ count: count() }).from(attendance);
      console.log("Attendance count query result:", attendanceCount);

      const result = {
        totalStudents: studentsCount?.count || 0,
        totalEvents: eventsCount?.count || 0,
        totalRegistrations: registrationsCount?.count || 0,
        totalAttendance: attendanceCount?.count || 0,
      };
      
      console.log("Final stats result:", result);
      return result;
    } catch (error) {
      console.error("Error in getStats:", error);
      throw error;
    }
  }

  // Advanced features implementation
  async getEdaStats(): Promise<any> {
    const usersAll = await db.select().from(users);
    const eventsAll = await db.select().from(events);
    const submissionsAll = await db.select().from(hackathonSubmissions);
    
    return {
      totalSubmissions: submissionsAll.length,
      registrationsByDepartment: usersAll.reduce((acc, user) => {
        if(user.department) acc[user.department] = (acc[user.department] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      eventsByType: eventsAll.reduce((acc, event) => {
        acc[event.eventType] = (acc[event.eventType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      mentorsCount: usersAll.filter(u => u.isMentor).length
    };
  }

  async createMentorshipRequest(mentorship: Pick<InsertMentorshipRequest, "mentorId" | "menteeId" | "message">): Promise<MentorshipRequest> {
    const [newReq] = await db.insert(mentorshipRequests).values({
      ...mentorship,
      status: "pending"
    } as any).returning();
    return newReq;
  }

  async getMentors(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.isMentor, true));
  }

  async getRecommendations(userId: number): Promise<Event[]> {
    const allEvents = await this.getActiveEvents();
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    const userInterests = Array.isArray(user?.interests) ? user.interests : [];
    
    if (!userInterests || userInterests.length === 0) return allEvents;

    return allEvents.sort((a, b) => {
      const aTags = Array.isArray(a.tags) ? a.tags as string[] : [];
      const bTags = Array.isArray(b.tags) ? b.tags as string[] : [];
      
      const aMatches = aTags.filter(tag => userInterests.includes(tag)).length;
      const bMatches = bTags.filter(tag => userInterests.includes(tag)).length;
      
      return bMatches - aMatches;
    });
  }
}

export const storage = new DatabaseStorage();
