import { useTranslation } from "react-i18next";import React, { useState, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const BatchInputSection = ({ onAddUrls, onImportFromClipboard }) => {const { t } = useTranslation();
  const [bulkUrls, setBulkUrls] = useState('');
  const [singleUrl, setSingleUrl] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleBulkSubmit = () => {
    if (!bulkUrls?.trim()) return;

    const urls = bulkUrls?.split('\n')?.map((url) => url?.trim())?.filter((url) => url && isValidYouTubeUrl(url));

    if (urls?.length > 0) {
      onAddUrls(urls);
      setBulkUrls('');
    }
  };

  const handleSingleSubmit = () => {
    if (!singleUrl?.trim()) return;

    if (isValidYouTubeUrl(singleUrl)) {
      onAddUrls([singleUrl]);
      setSingleUrl('');
    }
  };

  const isValidYouTubeUrl = (url) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    return youtubeRegex?.test(url);
  };

  const handleDragOver = (e) => {
    e?.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e?.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e?.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e?.dataTransfer?.files);
    const textFiles = files?.filter((file) => file?.type === 'text/plain');

    if (textFiles?.length > 0) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result;
        setBulkUrls(content);
      };
      reader?.readAsText(textFiles?.[0]);
    }
  };

  const handleFileSelect = (e) => {
    const file = e?.target?.files?.[0];
    if (file && file?.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result;
        setBulkUrls(content);
      };
      reader?.readAsText(file);
    }
  };

  const handleClipboardImport = async () => {
    try {
      const text = await navigator.clipboard?.readText();
      const urls = text?.split('\n')?.map((url) => url?.trim())?.filter((url) => url && isValidYouTubeUrl(url));

      if (urls?.length > 0) {
        onImportFromClipboard(urls);
      }
    } catch (error) {
      console.error('Failed to read clipboard:', error);
    }
  };

  return (
    <div className="space-y-6">
   {/* Header */}
   <div className="text-center">
    <h2 className="text-2xl font-bold text-foreground mb-2">{t("batchDownloadManager.addVideosToQueue")}</h2>
    <p className="text-muted-foreground"> {t("batchDownloadManager.addMultipleYoutubeUrls")} 

        </p>
   </div>
   {/* Clipboard Import */}
   <div className="glass-card p-4">
    <div className="flex items-center justify-between">
     <div className="flex items-center space-x-3">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
       <Icon name="Clipboard" size={20} className="text-primary" />
      </div>
      <div>
       <h3 className="font-semibold text-foreground">{t("batchDownloadManager.importFromClipboard")}</h3>
       <p className="text-sm text-muted-foreground"> {t("batchDownloadManager.automaticallyDetectYoutubeUrls")} 

              </p>
      </div>
     </div>
     <Button
            variant="outline"
            onClick={handleClipboardImport}
            iconName="Import"
            iconPosition="left"> {t("batchDownloadManager.import")} 


          </Button>
    </div>
   </div>
   {/* Bulk URL Input */}
   <div className="glass-card p-6">
    <div className="flex items-center space-x-2 mb-4">
     <Icon name="List" size={20} className="text-primary" />
     <h3 className="text-lg font-semibold text-foreground">{t("batchDownloadManager.bulkUrlInput")}</h3>
    </div>
    
    <div className="space-y-4">
     <textarea
            value={bulkUrls}
            onChange={(e) => setBulkUrls(e?.target?.value)}
            placeholder={t("batchDownloadManager.pasteMultipleYoutubeUrls")}
            className="w-full h-32 px-3 py-2 border border-border rounded-lg bg-input text-foreground resize-none focus:ring-2 focus:ring-ring focus:border-transparent" />
          
     
     <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">
       {bulkUrls?.split('\n')?.filter((url) => url?.trim() && isValidYouTubeUrl(url?.trim()))?.length} {t("batchDownloadManager.validUrlsDetected")} 
            </span>
      <Button
              variant="default"
              onClick={handleBulkSubmit}
              disabled={!bulkUrls?.trim()}
              iconName="Plus"
              iconPosition="left"> {t("batchDownloadManager.addToQueue")} 


            </Button>
     </div>
    </div>
   </div>
   {/* Drag & Drop Zone */}
   <div
        className={`glass-card p-8 border-2 border-dashed transition-all duration-200 ${
        isDragOver ?
        'border-primary bg-primary/5 scale-105' : 'border-border hover:border-primary/50'}`
        }
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}>
        
    <div className="text-center">
     <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
      <Icon name="Upload" size={24} className="text-primary" />
     </div>
     <h3 className="text-lg font-semibold text-foreground mb-2"> {t("batchDownloadManager.dropTextFileHere")} 

          </h3>
     <p className="text-muted-foreground mb-4"> {t("batchDownloadManager.orClickToBrowse")} 

          </p>
     <Button
            variant="outline"
            onClick={() => fileInputRef?.current?.click()}
            iconName="FileText"
            iconPosition="left"> {t("batchDownloadManager.browseFiles")} 


          </Button>
     <input
            ref={fileInputRef}
            type="file"
            accept=".txt"
            onChange={handleFileSelect}
            className="hidden" />
          
    </div>
   </div>
   {/* Single URL Input */}
   <div className="glass-card p-6">
    <div className="flex items-center space-x-2 mb-4">
     <Icon name="Link" size={20} className="text-primary" />
     <h3 className="text-lg font-semibold text-foreground">{t("batchDownloadManager.addSingleUrl")}</h3>
    </div>
    
    <div className="flex space-x-3">
     <Input
            type="url"
            placeholder={t("batchDownloadManager.httpsyoutubecomwatchv")}
            value={singleUrl}
            onChange={(e) => setSingleUrl(e?.target?.value)}
            className="flex-1" />
          
     <Button
            variant="default"
            onClick={handleSingleSubmit}
            disabled={!singleUrl?.trim() || !isValidYouTubeUrl(singleUrl)}
            iconName="Plus"
            iconPosition="left"> {t("batchDownloadManager.add")} 


          </Button>
    </div>
   </div>
  </div>);

};

export default BatchInputSection;