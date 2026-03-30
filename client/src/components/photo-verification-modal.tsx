import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { User, CheckCircle, XCircle, Camera, Calendar, MapPin, GraduationCap } from "lucide-react";

interface PhotoVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  scanResult: {
    user: any;
    registration: any;
    attendance: any;
  } | null;
  onConfirm: () => void;
}

export function PhotoVerificationModal({ isOpen, onClose, scanResult, onConfirm }: PhotoVerificationModalProps) {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!scanResult) return null;

  const { user, registration, attendance } = scanResult;

  // Add safety checks for undefined objects
  if (!user || !registration) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <p className="text-red-600">Invalid scan result. Please try scanning again.</p>
            <Button onClick={onClose} className="mt-4">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      // The attendance is already marked in the backend
      // We just need to confirm the verification
      toast({
        title: "Attendance Confirmed",
        description: `${user.name} has been marked as attended`,
      });
      onConfirm();
      onClose();
    } catch (error) {
      console.error("Confirmation error:", error);
      toast({
        title: "Error",
        description: "Failed to confirm attendance",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = () => {
    toast({
      title: "Attendance Rejected",
      description: "Please verify the student's identity",
      variant: "destructive",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Student Photo Verification
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Student Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Student Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{user?.name || 'Unknown Student'}</h3>
                  <p className="text-sm text-gray-600">Student ID: {user?.studentId || 'Unknown'}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{user?.department || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Registered: {registration.registeredAt ? new Date(registration.registeredAt).toLocaleDateString() : 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Event: {registration.eventId || 'Unknown'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={attendance ? "default" : "secondary"}>
                  {attendance ? "Attended" : "Registered"}
                </Badge>
                {attendance && (
                  <span className="text-sm text-gray-600">
                    at {new Date(attendance.attendedAt).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>

            {/* Student Photo */}
            <div className="space-y-2">
              <h4 className="font-medium">Student Photo</h4>
              <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                {registration?.photoPath ? (
                  <img
                    src={`/api/photos/${registration.photoPath}`}
                    alt={`${user?.name || 'Student'}'s photo`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`absolute inset-0 flex items-center justify-center ${registration?.photoPath ? 'hidden' : ''}`}>
                  <div className="text-center">
                    <Camera className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No photo uploaded</p>
                    <p className="text-xs text-gray-400">Student needs to upload a photo</p>
                  </div>
                </div>
              </div>
              {!registration?.photoPath && (
                <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                  ⚠️ No photo available for verification. Please ask the student to upload a photo.
                </p>
              )}
            </div>
          </div>

          {/* Verification Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Verification Instructions</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Compare the student's face with the uploaded photo</li>
              <li>• Verify the student ID matches the displayed information</li>
              <li>• Check that the student is attending the correct event</li>
              <li>• Only confirm if you can verify the student's identity</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={handleReject}
              disabled={isProcessing}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm Attendance
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
