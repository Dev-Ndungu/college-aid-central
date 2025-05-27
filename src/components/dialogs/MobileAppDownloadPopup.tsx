
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Smartphone, Download, X } from 'lucide-react';

const MobileAppDownloadPopup = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has seen the popup before
    const hasSeenPopup = localStorage.getItem('assignmentHub_hasSeenMobilePopup');
    
    if (!hasSeenPopup) {
      // Show popup after a short delay for better UX
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleDownload = () => {
    // Mark that user has seen the popup
    localStorage.setItem('assignmentHub_hasSeenMobilePopup', 'true');
    
    // Open download link
    const downloadUrl = 'https://github.com/Dev-Ndungu/college-aid-central/releases/download/V.1/app-release-signed.apk';
    window.open(downloadUrl, '_blank');
    
    setIsOpen(false);
  };

  const handleClose = () => {
    // Mark that user has seen the popup
    localStorage.setItem('assignmentHub_hasSeenMobilePopup', 'true');
    setIsOpen(false);
  };

  const handleRemindLater = () => {
    // Don't mark as seen, just close for this session
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="h-6 w-6 text-blue-600" />
              <DialogTitle className="text-xl font-bold">Get Our Mobile App!</DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription className="text-left">
            Download the Assignment Hub mobile app for a better experience on your phone or tablet.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <Download className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Assignment Hub Mobile</h4>
                <p className="text-sm text-gray-600">Get instant notifications and manage assignments on-the-go</p>
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                <span>Submit assignments instantly</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                <span>Real-time progress tracking</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                <span>Push notifications for updates</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                <span>Offline access to your assignments</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              onClick={handleRemindLater}
              className="flex-1"
            >
              Remind Later
            </Button>
            <Button
              onClick={handleDownload}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Download App
            </Button>
          </div>
          <Button
            variant="ghost"
            onClick={handleClose}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Don't show again
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MobileAppDownloadPopup;
