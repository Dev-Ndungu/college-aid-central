import React from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, Download, File, Image, FileArchive } from 'lucide-react';

interface FileAttachmentsProps {
  fileUrls: string[] | null;
}

const FileAttachments: React.FC<FileAttachmentsProps> = ({ fileUrls }) => {
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
      
      // Remove the random part (assuming format is timestamp-randomstring.ext)
      const fileNameParts = fullFileName.split('-');
      if (fileNameParts.length > 1) {
        // Take everything after the first dash for readability
        const randomAndExt = fileNameParts.slice(1).join('-');
        
        // Keep only the first 8 characters of the random part + the extension
        const shortRandomPart = randomAndExt.substring(0, 10) + '...';
        
        return shortRandomPart;
      }
      return fullFileName;
    } catch (e) {
      // If we can't parse the URL, return a fallback name
      return "attachment";
    }
  };

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
};

export default FileAttachments;
