import { useState } from "react";
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

const eventFormSchema = insertEventSchema.extend({
  date: z.string(),
});

type EventForm = z.infer<typeof eventFormSchema>;

export default function AdminDashboard() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);
  const [createEventOpen, setCreateEventOpen] = useState(false);

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
  });

  // Fetch events
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ["/api/events"],
  });

  // Fetch users
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (data: EventForm) => {
      const response = await apiRequest("POST", "/api/events", {
        ...data,
        date: new Date(data.date).toISOString(),
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
        variant: "destructive",
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Success",
        description: `Attendance marked for ${data.user.name}`,
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

  const eventForm = useForm<EventForm>({
    resolver: zodResolver(eventFormSchema),
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

  const handleCreateEvent = (data: EventForm) => {
    createEventMutation.mutate(data);
  };

  const handleDeleteEvent = (eventId: number) => {
    if (confirm("Are you sure you want to delete this event?")) {
      deleteEventMutation.mutate(eventId);
    }
  };

  const handleExportAttendance = async (eventId?: number) => {
    try {
      const url = eventId ? `/api/attendance/export?eventId=${eventId}` : "/api/attendance/export";
      const response = await fetch(url, { credentials: "include" });
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "attendance.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export attendance",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-college-blue rounded-full flex items-center justify-center mr-3">
                <GraduationCap className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">St. Joseph's College of Engineering</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Button variant="ghost" size="sm">
                  <Bell className="h-5 w-5 text-gray-400" />
                </Button>
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  3
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-college-blue rounded-full flex items-center justify-center">
                  <User className="text-white text-sm" />
                </div>
                <span className="text-sm font-medium text-gray-700">{user?.name}</span>
                <Button variant="ghost" size="sm" onClick={() => logoutMutation.mutate()}>
                  <ChevronDown className="h-4 w-4" />
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
                        {statsLoading ? "..." : stats?.totalStudents || 0}
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
                        {statsLoading ? "..." : stats?.totalEvents || 0}
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
                        {statsLoading ? "..." : stats?.totalRegistrations || 0}
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
                        {statsLoading ? "..." : stats?.totalAttendance || 0}
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
                      events?.slice(0, 3).map((event: any) => (
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
                    {["CSE", "ECE", "EEE", "MECH"].map((dept) => (
                      <div key={dept} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">{dept}</span>
                          </div>
                          <span className="ml-3 text-sm font-medium text-gray-900">{dept}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900">
                          {Math.floor(Math.random() * 500) + 100}
                        </span>
                      </div>
                    ))}
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
                        users?.filter((user: any) => user.role === "student").map((user: any) => (
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
                      <Button className="bg-college-blue hover:bg-college-dark">
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
                    events?.map((event: any) => (
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
                  <Button variant="outline" onClick={() => handleExportAttendance()}>
                    <Download className="w-4 h-4 mr-2" />
                    Export to Excel
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex space-x-4">
                  <Select>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="All Events" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Events</SelectItem>
                      {events?.map((event: any) => (
                        <SelectItem key={event.id} value={event.id.toString()}>
                          {event.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input type="date" className="w-48" />
                  <Button className="bg-college-blue hover:bg-college-dark">
                    Filter
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead>Check-in Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>QR Code</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-gray-500">
                          No attendance records found
                        </TableCell>
                      </TableRow>
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
                          {events?.map((event: any) => (
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
                        className="bg-college-blue hover:bg-college-dark"
                        disabled={!selectedEvent}
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
    </div>
  );
}
