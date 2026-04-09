import React, { useState, useEffect, useRef } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { EventReportTemplate } from "./event-report-template";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Event } from "@shared/schema";
import { Upload, Image as ImageIcon, Video, Save, Download } from "lucide-react";

interface ManageEventModalProps {
  event: Event | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageEventModal({ event, open, onOpenChange }: ManageEventModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [formData, setFormData] = useState<Partial<Event>>({});
  const [isUploading, setIsUploading] = useState(false);
  const prePdfRef = useRef<HTMLDivElement>(null);
  const postPdfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (event) {
      setFormData(event);
      setActiveTab("overview");
    }
  }, [event, open]);

  const updateEventMutation = useMutation({
    mutationFn: async (data: Partial<Event>) => {
      const res = await apiRequest("PUT", `/api/events/${event?.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({ title: "Success", description: "Event details updated successfully." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof Event) => {
    if (!e.target.files || e.target.files.length === 0 || !event) return;
    
    setIsUploading(true);
    const formBody = new FormData();
    for (let i = 0; i < e.target.files.length; i++) {
       formBody.append("files", e.target.files[i]);
    }
    
    try {
       const res = await fetch(`/api/events/${event.id}/works/upload`, { 
         method: "POST", 
         body: formBody 
       });
       
       if (!res.ok) throw new Error("Upload failed");
       
       const data = await res.json();
       
       if (fieldName === "postEventPhotosPaths") {
         setFormData(prev => ({ ...prev, [fieldName]: data.filePaths }));
       } else {
         setFormData(prev => ({ ...prev, [fieldName]: data.filePaths[0] }));
       }
       toast({ title: "File uploaded successfully" });
    } catch (err: any) {
       toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
       setIsUploading(false);
    }
  };

  const handleSave = () => {
    updateEventMutation.mutate(formData);
  };

  const downloadPdf = async (type: "pre" | "post") => {
    const element = type === "pre" ? prePdfRef.current : postPdfRef.current;
    if (!element) return;
    
    setIsUploading(true);
    toast({ title: "Generating PDF", description: "Please wait..." });

    try {
      const canvas = await html2canvas(element, { 
        scale: 2,
        useCORS: true, 
        logging: false 
      });
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4"
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${event!.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${type}_event_report.pdf`);
      
      toast({ title: "Success", description: "PDF downloaded successfully" });
    } catch (err: any) {
      toast({ title: "Error", description: "Failed to generate PDF", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Event: {event.title}</DialogTitle>
          <DialogDescription>
            Update event information, configure pre-event requirements, and log post-event analysis.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="preevent">Pre Event Works</TabsTrigger>
            <TabsTrigger value="postevent">Post Event Works</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={formData.title || ""} onChange={e => setFormData({ ...formData, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Venue</Label>
                <Input value={formData.venue || ""} onChange={e => setFormData({ ...formData, venue: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={formData.description || ""} onChange={e => setFormData({ ...formData, description: e.target.value })} />
            </div>
          </TabsContent>

          <TabsContent value="preevent" className="space-y-4 mt-4">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="font-semibold text-lg">Pre-Event Details</h3>
              <Button onClick={() => downloadPdf("pre")} variant="secondary" size="sm" disabled={isUploading}>
                <Download className="w-4 h-4 mr-2" />
                Download Report (PDF)
              </Button>
            </div>
            
            <div className="space-y-2">
              <Label>Event Poster</Label>
              <div className="flex items-center gap-4">
                <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "preEventPosterPath")} disabled={isUploading} />
                {formData.preEventPosterPath && (
                  <span className="text-sm text-green-600 flex items-center"><ImageIcon className="w-4 h-4 mr-1"/> Poster Uploaded</span>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Guest Details</Label>
              <Textarea 
                placeholder="Names, designations, and contact details of VIPs/Guests" 
                value={formData.preEventGuestDetails || ""} 
                onChange={e => setFormData({ ...formData, preEventGuestDetails: e.target.value })} 
              />
            </div>
            <div className="space-y-2">
              <Label>Additional Details & Requirements</Label>
              <Textarea 
                placeholder="Catering, seating arrangements, audio/visual requirements, etc." 
                value={formData.preEventAdditionalDetails || ""} 
                onChange={e => setFormData({ ...formData, preEventAdditionalDetails: e.target.value })} 
              />
            </div>
          </TabsContent>

          <TabsContent value="postevent" className="space-y-4 mt-4">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="font-semibold text-lg">Post-Event Details Analysis</h3>
              <Button onClick={() => downloadPdf("post")} variant="secondary" size="sm" disabled={isUploading}>
                <Download className="w-4 h-4 mr-2" />
                Download Report (PDF)
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Event Details/Summary</Label>
                <Textarea 
                  placeholder="Summary of how the event went..." 
                  value={formData.postEventDetails || ""} 
                  onChange={e => setFormData({ ...formData, postEventDetails: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <Label>Event Winners</Label>
                <Textarea 
                  placeholder="Names and details of competition winners (if applicable)" 
                  value={formData.postEventWinners || ""} 
                  onChange={e => setFormData({ ...formData, postEventWinners: e.target.value })} 
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Number of Students Benefitted</Label>
              <Input 
                type="number" 
                min="0"
                value={formData.postEventStudentsBenefited || ""} 
                onChange={e => setFormData({ ...formData, postEventStudentsBenefited: parseInt(e.target.value) || 0 })} 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Event Photos</Label>
                <div className="flex flex-col gap-2">
                  <Input type="file" multiple accept="image/*" onChange={(e) => handleFileUpload(e, "postEventPhotosPaths")} disabled={isUploading} />
                  {Array.isArray(formData.postEventPhotosPaths) && formData.postEventPhotosPaths.length > 0 && (
                    <span className="text-sm text-green-600 flex items-center">
                      <ImageIcon className="w-4 h-4 mr-1"/> {(formData.postEventPhotosPaths as string[]).length} Photos Uploaded
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Event Glimpse Video</Label>
                <div className="flex flex-col gap-2">
                  <Input type="file" accept="video/*" onChange={(e) => handleFileUpload(e, "postEventVideoPath")} disabled={isUploading} />
                  {formData.postEventVideoPath && (
                    <span className="text-sm text-green-600 flex items-center">
                      <Video className="w-4 h-4 mr-1"/> Video Uploaded
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Special Moments & Highlights</Label>
              <Textarea 
                placeholder="Any special occurrences or notable highlights" 
                value={formData.postEventSpecialMoments || ""} 
                onChange={e => setFormData({ ...formData, postEventSpecialMoments: e.target.value })} 
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4 border-t mt-4">
          <Button variant="outline" className="mr-2" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={updateEventMutation.isPending || isUploading}>
            {updateEventMutation.isPending ? "Saving..." : <><Save className="w-4 h-4 mr-2"/> Save Changes</>}
          </Button>
        </div>
        
        {/* Hidden Templates for PDF Generation */}
        <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
          {formData.id && (
             <>
               <EventReportTemplate ref={prePdfRef} event={formData as Event} type="pre" />
               <EventReportTemplate ref={postPdfRef} event={formData as Event} type="post" />
             </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
