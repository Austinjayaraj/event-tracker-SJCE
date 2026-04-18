import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { Chatbot } from "@/components/chatbot";
import { 
  GraduationCap, 
  Calendar, 
  QrCode, 
  Trophy, 
  Bell,
  User,
  Download,
  Upload,
  CalendarCheck,
  Code,
  Camera,
  Sparkles,
  Users,
  MessageSquare
} from "lucide-react";

export default function StudentDashboard() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [fileModalOpen, setFileModalOpen] = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);

  // Fetch available events
  const { data: events, isLoading: eventsLoading } = useQuery<any[]>({
    queryKey: ["/api/events"],
  });

  // Fetch user registrations
  const { data: registrations, isLoading: registrationsLoading } = useQuery<any[]>({
    queryKey: ["/api/registrations"],
  });

  const { data: recommendations, isLoading: recoLoading } = useQuery<any[]>({
    queryKey: ["/api/recommendations"],
  });

  const { data: externalHackathons, isLoading: externalLoading } = useQuery<any[]>({
    queryKey: ["/api/unstop-hackathons"],
  });

  const { data: mentors, isLoading: mentorsLoading } = useQuery<any[]>({
    queryKey: ["/api/mentors"],
  });

  const requestMentorshipMutation = useMutation({
    mutationFn: async (mentorId: number) => {
      const response = await apiRequest("POST", "/api/mentorships/request", { mentorId, message: "Hi! I would love some guidance." });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Mentorship Requested",
        description: "Your request has been sent to the mentor.",
      });
    },
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

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "hackathon":
        return <Code className="text-purple-400" />;
      case "department":
        return <User className="text-teal-400" />;
      default:
        return <Calendar className="text-cyan-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-gray-200 pb-12 relative overflow-hidden font-sans">
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <header className="bg-[#0A0B0E]/80 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.8)] border-b border-white/5 sticky top-0 z-40 transition-all">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <div className="flex items-center">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center space-x-4"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.3)]">
                    <GraduationCap className="h-8 w-8 text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]" />
                  </div>
                  <div>
                    <h1 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">St. Joseph's College</h1>
                    <p className="text-sm text-gray-400 font-medium tracking-wide">Student Dashboard</p>
                  </div>
                </motion.div>
              </div>
              
              <div className="flex items-center space-x-6">
                <div className="relative hidden md:block">
                  <Button variant="ghost" size="sm" className="relative p-3 hover:bg-white/5 rounded-full">
                    <Bell className="h-6 w-6 text-gray-400 hover:text-white transition-colors" />
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-purple-500 text-white text-xs rounded-full flex items-center justify-center font-semibold border-2 border-[#0A0B0E]">
                      2
                    </span>
                  </Button>
                </div>
                
                <div className="flex items-center space-x-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-2 hover:bg-white/10 transition-colors">
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold text-white">{user?.name}</p>
                    <p className="text-xs text-teal-300 font-medium">{user?.studentId} • {user?.department}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => logoutMutation.mutate()}
                    className="text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl px-3 py-2 ml-2 transition-colors"
                  >
                    Logout
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full"
        >
          {/* Student Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
              className="glass rounded-[24px] p-6 border border-white/5 shadow-2xl hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden bg-[#11131A]/80"
            >
              <div className="flex items-center relative z-10">
                <div className="p-4 bg-cyan-500/10 ring-1 ring-cyan-500/20 rounded-2xl shadow-inner">
                  <CalendarCheck className="text-cyan-400 h-7 w-7" />
                </div>
                <div className="ml-5">
                  <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Events Registered</p>
                  <p className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 mt-1">
                    {registrationsLoading ? "..." : registrations?.length || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 font-medium">Total registrations</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
              className="glass rounded-[24px] p-6 border border-white/5 shadow-2xl hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden bg-[#11131A]/80"
            >
              <div className="flex items-center relative z-10">
                <div className="p-4 bg-teal-500/10 ring-1 ring-teal-500/20 rounded-2xl shadow-inner">
                  <QrCode className="text-teal-400 h-7 w-7" />
                </div>
                <div className="ml-5">
                  <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">QR Codes</p>
                  <p className="text-4xl font-black text-white mt-1">
                    {registrationsLoading ? "..." : registrations?.filter((reg: any) => reg.qrCode).length || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 font-medium">Available for download</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
              className="glass rounded-[24px] p-6 border border-white/5 shadow-2xl hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden bg-[#11131A]/80"
            >
              <div className="flex items-center relative z-10">
                <div className="p-4 bg-purple-500/10 ring-1 ring-purple-500/20 rounded-2xl shadow-inner">
                  <Trophy className="text-purple-400 h-7 w-7" />
                </div>
                <div className="ml-5">
                  <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Hackathons</p>
                  <p className="text-4xl font-black text-white mt-1">
                    {registrationsLoading ? "..." : registrations?.filter((reg: any) => {
                      const event = events?.find((e: any) => e.id === reg.eventId);
                      return event?.eventType === "hackathon";
                    }).length || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 font-medium">Competition events</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Available Events */}
          <Card className="glass mb-8 border border-white/5 shadow-2xl relative overflow-hidden bg-[#11131A]/80 rounded-[30px]">
            <CardHeader className="relative z-10 border-b border-white/5 pb-6">
              <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-teal-400 flex items-center">
                <Sparkles className="h-6 w-6 text-cyan-400 mr-3" />
                Recommended For You
              </CardTitle>
              <p className="text-gray-400 mt-2 font-medium">Events curated based on your past participation and tags.</p>
            </CardHeader>
            <CardContent className="relative z-10 pt-8">
              <div className="flex overflow-x-auto space-x-6 pb-4 scrollbar-hide">
                {recoLoading || externalLoading ? (
                  <div className="text-cyan-400">Finding best events...</div>
                ) : (!recommendations?.length && !externalHackathons?.length) ? (
                  <div className="text-gray-500">No specific recommendations right now. Check all events below!</div>
                ) : (
                  [...(recommendations || []), ...(externalHackathons || [])].slice(0, 8).map((event: any, i: number) => {
                    if (!event.isExternal) {
                      const registration = getRegistrationStatus(event.id);
                      if (registration) return null; // Don't recommend already registered internal events
                    }
                    return (
                      <motion.div 
                        key={"reco_uid_"+event.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="min-w-[300px] max-w-[320px] flex-shrink-0"
                      >
                        <Card className="glass h-full hover:-translate-y-2 transition-all duration-300 border border-cyan-500/20 shadow-[0_4px_15px_rgba(56,189,248,0.1)] bg-[#0A0B0E]/80 rounded-2xl overflow-hidden relative">
                           {event.isExternal && (
                             <div className="absolute top-0 right-0 bg-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg z-10">Unstop</div>
                           )}
                           <CardContent className="p-5 flex flex-col h-full mt-2">
                              <Badge className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 w-fit mb-3">
                                {event.isExternal ? "External Hackathon" : "Suggested match"}
                              </Badge>
                              <h4 className="text-lg font-bold text-white mb-2 line-clamp-1">{event.title}</h4>
                              <p className="text-xs text-gray-400 mb-4 line-clamp-2">{event.description}</p>
                              <Button
                                size="sm"
                                className="mt-auto w-full bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-semibold rounded-lg"
                                onClick={() => {
                                  if (event.isExternal) {
                                    window.open(event.publicUrl, "_blank");
                                  } else {
                                    handleRegister(event.id);
                                  }
                                }}
                                disabled={!event.isExternal && registerMutation.isPending}
                              >
                                {(!event.isExternal && registerMutation.isPending) ? "Joining..." : (event.isExternal ? "View on Unstop" : "Register Now")}
                              </Button>
                           </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Available Events */}
          <Card className="glass mb-8 border border-white/5 shadow-2xl relative overflow-hidden bg-[#11131A]/80 rounded-[30px]">
            <CardHeader className="relative z-10 border-b border-white/5 pb-6">
              <CardTitle className="text-2xl font-bold text-white flex items-center">
                <Calendar className="h-6 w-6 text-cyan-400 mr-3" />
                All Available Events
              </CardTitle>
              <p className="text-gray-400 mt-2 font-medium">Browse and register for upcoming events across all departments.</p>
            </CardHeader>
            <CardContent className="relative z-10 pt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {eventsLoading ? (
                  <div className="col-span-full text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
                    <p className="mt-4 text-gray-400 font-medium">Loading events...</p>
                  </div>
                ) : (
                  events?.map((event: any, i: number) => {
                    const registration = getRegistrationStatus(event.id);
                    return (
                      <motion.div 
                        key={event.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="h-full flex flex-col"
                      >
                        <Card className="glass h-full flex flex-col hover:-translate-y-2 transition-all duration-300 border border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden group bg-[#0A0B0E]/60 rounded-2xl">
                          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-cyan-400 to-purple-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                          <CardContent className="p-6 flex-1 flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                              <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center shadow-inner border border-white/5">
                                {getEventIcon(event.eventType)}
                              </div>
                              <Badge className={`${
                                registration 
                                  ? (registration.status === "attended" ? "bg-teal-500 text-white shadow-[0_0_15px_rgba(45,212,191,0.5)]" : "bg-cyan-500 text-white shadow-[0_0_15px_rgba(56,189,248,0.5)]") 
                                  : "bg-white/10 text-gray-300 hover:bg-white/20"
                              } border-0 px-3 py-1 font-medium rounded-full`}>
                                {registration ? (registration.status === "attended" ? "Attended" : "Registered") : "Open"}
                              </Badge>
                            </div>
                            <h4 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors drop-shadow">{event.title}</h4>
                            <p className="text-sm text-gray-400 mb-6 line-clamp-2">{event.description}</p>
                            
                            <div className="space-y-3 mb-8 mt-auto">
                              <div className="flex items-center text-sm font-medium text-gray-300 bg-black/40 rounded-xl p-3 border border-white/5">
                                <Calendar className="w-4 h-4 mr-3 text-cyan-400" />
                                <span>{new Date(event.date).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center text-sm font-medium text-gray-300 bg-black/40 rounded-xl p-3 border border-white/5">
                                <span className="w-4 h-4 mr-3 text-purple-400 flex items-center justify-center text-lg">🕔</span>
                                <span>{event.startTime} - {event.endTime}</span>
                              </div>
                              <div className="flex items-center text-sm font-medium text-gray-300 bg-black/40 rounded-xl p-3 border border-white/5">
                                <span className="w-4 h-4 mr-3 text-teal-400 flex items-center justify-center text-lg">📍</span>
                                <span>{event.venue}</span>
                              </div>
                            </div>
                            
                            {registration ? (
                              <div className="space-y-3">
                                <Button
                                  className="w-full bg-white/10 text-white border border-white/10 hover:bg-white/20 shadow-sm rounded-xl py-5"
                                  onClick={() => handleDownloadQR(registration)}
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  Download QR
                                </Button>
                                {registration.status !== "attended" && (
                                  <>
                                    <Button
                                      variant="outline"
                                      className="w-full bg-cyan-900/20 border-cyan-500/30 hover:bg-cyan-900/40 text-cyan-400 rounded-xl py-5"
                                      onClick={() => handlePhotoUpload(registration)}
                                    >
                                      <Camera className="w-4 h-4 mr-2" />
                                      {registration.photoPath ? "Update Photo" : "Upload Photo"}
                                    </Button>
                                    {event.eventType === "hackathon" && (
                                      <Button
                                        variant="secondary"
                                        className="w-full bg-purple-900/20 border border-purple-500/30 hover:bg-purple-900/40 text-purple-400 rounded-xl py-5 mt-3"
                                        onClick={() => handleFileUpload(registration)}
                                      >
                                        <Upload className="w-4 h-4 mr-2" />
                                        Upload Files
                                      </Button>
                                    )}
                                  </>
                                )}
                                {registration.status === "attended" && (
                                  <div className="text-center text-sm text-teal-400 font-semibold bg-teal-500/10 border border-teal-500/20 rounded-xl py-4 flex items-center justify-center mt-3 shadow-inner">
                                    <CalendarCheck className="w-4 h-4 mr-2" /> Attendance Confirmed
                                  </div>
                                )}
                              </div>
                            ) : (
                              <Button
                                className="w-full bg-gradient-to-r from-cyan-400 to-purple-500 text-white shadow-[0_0_20px_rgba(56,189,248,0.3)] hover:shadow-[0_0_30px_rgba(56,189,248,0.5)] border border-white/10 hover:-translate-y-0.5 transition-all py-6 text-base font-semibold rounded-xl"
                                onClick={() => handleRegister(event.id)}
                                disabled={registerMutation.isPending}
                              >
                                {registerMutation.isPending ? "Registering..." : "Register Now"}
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* My Registrations */}
          <Card className="glass border border-white/5 shadow-2xl relative overflow-hidden bg-[#11131A]/80 rounded-[30px]">
            <CardHeader className="border-b border-white/5 pb-6">
              <CardTitle className="text-2xl font-bold text-white flex items-center">
                 <QrCode className="h-6 w-6 text-purple-400 mr-3" />
                 My Registrations
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-white/5">
                      <TableHead className="text-gray-400 font-semibold">Event</TableHead>
                      <TableHead className="text-gray-400 font-semibold">Date</TableHead>
                      <TableHead className="text-gray-400 font-semibold">Status</TableHead>
                      <TableHead className="text-gray-400 font-semibold">QR Code</TableHead>
                      <TableHead className="text-gray-400 font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registrationsLoading ? (
                      <TableRow className="border-white/5 hover:bg-white/5">
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">Loading...</TableCell>
                      </TableRow>
                    ) : registrations?.length === 0 ? (
                      <TableRow className="border-white/5 hover:bg-white/5">
                        <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                          No registrations found
                        </TableCell>
                      </TableRow>
                    ) : (
                      <AnimatePresence>
                        {registrations?.map((registration: any, i: number) => {
                          const event = events?.find((e: any) => e.id === registration.eventId);
                          return (
                            <motion.tr 
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05 }}
                              key={registration.id}
                              className="border-white/5 hover:bg-white/[0.03] transition-colors"
                            >
                              <TableCell>
                                <div className="flex items-center">
                                  <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
                                    {getEventIcon(event?.eventType)}
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-bold text-white tracking-wide">{event?.title}</div>
                                    <div className="text-xs text-cyan-400 font-medium uppercase mt-1">{event?.eventType}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="font-medium text-gray-400">{event ? new Date(event.date).toLocaleDateString() : "N/A"}</TableCell>
                              <TableCell>
                                <Badge className={registration.status === "attended" ? "bg-teal-500/20 text-teal-400 border border-teal-500/30" : "bg-white/10 text-gray-300 border border-white/10"}>
                                  {registration.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="w-8 h-8 bg-white/10 rounded border border-white/10 flex items-center justify-center shadow-inner">
                                  <QrCode className="text-gray-400 w-4 h-4" />
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white"
                                    onClick={() => handleDownloadQR(registration)}
                                  >
                                    <Download className="w-4 h-4 md:mr-2" />
                                    <span className="hidden md:inline">Download</span>
                                  </Button>
                                  {event?.eventType === "hackathon" && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="bg-purple-900/20 border-purple-500/30 text-purple-400 hover:bg-purple-900/40 hover:text-purple-300"
                                      onClick={() => handleFileUpload(registration)}
                                    >
                                      <Upload className="w-4 h-4 md:mr-2" />
                                      <span className="hidden md:inline">Files</span>
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </motion.tr>
                          );
                        })}
                      </AnimatePresence>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Mentorship Hub */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 w-full">
          <Card className="glass border border-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.1)] relative overflow-hidden bg-[#0B0C10]/90 rounded-[30px] mt-2">
            <CardHeader className="relative z-10 border-b border-white/5 pb-6">
              <CardTitle className="text-2xl font-bold font-sans flex items-center text-white">
                <Users className="h-6 w-6 text-purple-400 mr-3" />
                Mentorship Hub
              </CardTitle>
              <p className="text-gray-400 mt-2 font-medium">Connect with past hackathon winners and senior peers for guidance and mentorship.</p>
            </CardHeader>
            <CardContent className="pt-8">
               {mentorsLoading ? (
                 <div className="text-purple-400 text-center">Loading mentors...</div>
               ) : mentors?.length === 0 ? (
                 <div className="text-center text-gray-500 py-8">No mentors available at the moment.</div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {mentors?.map((mentor: any) => (
                     <motion.div whileHover={{ scale: 1.02 }} key={mentor.id} className="glass p-6 rounded-2xl flex items-center bg-[#11131A] border border-white/5 shadow-lg relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                       <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center font-bold text-white text-2xl shadow-lg border-2 border-purple-400/50">
                         {mentor.name.charAt(0).toUpperCase()}
                       </div>
                       <div className="ml-4 flex-1 z-10">
                         <h4 className="text-white font-bold text-lg">{mentor.name}</h4>
                         <p className="text-purple-300 text-xs font-semibold uppercase tracking-wider">{mentor.department || 'Hackathon Winner'}</p>
                       </div>
                       <Button size="sm" variant="outline" className="z-10 text-purple-400 border-purple-500/30 hover:bg-purple-500/20 shadow-inner px-4 rounded-xl" onClick={() => requestMentorshipMutation.mutate(mentor.id)}>
                         Ask <MessageSquare className="w-4 h-4 ml-2" />
                       </Button>
                     </motion.div>
                   ))}
                 </div>
               )}
            </CardContent>
          </Card>
        </motion.div>
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
      <Chatbot />
    </div>
  );
}
