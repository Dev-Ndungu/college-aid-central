import React from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, Download, File, Image, FileArchive } from 'lucide-react';

interface FileAttachmentsProps {
  fileUrls: string[] | null;
  preview?: boolean;
}

const FileAttachments: React.FC<FileAttachmentsProps> = ({ fileUrls, preview = false }) => {
  if (!fileUrls || fileUrls.length === 0) {
    return null;
  }

  const getFileIcon = (url: string) => {
    if (url.includes('.pdf')) return <FileText className="h-5 w-5 text-red-500" />;
    if (url.includes('.doc') || url.includes('.docx')) return <FileText className="h-5 w-5 text-blue-500" />;
    if (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || url.includes('.gif')) 
      return <Image className="h-5 w-5 text-purple-500" />;
    if (url.includes('.zip') || url.includes('.rar')) 
      return <FileArchive className="h-5 w-5 text-yellow-500" />;
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const getFileName = (url: string) => {
    try {
      // Extract the filename from the URL
      const parts = new URL(url).pathname.split('/');
      const fullFileName = parts[parts.length - 1];
      
      // Try to decode the filename to make it more readable
      const decodedFileName = decodeURIComponent(fullFileName);
      
      // Remove the random part if needed for preview mode
      if (preview) {
        // Take everything after the first dash for readability
        const fileNameParts = decodedFileName.split('-');
        if (fileNameParts.length > 1) {
          // Keep only the first 8 characters of the random part + the extension
          const shortRandomPart = fileNameParts.slice(1).join('-');
          const shortened = shortRandomPart.substring(0, 10) + '...';
          return shortened;
        }
      }
      
      return decodedFileName;
    } catch (e) {
      // If we can't parse the URL, return a fallback name
      return "attachment";
    }
  };

  // If in preview mode, use simplified view
  if (preview) {
    return (
      <div className="mt-4">
        <h3 className="text-sm font-medium mb-2">Attachments ({fileUrls.length})</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {fileUrls.map((url, index) => (
            <Card key={index} className="p-3 bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 overflow-hidden">
                  {getFileIcon(url)}
                  <span className="text-sm font-medium truncate max-w-[150px]" title={url}>
                    {getFileName(url)}
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  asChild
                >
                  <a 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    download
                    className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-gray-200"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Full detailed view for modal
  return (
    <div className="mt-4">
      <h3 className="text-base font-medium mb-3">Assignment Files ({fileUrls.length})</h3>
      <div className="grid grid-cols-1 gap-3">
        {fileUrls.map((url, index) => {
          const isImage = url.match(/\.(jpeg|jpg|gif|png)$/i);
          
          return (
            <Card key={index} className="overflow-hidden">
              {isImage && (
                <div className="w-full h-48 bg-gray-100 overflow-hidden">
                  <img src={url} alt="File preview" className="w-full h-full object-contain" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getFileIcon(url)}
                    <span className="font-medium break-all">
                      {getFileName(url)}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        View
                      </a>
                    </Button>
                    <Button 
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a 
                        href={url} 
                        download
                        rel="noopener noreferrer" 
                      >
                        <Download className="h-4 w-4 mr-1" /> Download
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  );
};

export default FileAttachments;
