import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { Checkbox } from '../../../components/ui/Checkbox';

const AccountManagement = ({ user, onUserUpdate }) => {
 const [userProfile, setUserProfile] = useState(user || {
  name: 'John Doe',
  email: 'john.doe@example.com',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  joinDate: '2024-01-15',
  subscription: 'free',
  downloadCount: 1247,
  totalSize: '15.6 GB',
  favoriteChannels: 23
 });

 const [isEditing, setIsEditing] = useState(false);
 const [editForm, setEditForm] = useState({
  name: userProfile?.name,
  email: userProfile?.email
 });

 const [privacySettings, setPrivacySettings] = useState({
  shareDownloadStats: true,
  allowAnalytics: true,
  emailNotifications: true,
  publicProfile: false,
  shareWatchHistory: false
 });

 const downloadStats = [
  { label: 'Total Downloads', value: userProfile?.downloadCount, icon: 'Download' },
  { label: 'Total Size', value: userProfile?.totalSize, icon: 'HardDrive' },
  { label: 'Favorite Channels', value: userProfile?.favoriteChannels, icon: 'Heart' },
  { label: 'Account Age', value: `${Math.floor((new Date() - new Date(userProfile.joinDate)) / (1000 * 60 * 60 * 24))} days`, icon: 'Calendar' }
 ];

 const recentActivity = [
  {
   id: 1,
   action: 'Downloaded video',
   title: 'React Tutorial - Complete Guide',
   timestamp: new Date(Date.now() - 3600000),
   icon: 'Download'
  },
  {
   id: 2,
   action: 'Updated preferences',
   title: 'Changed default quality to 1080p',
   timestamp: new Date(Date.now() - 7200000),
   icon: 'Settings'
  },
  {
   id: 3,
   action: 'Batch download completed',
   title: '5 videos from JavaScript Mastery',
   timestamp: new Date(Date.now() - 86400000),
   icon: 'Package'
  }
 ];

 const handleEditToggle = () => {
  if (isEditing) {
   // Save changes
   setUserProfile(prev => ({
    ...prev,
    name: editForm?.name,
    email: editForm?.email
   }));
   onUserUpdate({
    ...userProfile,
    name: editForm?.name,
    email: editForm?.email
   });
  } else {
   // Start editing
   setEditForm({
    name: userProfile?.name,
    email: userProfile?.email
   });
  }
  setIsEditing(!isEditing);
 };

 const handlePrivacyChange = (key, value) => {
  setPrivacySettings(prev => ({
   ...prev,
   [key]: value
  }));
 };

 const exportData = () => {
  const userData = {
   profile: userProfile,
   privacy: privacySettings,
   activity: recentActivity,
   exportDate: new Date()?.toISOString()
  };
  
  const dataStr = JSON.stringify(userData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `ytdeluxe-userdata-${new Date()?.toISOString()?.split('T')?.[0]}.json`;
  document.body?.appendChild(link);
  link?.click();
  document.body?.removeChild(link);
  URL.revokeObjectURL(url);
 };

 const deleteAccount = () => {
  if (confirm('Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data.')) {
   if (confirm('This is your final warning. Your account and all associated data will be permanently deleted. Continue?')) {
    // Account deletion logic would go here
    alert('Account deletion initiated. You will receive a confirmation email shortly.');
   }
  }
 };

 return (
  <div className="space-y-6">
   {/* Profile Information */}
   <div className="glass-card p-6">
    <div className="flex items-center justify-between mb-6">
     <h3 className="text-lg font-semibold text-foreground">Profile Information</h3>
     <Button
      variant={isEditing ? "default" : "outline"}
      size="sm"
      iconName={isEditing ? "Check" : "Edit"}
      iconPosition="left"
      onClick={handleEditToggle}
     >
      {isEditing ? 'Save' : 'Edit'}
     </Button>
    </div>

    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
     {/* Avatar */}
     <div className="relative">
      <div className="w-20 h-20 rounded-full overflow-hidden bg-muted">
       <img
        src={userProfile?.avatar}
        alt={userProfile?.name}
        className="w-full h-full object-cover"
        onError={(e) => {
         e.target.src = '/assets/images/no_image.png';
        }}
       />
      </div>
      <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors">
       <Icon name="Camera" size={12} />
      </button>
     </div>

     {/* Profile Details */}
     <div className="flex-1 space-y-3">
      {isEditing ? (
       <div className="space-y-3">
        <Input
         label="Full Name"
         value={editForm?.name}
         onChange={(e) => setEditForm(prev => ({ ...prev, name: e?.target?.value }))}
        />
        <Input
         label="Email Address"
         type="email"
         value={editForm?.email}
         onChange={(e) => setEditForm(prev => ({ ...prev, email: e?.target?.value }))}
        />
       </div>
      ) : (
       <div>
        <h4 className="text-xl font-semibold text-foreground">{userProfile?.name}</h4>
        <p className="text-muted-foreground">{userProfile?.email}</p>
        <div className="flex items-center space-x-4 mt-2">
         <span className="text-sm text-muted-foreground">
          Joined {new Date(userProfile.joinDate)?.toLocaleDateString()}
         </span>
         <span className={`px-2 py-1 text-xs rounded-full ${
          userProfile?.subscription === 'premium' ?'bg-primary text-primary-foreground' :'bg-muted text-muted-foreground'
         }`}>
          {userProfile?.subscription === 'premium' ? 'Premium' : 'Free'}
         </span>
        </div>
       </div>
      )}
     </div>
    </div>
   </div>
   {/* Download Statistics */}
   <div className="glass-card p-6">
    <div className="mb-4">
     <h3 className="text-lg font-semibold text-foreground">Download Statistics</h3>
     <p className="text-sm text-muted-foreground">Your download activity overview</p>
    </div>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
     {downloadStats?.map((stat, index) => (
      <div key={index} className="glass rounded-lg p-4 text-center">
       <div className="flex items-center justify-center w-10 h-10 bg-primary/10 text-primary rounded-lg mx-auto mb-2">
        <Icon name={stat?.icon} size={20} />
       </div>
       <p className="text-lg font-semibold text-foreground">{stat?.value}</p>
       <p className="text-xs text-muted-foreground">{stat?.label}</p>
      </div>
     ))}
    </div>
   </div>
   {/* Recent Activity */}
   <div className="glass-card p-6">
    <div className="mb-4">
     <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
     <p className="text-sm text-muted-foreground">Your latest actions and downloads</p>
    </div>

    <div className="space-y-3">
     {recentActivity?.map((activity) => (
      <div key={activity?.id} className="flex items-center space-x-3 p-3 glass rounded-lg">
       <div className="flex items-center justify-center w-8 h-8 bg-accent text-accent-foreground rounded-lg flex-shrink-0">
        <Icon name={activity?.icon} size={16} />
       </div>
       <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{activity?.action}</p>
        <p className="text-xs text-muted-foreground truncate">{activity?.title}</p>
       </div>
       <span className="text-xs text-muted-foreground flex-shrink-0">
        {activity?.timestamp?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
       </span>
      </div>
     ))}
    </div>
   </div>
   {/* Privacy Controls */}
   <div className="glass-card p-6">
    <div className="mb-4">
     <h3 className="text-lg font-semibold text-foreground">Privacy Controls</h3>
     <p className="text-sm text-muted-foreground">Manage your privacy and data sharing preferences</p>
    </div>

    <div className="space-y-4">
     <Checkbox
      label="Share download statistics"
      description="Allow anonymous sharing of download statistics for service improvement"
      checked={privacySettings?.shareDownloadStats}
      onChange={(e) => handlePrivacyChange('shareDownloadStats', e?.target?.checked)}
     />

     <Checkbox
      label="Enable analytics"
      description="Help improve the service by sharing usage analytics"
      checked={privacySettings?.allowAnalytics}
      onChange={(e) => handlePrivacyChange('allowAnalytics', e?.target?.checked)}
     />

     <Checkbox
      label="Email notifications"
      description="Receive email notifications about account activity"
      checked={privacySettings?.emailNotifications}
      onChange={(e) => handlePrivacyChange('emailNotifications', e?.target?.checked)}
     />

     <Checkbox
      label="Public profile"
      description="Make your profile visible to other users"
      checked={privacySettings?.publicProfile}
      onChange={(e) => handlePrivacyChange('publicProfile', e?.target?.checked)}
     />

     <Checkbox
      label="Share watch history"
      description="Allow sharing of anonymized watch history data"
      checked={privacySettings?.shareWatchHistory}
      onChange={(e) => handlePrivacyChange('shareWatchHistory', e?.target?.checked)}
     />
    </div>
   </div>
   {/* Data Management */}
   <div className="glass-card p-6">
    <div className="mb-4">
     <h3 className="text-lg font-semibold text-foreground">Data Management</h3>
     <p className="text-sm text-muted-foreground">Export or manage your personal data</p>
    </div>

    <div className="space-y-4">
     <div className="flex flex-wrap gap-3">
      <Button
       variant="outline"
       iconName="Download"
       iconPosition="left"
       onClick={exportData}
      >
       Export My Data
      </Button>

      <Button
       variant="outline"
       iconName="RefreshCw"
       iconPosition="left"
       onClick={() => {
        // Refresh data logic
        console.log('Refreshing user data...');
       }}
      >
       Refresh Data
      </Button>
     </div>

     <div className="p-3 bg-muted/50 rounded-lg">
      <div className="flex items-start space-x-2">
       <Icon name="Info" size={16} className="text-primary mt-0.5 flex-shrink-0" />
       <div className="text-sm">
        <p className="font-medium text-foreground">Data Export</p>
        <p className="text-muted-foreground">
         Your exported data includes profile information, download history, preferences, and activity logs in JSON format.
        </p>
       </div>
      </div>
     </div>
    </div>
   </div>
   {/* Account Actions */}
   <div className="glass-card p-6 border-destructive/20">
    <div className="mb-4">
     <h3 className="text-lg font-semibold text-destructive">Account Actions</h3>
     <p className="text-sm text-muted-foreground">Manage your account status and data</p>
    </div>

    <div className="space-y-4">
     <div className="flex flex-wrap gap-3">
      <Button
       variant="outline"
       iconName="Pause"
       iconPosition="left"
       className="border-warning text-warning hover:bg-warning/10"
       onClick={() => {
        if (confirm('Temporarily deactivate your account? You can reactivate it anytime by signing in.')) {
         console.log('Account deactivated');
        }
       }}
      >
       Deactivate Account
      </Button>

      <Button
       variant="destructive"
       iconName="Trash2"
       iconPosition="left"
       onClick={deleteAccount}
      >
       Delete Account
      </Button>
     </div>

     <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
      <div className="flex items-start space-x-2">
       <Icon name="AlertTriangle" size={16} className="text-destructive mt-0.5 flex-shrink-0" />
       <div className="text-sm">
        <p className="font-medium text-destructive">Warning</p>
        <p className="text-muted-foreground">
         Account deletion is permanent and cannot be undone. All your data, including download history and preferences, will be permanently deleted.
        </p>
       </div>
      </div>
     </div>
    </div>
   </div>
  </div>
 );
};

export default AccountManagement;