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
  Code
} from "lucide-react";

export default function StudentDashboard() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [fileModalOpen, setFileModalOpen] = useState(false);
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
                <h1 className="text-xl font-bold text-gray-900">Student Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome back, {user?.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Button variant="ghost" size="sm">
                  <Bell className="h-5 w-5 text-gray-400" />
                </Button>
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  2
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
        {/* Student Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <CalendarCheck className="text-blue-600 h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Events Registered</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {registrationsLoading ? "..." : registrations?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <QrCode className="text-green-600 h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">QR Codes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {registrationsLoading ? "..." : registrations?.filter((reg: any) => reg.qrCode).length || 0}
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
                  <p className="text-sm font-medium text-gray-600">Hackathons</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {registrationsLoading ? "..." : registrations?.filter((reg: any) => {
                      const event = events?.find((e: any) => e.id === reg.eventId);
                      return event?.eventType === "hackathon";
                    }).length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Available Events */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Available Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {eventsLoading ? (
                <div className="col-span-full text-center">Loading events...</div>
              ) : (
                events?.map((event: any) => {
                  const registration = getRegistrationStatus(event.id);
                  return (
                    <Card key={event.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            {getEventIcon(event.eventType)}
                          </div>
                          <Badge className={getEventBadgeColor(event.eventType)}>
                            {registration ? "Registered" : "Open"}
                          </Badge>
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">{event.title}</h4>
                        <p className="text-sm text-gray-600 mb-4">{event.description}</p>
                        <div className="space-y-2 text-sm text-gray-600 mb-4">
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
                        {registration ? (
                          <div className="space-y-2">
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => handleDownloadQR(registration)}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download QR Code
                            </Button>
                            {event.eventType === "hackathon" && (
                              <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => handleFileUpload(registration)}
                              >
                                <Upload className="w-4 h-4 mr-2" />
                                Upload Files
                              </Button>
                            )}
                          </div>
                        ) : (
                          <Button
                            className="w-full bg-college-blue hover:bg-college-dark"
                            onClick={() => handleRegister(event.id)}
                            disabled={registerMutation.isPending}
                          >
                            {registerMutation.isPending ? "Registering..." : "Register Now"}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

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
    </div>
  );
}
