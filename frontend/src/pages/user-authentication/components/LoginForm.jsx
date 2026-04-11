import { useTranslation } from "react-i18next";import React, { useState } from 'react';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';
import Icon from '../../../components/AppIcon';

const LoginForm = ({ onSubmit, isLoading, onForgotPassword }) => {const { t } = useTranslation();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e?.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors?.[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/?.test(formData?.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData?.password) {
      newErrors.password = 'Password is required';
    } else if (formData?.password?.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
   <Input
        label={t("userAuthentication.emailAddress")}
        type="email"
        name="email"
        value={formData?.email}
        onChange={handleInputChange}
        placeholder={t("userAuthentication.enterYourEmail")}
        error={errors?.email}
        required
        disabled={isLoading} />
      
   <div className="relative">
    <Input
          label={t("userAuthentication.password")}
          type={showPassword ? "text" : "password"}
          name="password"
          value={formData?.password}
          onChange={handleInputChange}
          placeholder={t("userAuthentication.enterYourPassword")}
          error={errors?.password}
          required
          disabled={isLoading} />
        
    <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-9 text-muted-foreground hover:text-foreground transition-colors"
          disabled={isLoading}>
          
     <Icon name={showPassword ? "EyeOff" : "Eye"} size={18} />
    </button>
   </div>
   <div className="flex items-center justify-between">
    <Checkbox
          label={t("userAuthentication.rememberMe")}
          name="rememberMe"
          checked={formData?.rememberMe}
          onChange={handleInputChange}
          disabled={isLoading} />
        
    
    <button
          type="button"
          onClick={onForgotPassword}
          className="text-sm text-primary hover:text-primary/80 transition-colors"
          disabled={isLoading}> {t("userAuthentication.forgotPassword")} 


        </button>
   </div>
   <Button
        type="submit"
        variant="default"
        size="lg"
        fullWidth
        loading={isLoading}
        className="mt-6"> {t("userAuthentication.signIn")} 


      </Button>
   <div className="text-center text-sm text-muted-foreground"> {t("userAuthentication.demoCredentialsAdminytdeluxecomPassword")} 

      </div>
  </form>);

};

export default LoginForm;