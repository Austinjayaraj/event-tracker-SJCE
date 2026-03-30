import React, { useState, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEventSchema } from "@shared/schema";
import { z } from "zod";
import { 
  GraduationCap, 
  Users, 
  Calendar, 
  QrCode, 
  Trophy, 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  Bell,
  ChevronDown,
  User,
  Camera,
  Check
} from "lucide-react";
import { QrReader } from 'react-qr-reader';
import { PhotoVerificationModal } from '@/components/photo-verification-modal';

// Remove the custom eventFormSchema and use insertEventSchema directly
// const eventFormSchema = insertEventSchema.extend({
//   date: z.preprocess((arg) => {
//     if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
//   }, z.date()),
// });

type EventForm = z.infer<typeof insertEventSchema>;

export default function AdminDashboard() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  
  // Filter state variables
  const [filterEvent, setFilterEvent] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<string>("");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("attendedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filteredAttendance, setFilteredAttendance] = useState<any[]>([]);

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ["/api/stats"],
    refetchInterval: 5000, // Refetch every 5 seconds
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/stats");
      const data = await res.json();
      console.log("Fetched stats data:", data);
      return data;
    },
  });

  // Fetch events
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ["/api/events"],
  });

  // Fetch users
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  // Attendance fetching
  const { data: attendance, isLoading: attendanceLoading } = useQuery({
    queryKey: ["/api/attendance"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/attendance`);
      const data = await res.json();
      console.log("Fetched attendance data:", data);
      return data;
    },
  });

  // Fix stats type errors by providing default values and type guards
  const safeStats = stats || {};
  const safeEvents = Array.isArray(events) ? events : [];
  const safeUsers = Array.isArray(users) ? users : [];

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (data: EventForm) => {
      const response = await apiRequest("POST", "/api/events", {
        ...data,
        date: data.date, // send as string
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setCreateEventOpen(false);
      toast({
        title: "Success",
        description: "Event created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        //variant: "destructive",
      });
    },
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: number) => {
      await apiRequest("DELETE", `/api/events/${eventId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // QR scan mutation
  const qrScanMutation = useMutation({
    mutationFn: async ({ qrCode, eventId }: { qrCode: string; eventId: number }) => {
      const response = await apiRequest("POST", "/api/scan-qr", { qrCode, eventId });
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      // Invalidate attendance records
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      
      // Debug: Log the scan result
      console.log("QR Scan result:", data);
      
      // Show photo verification modal
      setScanResult(data);
      setVerificationModalOpen(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const eventForm = useForm<EventForm>({
    resolver: zodResolver(insertEventSchema),
    defaultValues: {
      title: "",
      description: "",
      eventType: "",
      date: undefined,
      startTime: "",
      endTime: "",
      venue: "",
      department: "",
    },
  });

  const handleCreateEvent = (data: EventForm) => {
    createEventMutation.mutate(data);
  };

  const handleDeleteEvent = (eventId: number) => {
    if (confirm("Are you sure you want to delete this event?")) {
      deleteEventMutation.mutate(eventId);
    }
  };

  const handleExportAttendance = async () => {
    try {
      // Export the currently filtered and sorted data
      const exportData = filteredAttendance.map((record: any) => ({
        Name: record.user?.name || record.userId,
        StudentID: record.user?.studentId || '',
        Department: record.user?.department || '',
        Event: record.event?.title || record.eventId,
        CheckInTime: record.attendedAt ? new Date(record.attendedAt).toLocaleString() : '',
        Status: "Attended"
      }));

      // Create Excel workbook
      const XLSX = await import('xlsx');
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths
      const columnWidths = [
        { wch: 20 }, // Name
        { wch: 15 }, // StudentID
        { wch: 15 }, // Department
        { wch: 25 }, // Event
        { wch: 20 }, // CheckInTime
        { wch: 10 }  // Status
      ];
      worksheet['!cols'] = columnWidths;
      
      XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
      
      // Generate filename based on filters
      let filename = "attendance";
      if (filterEvent !== "all") {
        const event = safeEvents.find((e: any) => e.id.toString() === filterEvent);
        filename += `-${event?.title?.replace(/[^a-zA-Z0-9]/g, '_') || filterEvent}`;
      }
      if (filterDepartment !== "all") {
        filename += `-${filterDepartment.replace(/[^a-zA-Z0-9]/g, '_')}`;
      }
      if (filterDate) {
        filename += `-${filterDate}`;
      }
      filename += `.xlsx`;
      
      // Download the file
      const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: `Attendance data exported successfully (${exportData.length} records)`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Error",
        description: "Failed to export attendance data",
        variant: "destructive",
      });
    }
  };

  // Filter attendance function
  const handleFilterAttendance = useCallback(() => {
    if (!attendance) {
      console.log("No attendance data available for filtering");
      return;
    }
    
    console.log("Filtering attendance with:", { filterEvent, filterDate, filterDepartment, sortBy, sortOrder, totalRecords: attendance.length });
    
    let filtered = [...attendance];
    
    // Filter by event
    if (filterEvent !== "all") {
      const beforeEventFilter = filtered.length;
      filtered = filtered.filter((record: any) => 
        record.eventId?.toString() === filterEvent || 
        record.event?.id?.toString() === filterEvent
      );
      console.log(`Event filter: ${beforeEventFilter} -> ${filtered.length} records`);
    }
    
    // Filter by date
    if (filterDate) {
      const beforeDateFilter = filtered.length;
      const filterDateObj = new Date(filterDate);
      filterDateObj.setHours(0, 0, 0, 0);
      
      filtered = filtered.filter((record: any) => {
        if (!record.attendedAt) return false;
        const recordDate = new Date(record.attendedAt);
        recordDate.setHours(0, 0, 0, 0);
        return recordDate.getTime() === filterDateObj.getTime();
      });
      console.log(`Date filter: ${beforeDateFilter} -> ${filtered.length} records`);
    }
    
    // Filter by department
    if (filterDepartment !== "all") {
      const beforeDeptFilter = filtered.length;
      filtered = filtered.filter((record: any) => 
        record.user?.department === filterDepartment
      );
      console.log(`Department filter: ${beforeDeptFilter} -> ${filtered.length} records`);
    }
    
    // Sort the filtered results
    filtered.sort((a: any, b: any) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case "name":
          aValue = a.user?.name || "";
          bValue = b.user?.name || "";
          break;
        case "studentId":
          aValue = a.user?.studentId || "";
          bValue = b.user?.studentId || "";
          break;
        case "department":
          aValue = a.user?.department || "";
          bValue = b.user?.department || "";
          break;
        case "event":
          aValue = a.event?.title || "";
          bValue = b.event?.title || "";
          break;
        case "attendedAt":
        default:
          aValue = new Date(a.attendedAt || 0);
          bValue = new Date(b.attendedAt || 0);
          break;
      }
      
      if (sortBy === "attendedAt") {
        return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
      } else {
        if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
        if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
        return 0;
      }
    });
    
    console.log(`Final filtered and sorted result: ${filtered.length} records`);
    setFilteredAttendance(filtered);
  }, [attendance, filterEvent, filterDate, filterDepartment, sortBy, sortOrder]);

  // Apply filters when attendance data changes
  React.useEffect(() => {
    if (attendance) {
      handleFilterAttendance();
    }
  }, [attendance, filterEvent, filterDate, filterDepartment, sortBy, sortOrder, handleFilterAttendance]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-xl border-b-2 border-blue-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg">
                  <GraduationCap className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">St. Joseph's College</h1>
                  <p className="text-sm text-gray-600 font-medium">Admin Dashboard - Attendance Management</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="relative">
                <Button variant="ghost" size="sm" className="relative p-3 hover:bg-blue-50 rounded-full">
                  <Bell className="h-6 w-6 text-gray-600" />
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                    3
                  </span>
                </Button>
              </div>
              
              <div className="flex items-center space-x-3 bg-gray-50 rounded-xl px-4 py-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-600 font-medium">Admin • {user?.department}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => logoutMutation.mutate()}
                  className="text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg px-3 py-2"
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="qr-scan">QR Scan</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Users className="text-blue-600 h-6 w-6" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Students</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {statsLoading ? "..." : safeStats.totalStudents || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Calendar className="text-green-600 h-6 w-6" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Events</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {statsLoading ? "..." : safeStats.totalEvents || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-yellow-100 rounded-lg">
                      <QrCode className="text-yellow-600 h-6 w-6" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Registrations</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {statsLoading ? "..." : safeStats.totalRegistrations || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Trophy className="text-purple-600 h-6 w-6" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Attendance</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {statsLoading ? "..." : safeStats.totalAttendance || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Events */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {eventsLoading ? (
                      <p>Loading events...</p>
                    ) : (
                      safeEvents.slice(0, 3).map((event: any) => (
                        <div key={event.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                              <Calendar className="text-blue-600" />
                            </div>
                            <div className="ml-4">
                              <p className="font-medium text-gray-900">{event.title}</p>
                              <p className="text-sm text-gray-600">
                                {new Date(event.date).toLocaleDateString()} • {event.venue}
                              </p>
                            </div>
                          </div>
                          <Badge variant={event.isActive ? "default" : "secondary"}>
                            {event.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Department Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {["CSE", "ECE", "EEE", "MECH", "CIVIL", "IT", "BIO TECH", "ADS", "AML", "CYBER", "EIE", "CHEM", "MBA", "ME"].map((dept) => {
                      const count = safeUsers.filter((user: any) => user.role === "student" && user.department === dept).length;
                      return (
                        <div key={dept} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">{dept}</span>
                            </div>
                            <span className="ml-3 text-sm font-medium text-gray-900">{dept}</span>
                          </div>
                          <span className="text-sm font-bold text-gray-900">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="students" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Student Management</CardTitle>
                  <Button className="bg-college-blue hover:bg-college-dark">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Student
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex space-x-4">
                  <Input placeholder="Search students..." className="flex-1" />
                  <Select>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="All Departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      <SelectItem value="CSE">CSE</SelectItem>
                      <SelectItem value="ECE">ECE</SelectItem>
                      <SelectItem value="EEE">EEE</SelectItem>
                      <SelectItem value="MECH">MECH</SelectItem>
                      <SelectItem value="CIVIL">CIVIL</SelectItem>
                      <SelectItem value="IT">IT</SelectItem>
                      <SelectItem value="BIO TECH">BIO TECH</SelectItem>
                      <SelectItem value="ADS">ADS</SelectItem>
                      <SelectItem value="AML">AML</SelectItem>
                      <SelectItem value="CYBER">CYBER</SelectItem>
                      <SelectItem value="EIE">EIE</SelectItem>
                      <SelectItem value="CHEM">CHEM</SelectItem>
                      <SelectItem value="MBA">MBA</SelectItem>
                      <SelectItem value="ME">ME</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={() => handleExportAttendance()}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>ID</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Section</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center">Loading...</TableCell>
                        </TableRow>
                      ) : (
                        safeUsers.filter((user: any) => user.role === "student").map((user: any) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                  <User className="text-gray-600" />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{user.studentId}</TableCell>
                            <TableCell>{user.department}</TableCell>
                            <TableCell>{user.section}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Badge variant={user.isActive ? "default" : "secondary"}>
                                {user.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button size="sm" variant="ghost">
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="ghost">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Event Management</CardTitle>
                  <Dialog open={createEventOpen} onOpenChange={setCreateEventOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-black hover:bg-college-dark">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Event
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Event</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={eventForm.handleSubmit(handleCreateEvent)} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="title">Title</Label>
                          <Input
                            id="title"
                            {...eventForm.register("title")}
                            placeholder="Event title"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            {...eventForm.register("description")}
                            placeholder="Event description"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="eventType">Event Type</Label>
                          <Select onValueChange={(value) => eventForm.setValue("eventType", value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select event type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="college">College Event</SelectItem>
                              <SelectItem value="department">Department Event</SelectItem>
                              <SelectItem value="hackathon">Hackathon</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="date">Date</Label>
                            <Input
                              id="date"
                              type="date"
                              {...eventForm.register("date")}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="venue">Venue</Label>
                            <Input
                              id="venue"
                              {...eventForm.register("venue")}
                              placeholder="Event venue"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="startTime">Start Time</Label>
                            <Input
                              id="startTime"
                              type="time"
                              {...eventForm.register("startTime")}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="endTime">End Time</Label>
                            <Input
                              id="endTime"
                              type="time"
                              {...eventForm.register("endTime")}
                            />
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setCreateEventOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" disabled={createEventMutation.isPending}>
                            {createEventMutation.isPending ? "Creating..." : "Create Event"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {eventsLoading ? (
                    <div className="col-span-full text-center">Loading events...</div>
                  ) : (
                    safeEvents.map((event: any) => (
                      <Card key={event.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                              <Calendar className="text-blue-600" />
                            </div>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="ghost">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteEvent(event.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">{event.title}</h4>
                          <p className="text-sm text-gray-600 mb-4">{event.description}</p>
                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-2" />
                              <span>{new Date(event.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="w-4 h-4 mr-2">🕐</span>
                              <span>{event.startTime} - {event.endTime}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="w-4 h-4 mr-2">📍</span>
                              <span>{event.venue}</span>
                            </div>
                          </div>
                          <div className="mt-4 flex items-center justify-between">
                            <Badge variant={event.isActive ? "default" : "secondary"}>
                              {event.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Badge variant="outline">{event.eventType}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Attendance Records</CardTitle>
                  <Button variant="outline" onClick={handleExportAttendance}>
                    <Download className="w-4 h-4 mr-2" />
                    Export to Excel
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 space-y-4">
                  <div className="flex flex-wrap gap-4">
                    <Select onValueChange={value => setFilterEvent(value)} value={filterEvent}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="All Events" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Events</SelectItem>
                        {safeEvents.map((event: any) => (
                          <SelectItem key={event.id} value={event.id.toString()}>
                            {event.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select onValueChange={value => setFilterDepartment(value)} value={filterDepartment}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="All Departments" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {["CSE", "ECE", "EEE", "MECH", "CIVIL", "IT", "BIO TECH", "ADS", "AML", "CYBER", "EIE", "CHEM", "MBA", "ME"].map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Input 
                      type="date" 
                      className="w-48" 
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex flex-wrap gap-4">
                    <Select onValueChange={value => setSortBy(value)} value={sortBy}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="attendedAt">Check-in Time</SelectItem>
                        <SelectItem value="name">Student Name</SelectItem>
                        <SelectItem value="studentId">Student ID</SelectItem>
                        <SelectItem value="department">Department</SelectItem>
                        <SelectItem value="event">Event</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select onValueChange={value => setSortOrder(value as "asc" | "desc")} value={sortOrder}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Order" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">Ascending</SelectItem>
                        <SelectItem value="desc">Descending</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button 
                      className="bg-black hover:bg-gray-900 text-white"
                      onClick={handleFilterAttendance}
                    >
                      Apply Filters
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setFilterEvent("all");
                        setFilterDate("");
                        setFilterDepartment("all");
                        setSortBy("attendedAt");
                        setSortOrder("desc");
                      }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
                <div className="mb-4 text-sm text-gray-600">
                  Showing {filteredAttendance.length} of {attendance?.length || 0} attendance records
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Student ID</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead>Check-in Time</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center">Loading...</TableCell>
                        </TableRow>
                      ) : filteredAttendance && filteredAttendance.length > 0 ? (
                        filteredAttendance.map((record: any) => (
                          <TableRow key={record.id}>
                            <TableCell>{record.user?.name || record.userId}</TableCell>
                            <TableCell>{record.user?.studentId || ''}</TableCell>
                            <TableCell>{record.user?.department || ''}</TableCell>
                            <TableCell>{record.event?.title || record.eventId}</TableCell>
                            <TableCell>{record.attendedAt ? new Date(record.attendedAt).toLocaleString() : ''}</TableCell>
                            <TableCell>
                              <span className="inline-block px-2 py-1 rounded bg-blue-500 text-white text-xs">Attended</span>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center">No attendance records found</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="qr-scan" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>QR Code Scanner</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <div className="mb-4">
                      <Label htmlFor="event-select">Select Event</Label>
                      <Select onValueChange={(value) => setSelectedEvent(parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an event" />
                        </SelectTrigger>
                        <SelectContent>
                          {safeEvents.map((event: any) => (
                            <SelectItem key={event.id} value={event.id.toString()}>
                              {event.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <div className="w-32 h-32 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                        <Camera className="text-gray-400 h-12 w-12" />
                      </div>
                      <p className="text-gray-600 mb-4">Position QR code within the camera frame</p>
                      <Button
                        className="bg-black hover:bg-college-dark"
                        disabled={!selectedEvent}
                        onClick={() => setScannerOpen(true)}
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Start Scanner
                      </Button>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Scans</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <Check className="text-green-600" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">Sample Student</p>
                            <p className="text-xs text-gray-600">Just now</p>
                          </div>
                        </div>
                        <span className="text-xs font-medium text-green-600">Marked Present</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      {/* QR Scanner Modal */}
      {scannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-black"
              onClick={() => setScannerOpen(false)}
            >
              ×
            </button>
            <h2 className="text-lg font-bold mb-4">Scan QR Code</h2>
            <QrReader
              onResult={(result, error) => {
                if (!!result) {
                  console.log('QR Scan result:', result.getText());
                  qrScanMutation.mutate({ qrCode: result.getText(), eventId: selectedEvent! });
                  setScannerOpen(false);
                }
                // Optionally handle errors
                if (!!error) {
                  // toast({ title: 'Error', description: error.message, variant: 'destructive' });
                }
              }}
              constraints={{ facingMode: 'environment' }}
            />
          </div>
        </div>
      )}

      {/* Photo Verification Modal */}
      <PhotoVerificationModal
        isOpen={verificationModalOpen}
        onClose={() => {
          setVerificationModalOpen(false);
          setScanResult(null);
        }}
        scanResult={scanResult}
        onConfirm={() => {
          toast({
            title: "Success",
            description: `Attendance confirmed for ${scanResult?.user?.name}`,
          });
        }}
      />
    </div>
  );
}
