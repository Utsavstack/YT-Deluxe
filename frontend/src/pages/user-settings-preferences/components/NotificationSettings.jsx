import React, { useState } from 'react';

import { Checkbox } from '../../../components/ui/Checkbox';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';

const NotificationSettings = ({ settings, onSettingsChange }) => {
 const [notificationSettings, setNotificationSettings] = useState(settings);

 const soundOptions = [
  { value: 'default', label: 'Default System Sound' },
  { value: 'chime', label: 'Chime' },
  { value: 'bell', label: 'Bell' },
  { value: 'pop', label: 'Pop' },
  { value: 'none', label: 'No Sound' }
 ];

 const positionOptions = [
  { value: 'top-right', label: 'Top Right' },
  { value: 'top-left', label: 'Top Left' },
  { value: 'bottom-right', label: 'Bottom Right' },
  { value: 'bottom-left', label: 'Bottom Left' },
  { value: 'center', label: 'Center' }
 ];

 const handleSettingChange = (key, value) => {
  const updated = { ...notificationSettings, [key]: value };
  setNotificationSettings(updated);
  onSettingsChange(updated);
 };

 const testNotification = () => {
  if ('Notification' in window && Notification.permission === 'granted') {
   new Notification('YT Deluxe Test', {
    body: 'This is a test notification from YT Deluxe',
    icon: '/favicon.ico'
   });
  } else if ('Notification' in window && Notification.permission !== 'denied') {
   Notification.requestPermission()?.then(permission => {
    if (permission === 'granted') {
     new Notification('YT Deluxe Test', {
      body: 'This is a test notification from YT Deluxe',
      icon: '/favicon.ico'
     });
    }
   });
  }
 };

 return (
  <div className="space-y-6">
   {/* Browser Notifications */}
   <div className="glass-card p-6">
    <div className="flex items-center justify-between mb-4">
     <div>
      <h3 className="text-lg font-semibold text-foreground">Browser Notifications</h3>
      <p className="text-sm text-muted-foreground">Control desktop notification alerts</p>
     </div>
     <button
      onClick={testNotification}
      className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
     >
      Test
     </button>
    </div>

    <div className="space-y-4">
     <Checkbox
      label="Enable browser notifications"
      description="Show desktop notifications for important events"
      checked={notificationSettings?.browserNotifications}
      onChange={(e) => handleSettingChange('browserNotifications', e?.target?.checked)}
     />

     {notificationSettings?.browserNotifications && (
      <div className="ml-6 space-y-4 border-l-2 border-border pl-4">
       <Checkbox
        label="Download completion"
        description="Notify when downloads finish"
        checked={notificationSettings?.downloadComplete}
        onChange={(e) => handleSettingChange('downloadComplete', e?.target?.checked)}
       />

       <Checkbox
        label="Download errors"
        description="Notify when downloads fail"
        checked={notificationSettings?.downloadError}
        onChange={(e) => handleSettingChange('downloadError', e?.target?.checked)}
       />

       <Checkbox
        label="Batch download progress"
        description="Notify about batch download milestones"
        checked={notificationSettings?.batchProgress}
        onChange={(e) => handleSettingChange('batchProgress', e?.target?.checked)}
       />

       <Checkbox
        label="Storage space warnings"
        description="Notify when storage space is low"
        checked={notificationSettings?.storageWarnings}
        onChange={(e) => handleSettingChange('storageWarnings', e?.target?.checked)}
       />
      </div>
     )}
    </div>
   </div>
   {/* Sound Settings */}
   <div className="glass-card p-6">
    <div className="mb-4">
     <h3 className="text-lg font-semibold text-foreground">Sound Notifications</h3>
     <p className="text-sm text-muted-foreground">Configure audio alerts for events</p>
    </div>

    <div className="space-y-4">
     <Checkbox
      label="Enable sound notifications"
      description="Play sounds for notification events"
      checked={notificationSettings?.soundEnabled}
      onChange={(e) => handleSettingChange('soundEnabled', e?.target?.checked)}
     />

     {notificationSettings?.soundEnabled && (
      <div className="ml-6 space-y-4 border-l-2 border-border pl-4">
       <Select
        label="Notification Sound"
        description="Choose the notification sound"
        options={soundOptions}
        value={notificationSettings?.soundType}
        onChange={(value) => handleSettingChange('soundType', value)}
       />

       <Input
        label="Volume"
        type="range"
        min="0"
        max="100"
        value={notificationSettings?.volume}
        onChange={(e) => handleSettingChange('volume', parseInt(e?.target?.value))}
        description={`Volume: ${notificationSettings?.volume}%`}
       />

       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Checkbox
         label="Download completion sound"
         checked={notificationSettings?.soundOnComplete}
         onChange={(e) => handleSettingChange('soundOnComplete', e?.target?.checked)}
        />

        <Checkbox
         label="Error sound"
         checked={notificationSettings?.soundOnError}
         onChange={(e) => handleSettingChange('soundOnError', e?.target?.checked)}
        />
       </div>
      </div>
     )}
    </div>
   </div>
   {/* In-App Notifications */}
   <div className="glass-card p-6">
    <div className="mb-4">
     <h3 className="text-lg font-semibold text-foreground">In-App Notifications</h3>
     <p className="text-sm text-muted-foreground">Control notifications within the application</p>
    </div>

    <div className="space-y-4">
     <Select
      label="Notification Position"
      description="Where to show in-app notifications"
      options={positionOptions}
      value={notificationSettings?.position}
      onChange={(value) => handleSettingChange('position', value)}
     />

     <Input
      label="Auto-dismiss Time (seconds)"
      type="number"
      min="1"
      max="30"
      value={notificationSettings?.autoDismissTime}
      onChange={(e) => handleSettingChange('autoDismissTime', parseInt(e?.target?.value))}
      description="How long notifications stay visible"
     />

     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Checkbox
       label="Show progress notifications"
       description="Display download progress in notifications"
       checked={notificationSettings?.showProgress}
       onChange={(e) => handleSettingChange('showProgress', e?.target?.checked)}
      />

      <Checkbox
       label="Persistent error notifications"
       description="Keep error notifications until dismissed"
       checked={notificationSettings?.persistentErrors}
       onChange={(e) => handleSettingChange('persistentErrors', e?.target?.checked)}
      />

      <Checkbox
       label="Show success animations"
       description="Animate successful operations"
       checked={notificationSettings?.successAnimations}
       onChange={(e) => handleSettingChange('successAnimations', e?.target?.checked)}
      />

      <Checkbox
       label="Minimize to system tray"
       description="Show tray notifications when minimized"
       checked={notificationSettings?.systemTray}
       onChange={(e) => handleSettingChange('systemTray', e?.target?.checked)}
      />
     </div>
    </div>
   </div>
   {/* Email Notifications */}
   <div className="glass-card p-6">
    <div className="mb-4">
     <h3 className="text-lg font-semibold text-foreground">Email Notifications</h3>
     <p className="text-sm text-muted-foreground">Receive notifications via email</p>
    </div>

    <div className="space-y-4">
     <Checkbox
      label="Enable email notifications"
      description="Send notifications to your email address"
      checked={notificationSettings?.emailNotifications}
      onChange={(e) => handleSettingChange('emailNotifications', e?.target?.checked)}
     />

     {notificationSettings?.emailNotifications && (
      <div className="ml-6 space-y-4 border-l-2 border-border pl-4">
       <Input
        label="Email Address"
        type="email"
        value={notificationSettings?.emailAddress}
        onChange={(e) => handleSettingChange('emailAddress', e?.target?.value)}
        placeholder="your@email.com"
        description="Email address for notifications"
       />

       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Checkbox
         label="Daily download summary"
         checked={notificationSettings?.dailySummary}
         onChange={(e) => handleSettingChange('dailySummary', e?.target?.checked)}
        />

        <Checkbox
         label="Weekly activity report"
         checked={notificationSettings?.weeklyReport}
         onChange={(e) => handleSettingChange('weeklyReport', e?.target?.checked)}
        />

        <Checkbox
         label="Large batch completion"
         checked={notificationSettings?.batchCompletion}
         onChange={(e) => handleSettingChange('batchCompletion', e?.target?.checked)}
        />

        <Checkbox
         label="System maintenance alerts"
         checked={notificationSettings?.maintenanceAlerts}
         onChange={(e) => handleSettingChange('maintenanceAlerts', e?.target?.checked)}
        />
       </div>
      </div>
     )}
    </div>
   </div>
  </div>
 );
};

export default NotificationSettings;