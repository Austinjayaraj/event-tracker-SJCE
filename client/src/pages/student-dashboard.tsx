import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { QRCodeModal } from "@/components/qr-code-modal";
import { FileUploadModal } from "@/components/file-upload-modal";
import { PhotoUploadModal } from "@/components/photo-upload-modal";
import { 
  GraduationCap, 
  Calendar, 
  QrCode, 
  Trophy, 
  Bell,
  ChevronDown,
  User,
  Download,
  Upload,
  CalendarCheck,
  Code,
  Camera
} from "lucide-react";

export default function StudentDashboard() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [fileModalOpen, setFileModalOpen] = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);

  // Fetch available events
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ["/api/events"],
  });

  // Fetch user registrations
  const { data: registrations, isLoading: registrationsLoading } = useQuery({
    queryKey: ["/api/registrations"],
  });

  // Register for event mutation
  const registerMutation = useMutation({
    mutationFn: async (eventId: number) => {
      const response = await apiRequest("POST", "/api/registrations", { eventId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/registrations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Successfully registered for the event",
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

  const handleRegister = (eventId: number) => {
    registerMutation.mutate(eventId);
  };

  const handleDownloadQR = (registration: any) => {
    setSelectedRegistration(registration);
    setQrModalOpen(true);
  };

  const handleFileUpload = (registration: any) => {
    setSelectedRegistration(registration);
    setFileModalOpen(true);
  };

  const handlePhotoUpload = (registration: any) => {
    setSelectedRegistration(registration);
    setPhotoModalOpen(true);
  };

  const getRegistrationStatus = (eventId: number) => {
    return registrations?.find((reg: any) => reg.eventId === eventId);
  };

  const getEventBadgeColor = (eventType: string) => {
    switch (eventType) {
      case "college":
        return "bg-blue-100 text-blue-800";
      case "department":
        return "bg-green-100 text-green-800";
      case "hackathon":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "hackathon":
        return <Code className="text-purple-600" />;
      case "department":
        return <User className="text-green-600" />;
      default:
        return <Calendar className="text-blue-600" />;
    }
  };

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
                  <p className="text-sm text-gray-600 font-medium">Attendance Management System</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="relative">
                <Button variant="ghost" size="sm" className="relative p-3 hover:bg-blue-50 rounded-full">
                  <Bell className="h-6 w-6 text-gray-600" />
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                    2
                  </span>
                </Button>
              </div>
              
              <div className="flex items-center space-x-3 bg-gray-50 rounded-xl px-4 py-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-600 font-medium">{user?.studentId} • {user?.department}</p>
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
        {/* Student Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="college-card">
            <div className="college-card-content">
              <div className="flex items-center">
                <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                  <CalendarCheck className="text-white h-7 w-7" />
                </div>
                <div className="ml-5">
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Events Registered</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {registrationsLoading ? "..." : registrations?.length || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Total registrations</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="college-card">
            <div className="college-card-content">
              <div className="flex items-center">
                <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                  <QrCode className="text-white h-7 w-7" />
                </div>
                <div className="ml-5">
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">QR Codes</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {registrationsLoading ? "..." : registrations?.filter((reg: any) => reg.qrCode).length || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Available for download</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="college-card">
            <div className="college-card-content">
              <div className="flex items-center">
                <div className="p-4 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg">
                  <Trophy className="text-white h-7 w-7" />
                </div>
                <div className="ml-5">
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Hackathons</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {registrationsLoading ? "..." : registrations?.filter((reg: any) => {
                      const event = events?.find((e: any) => e.id === reg.eventId);
                      return event?.eventType === "hackathon";
                    }).length || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Competition events</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Available Events */}
        <div className="college-card mb-8">
          <div className="college-card-header">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Calendar className="h-6 w-6 text-blue-600 mr-3" />
              Available Events
            </h2>
            <p className="text-gray-600 mt-1">Register for upcoming events and manage your attendance</p>
          </div>
          <div className="college-card-content">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {eventsLoading ? (
                <div className="col-span-full text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-500 font-medium">Loading events...</p>
                </div>
              ) : (
                events?.map((event: any) => {
                  const registration = getRegistrationStatus(event.id);
                  return (
                    <div key={event.id} className="college-card hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
                      <div className="college-card-content">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                            {getEventIcon(event.eventType)}
                          </div>
                          <Badge className={`${getEventBadgeColor(event.eventType)} font-semibold px-3 py-1`}>
                            {registration ? (registration.status === "attended" ? "Attended" : "Registered") : "Open"}
                          </Badge>
                        </div>
                        <h4 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h4>
                        <p className="text-sm text-gray-600 mb-4">{event.description}</p>
                        <div className="space-y-3 mb-6">
                          <div className="flex items-center text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                            <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                            <span className="font-medium">{new Date(event.date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                            <span className="w-4 h-4 mr-2 text-blue-600">🕐</span>
                            <span className="font-medium">{event.startTime} - {event.endTime}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                            <span className="w-4 h-4 mr-2 text-blue-600">📍</span>
                            <span className="font-medium">{event.venue}</span>
                          </div>
                        </div>
                        {registration ? (
                          <div className="space-y-3">
                            <Button
                              className="w-full btn-college-primary"
                              onClick={() => handleDownloadQR(registration)}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download QR Code
                            </Button>
                            {registration.status !== "attended" && (
                              <>
                                <Button
                                  className="w-full btn-college-outline"
                                  onClick={() => handlePhotoUpload(registration)}
                                >
                                  <Camera className="w-4 h-4 mr-2" />
                                  {registration.photoPath ? "Update Photo" : "Upload Photo"}
                                </Button>
                                {event.eventType === "hackathon" && (
                                  <Button
                                    className="w-full btn-college-secondary"
                                    onClick={() => handleFileUpload(registration)}
                                  >
                                    <Upload className="w-4 h-4 mr-2" />
                                    Upload Files
                                  </Button>
                                )}
                              </>
                            )}
                            {registration.status === "attended" && (
                              <div className="text-center text-sm text-green-600 font-semibold bg-green-50 rounded-lg py-2">
                                ✓ Attendance Confirmed
                              </div>
                            )}
                          </div>
                        ) : (
                          <Button
                            className="w-full btn-college-primary text-lg py-3"
                            onClick={() => handleRegister(event.id)}
                            disabled={registerMutation.isPending}
                          >
                            {registerMutation.isPending ? "Registering..." : "Register Now"}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* My Registrations */}
        <Card>
          <CardHeader>
            <CardTitle>My Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>QR Code</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrationsLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">Loading...</TableCell>
                    </TableRow>
                  ) : registrations?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500">
                        No registrations found
                      </TableCell>
                    </TableRow>
                  ) : (
                    registrations?.map((registration: any) => {
                      const event = events?.find((e: any) => e.id === registration.eventId);
                      return (
                        <TableRow key={registration.id}>
                          <TableCell>
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                {getEventIcon(event?.eventType)}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{event?.title}</div>
                                <div className="text-sm text-gray-500">{event?.eventType}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{event ? new Date(event.date).toLocaleDateString() : "N/A"}</TableCell>
                          <TableCell>
                            <Badge variant={registration.status === "attended" ? "default" : "secondary"}>
                              {registration.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="w-8 h-8 bg-gray-200 rounded border-2 border-gray-400 flex items-center justify-center">
                              <QrCode className="text-gray-600 w-4 h-4" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadQR(registration)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              {event?.eventType === "hackathon" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleFileUpload(registration)}
                                >
                                  <Upload className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <QRCodeModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        registration={selectedRegistration}
      />
      <FileUploadModal
        isOpen={fileModalOpen}
        onClose={() => setFileModalOpen(false)}
        registration={selectedRegistration}
      />
      <PhotoUploadModal
        isOpen={photoModalOpen}
        onClose={() => setPhotoModalOpen(false)}
        registration={selectedRegistration}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/registrations"] });
        }}
      />
    </div>
  );
}
