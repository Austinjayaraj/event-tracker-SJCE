import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Share, X } from "lucide-react";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  registration: any;
}

export function QRCodeModal({ isOpen, onClose, registration }: QRCodeModalProps) {
  const handleDownload = () => {
    if (registration?.qrCode) {
      const link = document.createElement("a");
      link.href = registration.qrCode;
      link.download = `qr-code-${registration.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleShare = () => {
    if (navigator.share && registration?.qrCode) {
      navigator.share({
        title: "Event QR Code",
        text: "Here's my QR code for the event",
        url: registration.qrCode
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Your QR Code</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="text-center">
          <div className="mb-6">
            <div className="w-48 h-48 bg-gray-100 rounded-lg mx-auto flex items-center justify-center mb-4">
              {registration?.qrCode ? (
                <img
                  src={registration.qrCode}
                  alt="QR Code"
                  className="w-40 h-40 rounded-md"
                />
              ) : (
                <div className="w-40 h-40 bg-white border-4 border-gray-800 rounded-lg flex items-center justify-center">
                  <span className="text-4xl">📱</span>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600">Event QR Code</p>
            <p className="text-xs text-gray-500">
              Valid for: {registration ? new Date(registration.registeredAt).toLocaleDateString() : "N/A"}
            </p>
          </div>
          <div className="flex justify-center space-x-3">
            <Button
              variant="outline"
              onClick={handleDownload}
              disabled={!registration?.qrCode}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button
              className="bg-college-blue hover:bg-college-dark"
              onClick={handleShare}
              disabled={!registration?.qrCode}
            >
              <Share className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
