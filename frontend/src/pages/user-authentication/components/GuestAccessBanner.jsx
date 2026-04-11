import { useTranslation } from "react-i18next";import React from 'react';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const GuestAccessBanner = ({ onGuestAccess }) => {const { t } = useTranslation();
  return (
    <div className="mt-6 p-4 glass-card border border-accent/50">
   <div className="flex items-start space-x-3">
    <div className="flex-shrink-0 w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
     <Icon name="UserCheck" size={20} className="text-primary" />
    </div>
    <div className="flex-1 min-w-0">
     <h3 className="text-sm font-semibold text-foreground mb-1"> {t("userAuthentication.tryWithoutAccount")} 

          </h3>
     <p className="text-xs text-muted-foreground mb-3"> {t("userAuthentication.accessBasicFeaturesWithout")} 

          </p>
     <Button
            variant="outline"
            size="sm"
            onClick={onGuestAccess}
            iconName="ArrowRight"
            iconPosition="right"> {t("userAuthentication.continueAsGuest")} 


          </Button>
    </div>
   </div>
  </div>);

};

export default GuestAccessBanner;