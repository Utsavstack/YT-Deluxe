import React from 'react';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const GuestAccessBanner = ({ onGuestAccess }) => {
  return (
    <div className="mt-6 p-4 glass-card border border-accent/50">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
          <Icon name="UserCheck" size={20} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground mb-1">
            Try Without Account
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Access basic features without creating an account. Limited to 3 downloads per session.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={onGuestAccess}
            iconName="ArrowRight"
            iconPosition="right"
          >
            Continue as Guest
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GuestAccessBanner;