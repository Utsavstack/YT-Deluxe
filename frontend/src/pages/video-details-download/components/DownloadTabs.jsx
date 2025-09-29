import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const DownloadTabs = ({ videoData, onDownload }) => {
  const [activeTab, setActiveTab] = useState('video');
  const [selectedQuality, setSelectedQuality] = useState('1080p');
  const [selectedFormat, setSelectedFormat] = useState('mp4');
  const [customFilename, setCustomFilename] = useState(videoData?.title);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const tabs = [
    { id: 'video', label: 'Video', icon: 'Video' },
    { id: 'audio', label: 'Audio', icon: 'Music' },
    { id: 'thumbnail', label: 'Thumbnail', icon: 'Image' }
  ];

  const videoQualities = [
    { 
      quality: '1080p', 
      format: 'MP4', 
      size: '45.2 MB', 
      label: 'Excellent',
      description: 'Best quality for viewing'
    },
    { 
      quality: '720p', 
      format: 'MP4', 
      size: '28.7 MB', 
      label: 'Good',
      description: 'Balanced quality and size'
    },
    { 
      quality: '480p', 
      format: 'MP4', 
      size: '18.3 MB', 
      label: 'Medium',
      description: 'Standard definition'
    },
    { 
      quality: '360p', 
      format: 'MP4', 
      size: '12.1 MB', 
      label: 'Low',
      description: 'Smaller file size'
    },
    { 
      quality: '144p', 
      format: 'MP4', 
      size: '5.8 MB', 
      label: 'Average',
      description: 'Minimum quality'
    }
  ];

  const audioQualities = [
    { 
      quality: '320kbps', 
      format: 'MP3', 
      size: '8.2 MB', 
      label: 'Excellent',
      description: 'High quality audio'
    },
    { 
      quality: '256kbps', 
      format: 'MP3', 
      size: '6.8 MB', 
      label: 'Good',
      description: 'Good quality audio'
    },
    { 
      quality: '128kbps', 
      format: 'MP3', 
      size: '3.4 MB', 
      label: 'Medium',
      description: 'Standard quality'
    },
    { 
      quality: '96kbps', 
      format: 'MP3', 
      size: '2.6 MB', 
      label: 'Average',
      description: 'Basic quality'
    }
  ];

  const thumbnailOptions = [
    { 
      quality: 'Max Resolution', 
      format: 'JPG', 
      size: '245 KB', 
      label: 'Excellent',
      description: '1920x1080 pixels'
    },
    { 
      quality: 'High Resolution', 
      format: 'JPG', 
      size: '156 KB', 
      label: 'Good',
      description: '1280x720 pixels'
    },
    { 
      quality: 'Medium Resolution', 
      format: 'JPG', 
      size: '89 KB', 
      label: 'Medium',
      description: '640x480 pixels'
    }
  ];

  const getQualityOptions = () => {
    switch (activeTab) {
      case 'video':
        return videoQualities;
      case 'audio':
        return audioQualities;
      case 'thumbnail':
        return thumbnailOptions;
      default:
        return videoQualities;
    }
  };

  const getPresetButtons = () => {
    const options = getQualityOptions();
    return [
      options?.find(opt => opt?.label === 'Excellent'),
      options?.find(opt => opt?.label === 'Medium'),
      options?.find(opt => opt?.label === 'Average')
    ]?.filter(Boolean);
  };

  const handlePresetDownload = (preset) => {
    onDownload({
      type: activeTab,
      quality: preset?.quality,
      format: preset?.format,
      filename: customFilename,
      size: preset?.size
    });
  };

  const handleCustomDownload = () => {
    const selectedOption = getQualityOptions()?.find(opt => opt?.quality === selectedQuality);
    onDownload({
      type: activeTab,
      quality: selectedQuality,
      format: selectedFormat,
      filename: customFilename,
      size: selectedOption?.size || 'Unknown'
    });
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 glass-nav p-1">
        {tabs?.map((tab) => (
          <button
            key={tab?.id}
            onClick={() => setActiveTab(tab?.id)}
            className={`
              flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium
              transition-all duration-200 spring-smooth flex-1 justify-center
              ${activeTab === tab?.id
                ? 'bg-primary text-primary-foreground shadow-glass-sm'
                : 'text-foreground hover:bg-accent hover:text-accent-foreground'
              }
            `}
          >
            <Icon name={tab?.icon} size={16} />
            <span>{tab?.label}</span>
          </button>
        ))}
      </div>
      {/* Quality Presets */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Quick Download</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {getPresetButtons()?.map((preset, index) => (
            <div key={index} className="glass-card p-4 hover:shadow-glass-md transition-all spring-smooth">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    preset?.label === 'Excellent' ? 'bg-success' :
                    preset?.label === 'Medium' ? 'bg-warning' : 'bg-muted-foreground'
                  }`} />
                  <span className="font-semibold text-foreground">{preset?.label}</span>
                </div>
                <span className="text-sm text-muted-foreground">{preset?.size}</span>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Quality:</span>
                  <span className="text-foreground font-medium">{preset?.quality}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Format:</span>
                  <span className="text-foreground font-medium">{preset?.format}</span>
                </div>
                <p className="text-xs text-muted-foreground">{preset?.description}</p>
              </div>
              
              <Button
                variant="default"
                size="sm"
                fullWidth
                onClick={() => handlePresetDownload(preset)}
                iconName="Download"
                iconPosition="left"
              >
                Download {preset?.label}
              </Button>
            </div>
          ))}
        </div>
      </div>
      {/* Advanced Options */}
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => setShowAdvanced(!showAdvanced)}
          iconName={showAdvanced ? "ChevronUp" : "ChevronDown"}
          iconPosition="right"
          className="w-full justify-between"
        >
          Advanced Options
        </Button>

        {showAdvanced && (
          <div className="glass-card p-6 space-y-6 animate-slide-down">
            {/* Quality Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Select Quality</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {getQualityOptions()?.map((option) => (
                  <button
                    key={option?.quality}
                    onClick={() => setSelectedQuality(option?.quality)}
                    className={`
                      p-3 rounded-lg border text-left transition-all spring-smooth
                      ${selectedQuality === option?.quality
                        ? 'border-primary bg-primary/10 text-primary' :'border-border hover:border-primary/50 text-foreground'
                      }
                    `}
                  >
                    <div className="font-medium">{option?.quality}</div>
                    <div className="text-xs opacity-70">{option?.format} • {option?.size}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Format Selection */}
            {activeTab === 'video' && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Output Format</label>
                <div className="flex space-x-2">
                  {['mp4', 'webm', 'avi']?.map((format) => (
                    <button
                      key={format}
                      onClick={() => setSelectedFormat(format)}
                      className={`
                        px-4 py-2 rounded-lg text-sm font-medium transition-all spring-smooth
                        ${selectedFormat === format
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-accent text-accent-foreground hover:bg-accent/80'
                        }
                      `}
                    >
                      {format?.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'audio' && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Output Format</label>
                <div className="flex space-x-2">
                  {['mp3', 'wav', 'flac']?.map((format) => (
                    <button
                      key={format}
                      onClick={() => setSelectedFormat(format)}
                      className={`
                        px-4 py-2 rounded-lg text-sm font-medium transition-all spring-smooth
                        ${selectedFormat === format
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-accent text-accent-foreground hover:bg-accent/80'
                        }
                      `}
                    >
                      {format?.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Filename Customization */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Custom Filename</label>
              <div className="relative">
                <input
                  type="text"
                  value={customFilename}
                  onChange={(e) => setCustomFilename(e?.target?.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                  placeholder="Enter custom filename"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  .{selectedFormat}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Preview: {customFilename}.{selectedFormat}
              </p>
            </div>

            {/* Custom Download Button */}
            <Button
              variant="default"
              size="lg"
              fullWidth
              onClick={handleCustomDownload}
              iconName="Download"
              iconPosition="left"
            >
              Download Custom
            </Button>
          </div>
        )}
      </div>
      {/* Quality Comparison Table */}
      <div className="glass-card p-6">
        <h4 className="text-lg font-semibold text-foreground mb-4">Quality Comparison</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-muted-foreground">Quality</th>
                <th className="text-left py-2 text-muted-foreground">Format</th>
                <th className="text-left py-2 text-muted-foreground">File Size</th>
                <th className="text-left py-2 text-muted-foreground">Best For</th>
              </tr>
            </thead>
            <tbody>
              {getQualityOptions()?.map((option, index) => (
                <tr key={index} className="border-b border-border/50">
                  <td className="py-2 font-medium text-foreground">{option?.quality}</td>
                  <td className="py-2 text-muted-foreground">{option?.format}</td>
                  <td className="py-2 text-muted-foreground">{option?.size}</td>
                  <td className="py-2 text-muted-foreground">{option?.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DownloadTabs;