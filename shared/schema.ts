import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  studentId: text("student_id").unique(),
  department: text("department"),
  section: text("section"),
  role: text("role").notNull().default("student"), // 'admin' or 'student'
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  eventType: text("event_type").notNull(), // 'college', 'department', 'hackathon'
  date: timestamp("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  venue: text("venue").notNull(),
  department: text("department"), // null for college events
  
  // Pre Event Works Fields
  preEventPosterPath: text("pre_event_poster_path"),
  preEventGuestDetails: text("pre_event_guest_details"),
  preEventAdditionalDetails: text("pre_event_additional_details"),
  
  // Post Event Works Fields
  postEventDetails: text("post_event_details"),
  postEventWinners: text("post_event_winners"),
  postEventStudentsBenefited: integer("post_event_students_benefited"),
  postEventPhotosPaths: jsonb("post_event_photos_paths"), // Store array of paths
  postEventVideoPath: text("post_event_video_path"),
  postEventSpecialMoments: text("post_event_special_moments"),
  
  isActive: boolean("is_active").notNull().default(true),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const registrations = pgTable("registrations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  eventId: integer("event_id").references(() => events.id).notNull(),
  qrCode: text("qr_code").notNull().unique(),
  status: text("status").notNull().default("registered"), // 'registered', 'attended'
  photoPath: text("photo_path"), // Path to uploaded student photo
  registeredAt: timestamp("registered_at").defaultNow().notNull(),
});

export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  eventId: integer("event_id").references(() => events.id).notNull(),
  registrationId: integer("registration_id").references(() => registrations.id).notNull(),
  attendedAt: timestamp("attended_at").defaultNow().notNull(),
  scannedBy: integer("scanned_by").references(() => users.id).notNull(),
});

export const hackathonSubmissions = pgTable("hackathon_submissions", {
  id: serial("id").primaryKey(),
  registrationId: integer("registration_id").references(() => registrations.id).notNull(),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const hackathonRounds = pgTable("hackathon_rounds", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => events.id).notNull(),
  roundName: text("round_name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const hackathonResults = pgTable("hackathon_results", {
  id: serial("id").primaryKey(),
  roundId: integer("round_id").references(() => hackathonRounds.id).notNull(),
  registrationId: integer("registration_id").references(() => registrations.id).notNull(),
  result: text("result").notNull(), // 'qualified', 'eliminated', 'winner'
  score: integer("score"),
  feedback: text("feedback"),
  publishedAt: timestamp("published_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  createdEvents: many(events),
  registrations: many(registrations),
  attendance: many(attendance),
  scannedAttendance: many(attendance),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  creator: one(users, { fields: [events.createdBy], references: [users.id] }),
  registrations: many(registrations),
  attendance: many(attendance),
  hackathonRounds: many(hackathonRounds),
}));

export const registrationsRelations = relations(registrations, ({ one, many }) => ({
  user: one(users, { fields: [registrations.userId], references: [users.id] }),
  event: one(events, { fields: [registrations.eventId], references: [events.id] }),
  attendance: many(attendance),
  submissions: many(hackathonSubmissions),
  results: many(hackathonResults),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  user: one(users, { fields: [attendance.userId], references: [users.id] }),
  event: one(events, { fields: [attendance.eventId], references: [events.id] }),
  registration: one(registrations, { fields: [attendance.registrationId], references: [registrations.id] }),
  scannedBy: one(users, { fields: [attendance.scannedBy], references: [users.id] }),
}));

export const hackathonSubmissionsRelations = relations(hackathonSubmissions, ({ one }) => ({
  registration: one(registrations, { fields: [hackathonSubmissions.registrationId], references: [registrations.id] }),
}));

export const hackathonRoundsRelations = relations(hackathonRounds, ({ one, many }) => ({
  event: one(events, { fields: [hackathonRounds.eventId], references: [events.id] }),
  results: many(hackathonResults),
}));

export const hackathonResultsRelations = relations(hackathonResults, ({ one }) => ({
  round: one(hackathonRounds, { fields: [hackathonResults.roundId], references: [hackathonRounds.id] }),
  registration: one(registrations, { fields: [hackathonResults.registrationId], references: [registrations.id] }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  createdBy: true,
}).extend({
  date: z.preprocess((arg) => {
    if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
    return arg;
  }, z.date()),
});

export const insertRegistrationSchema = createInsertSchema(registrations).omit({
  id: true,
  userId: true,
  registeredAt: true,
  qrCode: true,
  photoPath: true,
});

export const insertRegistrationBackendSchema = createInsertSchema(registrations).omit({
  id: true,
  registeredAt: true,
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({
  id: true,
  attendedAt: true,
});

export const insertHackathonSubmissionSchema = createInsertSchema(hackathonSubmissions).omit({
  id: true,
  uploadedAt: true,
});

export const insertHackathonRoundSchema = createInsertSchema(hackathonRounds).omit({
  id: true,
  createdAt: true,
});

export const insertHackathonResultSchema = createInsertSchema(hackathonResults).omit({
  id: true,
  publishedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Registration = typeof registrations.$inferSelect;
export type InsertRegistration = z.infer<typeof insertRegistrationSchema>;
export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type HackathonSubmission = typeof hackathonSubmissions.$inferSelect;
export type InsertHackathonSubmission = z.infer<typeof insertHackathonSubmissionSchema>;
export type HackathonRound = typeof hackathonRounds.$inferSelect;
export type InsertHackathonRound = z.infer<typeof insertHackathonRoundSchema>;
export type HackathonResult = typeof hackathonResults.$inferSelect;
export type InsertHackathonResult = z.infer<typeof insertHackathonResultSchema>;
