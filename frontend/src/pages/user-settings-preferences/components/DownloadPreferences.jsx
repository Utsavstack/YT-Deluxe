import React, { useState } from 'react';

import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import { Checkbox } from '../../../components/ui/Checkbox';
import Button from '../../../components/ui/Button';


const DownloadPreferences = ({ preferences, onPreferencesChange }) => {
  const [downloadPrefs, setDownloadPrefs] = useState(preferences);

  const qualityOptions = [
    { value: '2160p', label: '4K (2160p)', description: 'Ultra HD quality' },
    { value: '1440p', label: '2K (1440p)', description: 'Quad HD quality' },
    { value: '1080p', label: 'Full HD (1080p)', description: 'High definition' },
    { value: '720p', label: 'HD (720p)', description: 'Standard HD' },
    { value: '480p', label: 'SD (480p)', description: 'Standard definition' },
    { value: '360p', label: 'Low (360p)', description: 'Low quality' },
    { value: '144p', label: 'Minimum (144p)', description: 'Lowest quality' }
  ];

  const formatOptions = [
    { value: 'mp4', label: 'MP4', description: 'Most compatible video format' },
    { value: 'webm', label: 'WebM', description: 'Web optimized format' },
    { value: 'mkv', label: 'MKV', description: 'High quality container' },
    { value: 'avi', label: 'AVI', description: 'Legacy video format' }
  ];

  const audioFormatOptions = [
    { value: 'mp3', label: 'MP3', description: 'Most compatible audio format' },
    { value: 'aac', label: 'AAC', description: 'High quality audio' },
    { value: 'ogg', label: 'OGG', description: 'Open source format' },
    { value: 'wav', label: 'WAV', description: 'Uncompressed audio' }
  ];

  const namingConventionOptions = [
    { value: 'title', label: 'Video Title', description: 'Use original video title' },
    { value: 'title_channel', label: 'Title - Channel', description: 'Title with channel name' },
    { value: 'channel_title', label: 'Channel - Title', description: 'Channel name first' },
    { value: 'custom', label: 'Custom Template', description: 'Define your own pattern' }
  ];

  const handlePreferenceChange = (key, value) => {
    const updated = { ...downloadPrefs, [key]: value };
    setDownloadPrefs(updated);
    onPreferencesChange(updated);
  };

  return (
    <div className="space-y-6">
      {/* Default Quality Settings */}
      <div className="glass-card p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground">Default Quality Settings</h3>
          <p className="text-sm text-muted-foreground">Set your preferred download quality and format</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Video Quality"
            description="Default video resolution"
            options={qualityOptions}
            value={downloadPrefs?.defaultVideoQuality}
            onChange={(value) => handlePreferenceChange('defaultVideoQuality', value)}
          />

          <Select
            label="Video Format"
            description="Default video file format"
            options={formatOptions}
            value={downloadPrefs?.defaultVideoFormat}
            onChange={(value) => handlePreferenceChange('defaultVideoFormat', value)}
          />

          <Select
            label="Audio Format"
            description="Default audio file format"
            options={audioFormatOptions}
            value={downloadPrefs?.defaultAudioFormat}
            onChange={(value) => handlePreferenceChange('defaultAudioFormat', value)}
          />

          <div className="flex items-center space-x-4">
            <Checkbox
              label="Auto-select best quality"
              description="Automatically choose the highest available quality"
              checked={downloadPrefs?.autoSelectBestQuality}
              onChange={(e) => handlePreferenceChange('autoSelectBestQuality', e?.target?.checked)}
            />
          </div>
        </div>
      </div>
      {/* File Naming */}
      <div className="glass-card p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground">File Naming</h3>
          <p className="text-sm text-muted-foreground">Customize how downloaded files are named</p>
        </div>

        <div className="space-y-4">
          <Select
            label="Naming Convention"
            description="Choose how files should be named"
            options={namingConventionOptions}
            value={downloadPrefs?.namingConvention}
            onChange={(value) => handlePreferenceChange('namingConvention', value)}
          />

          {downloadPrefs?.namingConvention === 'custom' && (
            <Input
              label="Custom Template"
              description="Use variables: {title}, {channel}, {date}, {quality}"
              placeholder="{channel} - {title} [{quality}]"
              value={downloadPrefs?.customTemplate}
              onChange={(e) => handlePreferenceChange('customTemplate', e?.target?.value)}
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Checkbox
              label="Remove special characters"
              description="Clean filenames for better compatibility"
              checked={downloadPrefs?.removeSpecialChars}
              onChange={(e) => handlePreferenceChange('removeSpecialChars', e?.target?.checked)}
            />

            <Checkbox
              label="Add download date"
              description="Append download date to filename"
              checked={downloadPrefs?.addDownloadDate}
              onChange={(e) => handlePreferenceChange('addDownloadDate', e?.target?.checked)}
            />
          </div>
        </div>
      </div>
      {/* Storage Location */}
      <div className="glass-card p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground">Storage Location</h3>
          <p className="text-sm text-muted-foreground">Choose where to save downloaded files</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Input
              label="Download Folder"
              value={downloadPrefs?.downloadPath}
              onChange={(e) => handlePreferenceChange('downloadPath', e?.target?.value)}
              className="flex-1"
              placeholder="/Users/username/Downloads"
            />
            <Button
              variant="outline"
              iconName="FolderOpen"
              className="mt-6"
              onClick={() => {
                // File picker logic would go here
                console.log('Open folder picker');
              }}
            >
              Browse
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Checkbox
              label="Create subfolders by channel"
              description="Organize downloads by channel name"
              checked={downloadPrefs?.createChannelFolders}
              onChange={(e) => handlePreferenceChange('createChannelFolders', e?.target?.checked)}
            />

            <Checkbox
              label="Create subfolders by date"
              description="Organize downloads by download date"
              checked={downloadPrefs?.createDateFolders}
              onChange={(e) => handlePreferenceChange('createDateFolders', e?.target?.checked)}
            />
          </div>
        </div>
      </div>
      {/* Advanced Options */}
      <div className="glass-card p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground">Advanced Options</h3>
          <p className="text-sm text-muted-foreground">Fine-tune your download experience</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Concurrent Downloads"
            type="number"
            description="Maximum simultaneous downloads"
            min="1"
            max="10"
            value={downloadPrefs?.maxConcurrentDownloads}
            onChange={(e) => handlePreferenceChange('maxConcurrentDownloads', parseInt(e?.target?.value))}
          />

          <Input
            label="Speed Limit (MB/s)"
            type="number"
            description="Bandwidth throttling (0 = unlimited)"
            min="0"
            value={downloadPrefs?.speedLimit}
            onChange={(e) => handlePreferenceChange('speedLimit', parseInt(e?.target?.value))}
          />

          <Checkbox
            label="Resume interrupted downloads"
            description="Continue downloads after interruption"
            checked={downloadPrefs?.resumeDownloads}
            onChange={(e) => handlePreferenceChange('resumeDownloads', e?.target?.checked)}
          />

          <Checkbox
            label="Verify file integrity"
            description="Check downloaded files for corruption"
            checked={downloadPrefs?.verifyIntegrity}
            onChange={(e) => handlePreferenceChange('verifyIntegrity', e?.target?.checked)}
          />

          <Checkbox
            label="Auto-retry failed downloads"
            description="Automatically retry failed downloads"
            checked={downloadPrefs?.autoRetry}
            onChange={(e) => handlePreferenceChange('autoRetry', e?.target?.checked)}
          />

          <Checkbox
            label="Delete source after conversion"
            description="Remove original file after format conversion"
            checked={downloadPrefs?.deleteAfterConversion}
            onChange={(e) => handlePreferenceChange('deleteAfterConversion', e?.target?.checked)}
          />
        </div>
      </div>
    </div>
  );
};

export default DownloadPreferences;