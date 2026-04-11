import { useTranslation } from "react-i18next";import React from 'react';
import Button from '../../../components/ui/Button';

const AuthToggle = ({ isLogin, onToggle }) => {const { t } = useTranslation();
  return (
    <div className="flex bg-muted rounded-lg p-1 mb-6">
   <Button
        variant={isLogin ? "default" : "ghost"}
        size="sm"
        fullWidth
        onClick={() => onToggle(true)}
        className="rounded-md"> {t("userAuthentication.signIn")} 


      </Button>
   <Button
        variant={!isLogin ? "default" : "ghost"}
        size="sm"
        fullWidth
        onClick={() => onToggle(false)}
        className="rounded-md"> {t("userAuthentication.signUp")} 


      </Button>
  </div>);

};

export default AuthToggle;