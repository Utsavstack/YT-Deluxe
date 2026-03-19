import React from 'react';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const SocialAuth = ({ onSocialAuth, isLoading }) => {
 const socialProviders = [
  {
   name: 'Google',
   icon: 'Chrome',
   color: 'bg-red-500 hover:bg-red-600',
   textColor: 'text-white'
  },
  {
   name: 'Facebook',
   icon: 'Facebook',
   color: 'bg-blue-600 hover:bg-blue-700',
   textColor: 'text-white'
  }
 ];

 return (
  <div className="space-y-3">
   <div className="relative">
    <div className="absolute inset-0 flex items-center">
     <div className="w-full border-t border-border" />
    </div>
    <div className="relative flex justify-center text-xs uppercase">
     <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
    </div>
   </div>
   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
    {socialProviders?.map((provider) => (
     <Button
      key={provider?.name}
      variant="outline"
      size="default"
      fullWidth
      disabled={isLoading}
      onClick={() => onSocialAuth(provider?.name?.toLowerCase())}
      className="h-11"
     >
      <div className="flex items-center space-x-2">
       <Icon name={provider?.icon} size={18} />
       <span>{provider?.name}</span>
      </div>
     </Button>
    ))}
   </div>
  </div>
 );
};

export default SocialAuth;