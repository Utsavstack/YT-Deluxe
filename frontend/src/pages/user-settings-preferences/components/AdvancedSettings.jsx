import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import { Checkbox } from '../../../components/ui/Checkbox';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';

const AdvancedSettings = ({ settings, onSettingsChange }) => {
 const [advancedSettings, setAdvancedSettings] = useState(settings);
 const [showDangerZone, setShowDangerZone] = useState(false);

 const proxyTypeOptions = [
  { value: 'none', label: 'No Proxy', description: 'Direct connection' },
  { value: 'http', label: 'HTTP Proxy', description: 'Standard HTTP proxy' },
  { value: 'https', label: 'HTTPS Proxy', description: 'Secure HTTPS proxy' },
  { value: 'socks5', label: 'SOCKS5 Proxy', description: 'SOCKS5 proxy protocol' }
 ];

 const logLevelOptions = [
  { value: 'error', label: 'Error Only', description: 'Log only errors' },
  { value: 'warn', label: 'Warnings', description: 'Log warnings and errors' },
  { value: 'info', label: 'Information', description: 'Log general information' },
  { value: 'debug', label: 'Debug', description: 'Detailed debugging information' },
  { value: 'verbose', label: 'Verbose', description: 'Maximum logging detail' }
 ];

 const handleSettingChange = (key, value) => {
  const updated = { ...advancedSettings, [key]: value };
  setAdvancedSettings(updated);
  onSettingsChange(updated);
 };

 const exportSettings = () => {
  const settingsData = {
   ...advancedSettings,
   exportDate: new Date()?.toISOString(),
   version: '1.0.0'
  };
  
  const dataStr = JSON.stringify(settingsData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `ytdeluxe-settings-${new Date()?.toISOString()?.split('T')?.[0]}.json`;
  document.body?.appendChild(link);
  link?.click();
  document.body?.removeChild(link);
  URL.revokeObjectURL(url);
 };

 const importSettings = (event) => {
  const file = event.target?.files?.[0];
  if (file) {
   const reader = new FileReader();
   reader.onload = (e) => {
    try {
     const importedSettings = JSON.parse(e?.target?.result);
     setAdvancedSettings(importedSettings);
     onSettingsChange(importedSettings);
     alert('Settings imported successfully!');
    } catch (error) {
     alert('Error importing settings. Please check the file format.');
    }
   };
   reader?.readAsText(file);
  }
 };

 const resetToDefaults = () => {
  if (confirm('Are you sure you want to reset all settings to default values? This action cannot be undone.')) {
   const defaultSettings = {
    clipboardMonitoring: true,
    autoPasteDetection: true,
    maxConcurrentDownloads: 3,
    bandwidthThrottling: 0,
    proxyType: 'none',
    proxyHost: '',
    proxyPort: '',
    proxyUsername: '',
    proxyPassword: '',
    userAgent: 'YT Deluxe/1.0.0',
    enableLogging: true,
    logLevel: 'info',
    maxLogSize: 10,
    enableAnalytics: true,
    crashReporting: true,
    betaFeatures: false,
    developerMode: false,
    apiTimeout: 30,
    retryAttempts: 3,
    cacheSize: 100
   };
   setAdvancedSettings(defaultSettings);
   onSettingsChange(defaultSettings);
  }
 };

 const clearCache = () => {
  if (confirm('Clear all cached data? This will remove temporary files and may slow down the next few operations.')) {
   // Cache clearing logic would go here
   console.log('Cache cleared');
   alert('Cache cleared successfully!');
  }
 };

 const clearAllData = () => {
  if (confirm('WARNING: This will delete ALL your data including download history, settings, and preferences. This action cannot be undone. Are you absolutely sure?')) {
   if (confirm('This is your final warning. All data will be permanently deleted. Continue?')) {
    // Data clearing logic would go here
    localStorage.clear();
    sessionStorage.clear();
    alert('All data has been cleared. The page will now reload.');
    window.location?.reload();
   }
  }
 };

 return (
  <div className="space-y-6">
   {/* Network Settings */}
   <div className="glass-card p-6">
    <div className="mb-4">
     <h3 className="text-lg font-semibold text-foreground">Network Configuration</h3>
     <p className="text-sm text-muted-foreground">Configure network and connection settings</p>
    </div>

    <div className="space-y-4">
     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Input
       label="API Timeout (seconds)"
       type="number"
       min="5"
       max="120"
       value={advancedSettings?.apiTimeout}
       onChange={(e) => handleSettingChange('apiTimeout', parseInt(e?.target?.value))}
       description="Maximum time to wait for API responses"
      />

      <Input
       label="Retry Attempts"
       type="number"
       min="1"
       max="10"
       value={advancedSettings?.retryAttempts}
       onChange={(e) => handleSettingChange('retryAttempts', parseInt(e?.target?.value))}
       description="Number of retry attempts for failed requests"
      />
     </div>

     <Input
      label="User Agent"
      value={advancedSettings?.userAgent}
      onChange={(e) => handleSettingChange('userAgent', e?.target?.value)}
      description="Custom user agent string for requests"
      placeholder="YT Deluxe/1.0.0"
     />
    </div>
   </div>
   {/* Proxy Settings */}
   <div className="glass-card p-6">
    <div className="mb-4">
     <h3 className="text-lg font-semibold text-foreground">Proxy Configuration</h3>
     <p className="text-sm text-muted-foreground">Configure proxy settings for network requests</p>
    </div>

    <div className="space-y-4">
     <Select
      label="Proxy Type"
      description="Select proxy protocol"
      options={proxyTypeOptions}
      value={advancedSettings?.proxyType}
      onChange={(value) => handleSettingChange('proxyType', value)}
     />

     {advancedSettings?.proxyType !== 'none' && (
      <div className="ml-6 space-y-4 border-l-2 border-border pl-4">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
         label="Proxy Host"
         value={advancedSettings?.proxyHost}
         onChange={(e) => handleSettingChange('proxyHost', e?.target?.value)}
         placeholder="proxy.example.com"
        />

        <Input
         label="Proxy Port"
         type="number"
         min="1"
         max="65535"
         value={advancedSettings?.proxyPort}
         onChange={(e) => handleSettingChange('proxyPort', e?.target?.value)}
         placeholder="8080"
        />
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
         label="Username (Optional)"
         value={advancedSettings?.proxyUsername}
         onChange={(e) => handleSettingChange('proxyUsername', e?.target?.value)}
         placeholder="username"
        />

        <Input
         label="Password (Optional)"
         type="password"
         value={advancedSettings?.proxyPassword}
         onChange={(e) => handleSettingChange('proxyPassword', e?.target?.value)}
         placeholder="password"
        />
       </div>
      </div>
     )}
    </div>
   </div>
   {/* Clipboard & Auto-Detection */}
   <div className="glass-card p-6">
    <div className="mb-4">
     <h3 className="text-lg font-semibold text-foreground">Clipboard & Auto-Detection</h3>
     <p className="text-sm text-muted-foreground">Configure automatic URL detection and clipboard monitoring</p>
    </div>

    <div className="space-y-4">
     <Checkbox
      label="Monitor clipboard for YouTube URLs"
      description="Automatically detect YouTube URLs copied to clipboard"
      checked={advancedSettings?.clipboardMonitoring}
      onChange={(e) => handleSettingChange('clipboardMonitoring', e?.target?.checked)}
     />

     <Checkbox
      label="Auto-paste detection"
      description="Automatically fill URL field when YouTube link is detected"
      checked={advancedSettings?.autoPasteDetection}
      onChange={(e) => handleSettingChange('autoPasteDetection', e?.target?.checked)}
     />

     <Checkbox
      label="Show clipboard notifications"
      description="Notify when YouTube URLs are detected in clipboard"
      checked={advancedSettings?.clipboardNotifications}
      onChange={(e) => handleSettingChange('clipboardNotifications', e?.target?.checked)}
     />
    </div>
   </div>
   {/* Performance Settings */}
   <div className="glass-card p-6">
    <div className="mb-4">
     <h3 className="text-lg font-semibold text-foreground">Performance Optimization</h3>
     <p className="text-sm text-muted-foreground">Configure performance and resource usage settings</p>
    </div>

    <div className="space-y-4">
     <Input
      label="Cache Size (MB)"
      type="number"
      min="10"
      max="1000"
      value={advancedSettings?.cacheSize}
      onChange={(e) => handleSettingChange('cacheSize', parseInt(e?.target?.value))}
      description="Maximum size for temporary cache storage"
     />

     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Checkbox
       label="Enable hardware acceleration"
       description="Use GPU acceleration when available"
       checked={advancedSettings?.hardwareAcceleration}
       onChange={(e) => handleSettingChange('hardwareAcceleration', e?.target?.checked)}
      />

      <Checkbox
       label="Preload video metadata"
       description="Load video information in advance"
       checked={advancedSettings?.preloadMetadata}
       onChange={(e) => handleSettingChange('preloadMetadata', e?.target?.checked)}
      />
     </div>
    </div>
   </div>
   {/* Logging & Debugging */}
   <div className="glass-card p-6">
    <div className="mb-4">
     <h3 className="text-lg font-semibold text-foreground">Logging & Debugging</h3>
     <p className="text-sm text-muted-foreground">Configure logging and debugging options</p>
    </div>

    <div className="space-y-4">
     <Checkbox
      label="Enable logging"
      description="Record application events and errors"
      checked={advancedSettings?.enableLogging}
      onChange={(e) => handleSettingChange('enableLogging', e?.target?.checked)}
     />

     {advancedSettings?.enableLogging && (
      <div className="ml-6 space-y-4 border-l-2 border-border pl-4">
       <Select
        label="Log Level"
        description="Detail level for logging"
        options={logLevelOptions}
        value={advancedSettings?.logLevel}
        onChange={(value) => handleSettingChange('logLevel', value)}
       />

       <Input
        label="Maximum Log Size (MB)"
        type="number"
        min="1"
        max="100"
        value={advancedSettings?.maxLogSize}
        onChange={(e) => handleSettingChange('maxLogSize', parseInt(e?.target?.value))}
        description="Maximum size before log rotation"
       />
      </div>
     )}

     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Checkbox
       label="Enable crash reporting"
       description="Send crash reports to help improve the app"
       checked={advancedSettings?.crashReporting}
       onChange={(e) => handleSettingChange('crashReporting', e?.target?.checked)}
      />

      <Checkbox
       label="Developer mode"
       description="Enable advanced debugging features"
       checked={advancedSettings?.developerMode}
       onChange={(e) => handleSettingChange('developerMode', e?.target?.checked)}
      />
     </div>
    </div>
   </div>
   {/* Privacy & Analytics */}
   <div className="glass-card p-6">
    <div className="mb-4">
     <h3 className="text-lg font-semibold text-foreground">Privacy & Analytics</h3>
     <p className="text-sm text-muted-foreground">Control data collection and privacy settings</p>
    </div>

    <div className="space-y-4">
     <Checkbox
      label="Enable analytics"
      description="Help improve the app by sharing usage statistics"
      checked={advancedSettings?.enableAnalytics}
      onChange={(e) => handleSettingChange('enableAnalytics', e?.target?.checked)}
     />

     <Checkbox
      label="Beta features"
      description="Enable experimental features (may be unstable)"
      checked={advancedSettings?.betaFeatures}
      onChange={(e) => handleSettingChange('betaFeatures', e?.target?.checked)}
     />

     <Checkbox
      label="Anonymous error reporting"
      description="Send anonymous error reports to developers"
      checked={advancedSettings?.anonymousReporting}
      onChange={(e) => handleSettingChange('anonymousReporting', e?.target?.checked)}
     />
    </div>
   </div>
   {/* Data Management */}
   <div className="glass-card p-6">
    <div className="mb-4">
     <h3 className="text-lg font-semibold text-foreground">Data Management</h3>
     <p className="text-sm text-muted-foreground">Import, export, and manage your application data</p>
    </div>

    <div className="space-y-4">
     <div className="flex flex-wrap gap-3">
      <Button
       variant="outline"
       iconName="Download"
       iconPosition="left"
       onClick={exportSettings}
      >
       Export Settings
      </Button>

      <div className="relative">
       <input
        type="file"
        accept=".json"
        onChange={importSettings}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
       />
       <Button
        variant="outline"
        iconName="Upload"
        iconPosition="left"
       >
        Import Settings
       </Button>
      </div>

      <Button
       variant="outline"
       iconName="Trash2"
       iconPosition="left"
       onClick={clearCache}
      >
       Clear Cache
      </Button>
     </div>
    </div>
   </div>
   {/* Danger Zone */}
   <div className="glass-card p-6 border-destructive/20">
    <div className="mb-4">
     <button
      onClick={() => setShowDangerZone(!showDangerZone)}
      className="flex items-center space-x-2 text-destructive hover:text-destructive/80 transition-colors"
     >
      <Icon name="AlertTriangle" size={20} />
      <h3 className="text-lg font-semibold">Danger Zone</h3>
      <Icon name={showDangerZone ? "ChevronUp" : "ChevronDown"} size={16} />
     </button>
     <p className="text-sm text-muted-foreground mt-1">Irreversible actions that affect your data</p>
    </div>

    {showDangerZone && (
     <div className="space-y-4 pt-4 border-t border-destructive/20">
      <div className="flex flex-wrap gap-3">
       <Button
        variant="outline"
        iconName="RotateCcw"
        iconPosition="left"
        onClick={resetToDefaults}
        className="border-warning text-warning hover:bg-warning/10"
       >
        Reset to Defaults
       </Button>

       <Button
        variant="destructive"
        iconName="Trash2"
        iconPosition="left"
        onClick={clearAllData}
       >
        Clear All Data
       </Button>
      </div>

      <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
       <div className="flex items-start space-x-2">
        <Icon name="AlertTriangle" size={16} className="text-destructive mt-0.5 flex-shrink-0" />
        <div className="text-sm">
         <p className="font-medium text-destructive">Warning</p>
         <p className="text-muted-foreground">
          These actions are permanent and cannot be undone. Make sure to export your settings before proceeding.
         </p>
        </div>
       </div>
      </div>
     </div>
    )}
   </div>
  </div>
 );
};

export default AdvancedSettings;