const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const filePath = "./server/events.json";

// Read events
function readEvents() {
  const data = fs.readFileSync(filePath);
  return JSON.parse(data);
}

// Write events
function writeEvents(events) {
  fs.writeFileSync(filePath, JSON.stringify(events, null, 2));
}

// Create Event
app.post("/events", (req, res) => {
  const events = readEvents();
  const newEvent = req.body;

  const conflict = events.find(e =>
    e.venue === newEvent.venue &&
    newEvent.startTime < e.endTime &&
    newEvent.endTime > e.startTime
  );

  if (conflict) {
    return res.json({ message: "Time slot already booked!" });
  }

  newEvent.id = Date.now();
  newEvent.status = "PENDING";

  events.push(newEvent);
  writeEvents(events);

  res.json({ message: "Event sent to Chairman for approval" });
});

// Get pending events
app.get("/chairman/events", (req, res) => {
  const events = readEvents();
  const pending = events.filter(e => e.status === "PENDING");
  res.json(pending);
});

// Approve event
app.patch("/chairman/events/:id/approve", (req, res) => {
  const events = readEvents();
  const event = events.find(e => e.id == req.params.id);

  if (event) {
    event.status = "APPROVED";
  }

  writeEvents(events);
  res.json({ message: "Event Approved" });
});

// Reject event
app.patch("/chairman/events/:id/reject", (req, res) => {
  const events = readEvents();
  const event = events.find(e => e.id == req.params.id);

  if (event) {
    event.status = "REJECTED";
  }

  writeEvents(events);
  res.json({ message: "Event Rejected" });
});

app.listen(5000, () => console.log("Server running on port 5000"));
