import { useTranslation } from "react-i18next";import React, { useState } from 'react';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';
import Icon from '../../../components/AppIcon';

const RegisterForm = ({ onSubmit, isLoading }) => {const { t } = useTranslation();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  const getPasswordStrength = (password) => {
    let strength = 0;
    const requirements = {
      length: password?.length >= 8,
      lowercase: /[a-z]/?.test(password),
      uppercase: /[A-Z]/?.test(password),
      number: /\d/?.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/?.test(password)
    };

    Object.values(requirements)?.forEach((req) => {
      if (req) strength++;
    });

    return { strength, requirements };
  };

  const passwordAnalysis = getPasswordStrength(formData?.password);

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.fullName?.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData?.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/?.test(formData?.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData?.password) {
      newErrors.password = 'Password is required';
    } else if (formData?.password?.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData?.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData?.password !== formData?.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData?.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms and conditions';
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

  const getStrengthColor = (strength) => {
    if (strength <= 2) return 'bg-red-500';
    if (strength <= 3) return 'bg-yellow-500';
    if (strength <= 4) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStrengthText = (strength) => {
    if (strength <= 2) return 'Weak';
    if (strength <= 3) return 'Fair';
    if (strength <= 4) return 'Good';
    return 'Strong';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
   <Input
        label={t("userAuthentication.fullName")}
        type="text"
        name="fullName"
        value={formData?.fullName}
        onChange={handleInputChange}
        placeholder={t("userAuthentication.enterYourFullName")}
        error={errors?.fullName}
        required
        disabled={isLoading} />
      
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
          placeholder={t("userAuthentication.createAPassword")}
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
   {formData?.password &&
      <div className="space-y-2">
     <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{t("userAuthentication.passwordStrength")}</span>
      <span className={`font-medium ${
          passwordAnalysis?.strength <= 2 ? 'text-red-500' :
          passwordAnalysis?.strength <= 3 ? 'text-yellow-500' :
          passwordAnalysis?.strength <= 4 ? 'text-blue-500' : 'text-green-500'}`
          }>
       {getStrengthText(passwordAnalysis?.strength)}
      </span>
     </div>
     <div className="w-full bg-muted rounded-full h-2">
      <div
            className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(passwordAnalysis?.strength)}`}
            style={{ width: `${passwordAnalysis?.strength / 5 * 100}%` }} />
          
     </div>
     <div className="grid grid-cols-2 gap-2 text-xs">
      <div className={`flex items-center space-x-1 ${passwordAnalysis?.requirements?.length ? 'text-green-600' : 'text-muted-foreground'}`}>
       <Icon name={passwordAnalysis?.requirements?.length ? "Check" : "X"} size={12} />
       <span>{t("userAuthentication.characters")}</span>
      </div>
      <div className={`flex items-center space-x-1 ${passwordAnalysis?.requirements?.uppercase ? 'text-green-600' : 'text-muted-foreground'}`}>
       <Icon name={passwordAnalysis?.requirements?.uppercase ? "Check" : "X"} size={12} />
       <span>{t("userAuthentication.uppercase")}</span>
      </div>
      <div className={`flex items-center space-x-1 ${passwordAnalysis?.requirements?.lowercase ? 'text-green-600' : 'text-muted-foreground'}`}>
       <Icon name={passwordAnalysis?.requirements?.lowercase ? "Check" : "X"} size={12} />
       <span>{t("userAuthentication.lowercase")}</span>
      </div>
      <div className={`flex items-center space-x-1 ${passwordAnalysis?.requirements?.number ? 'text-green-600' : 'text-muted-foreground'}`}>
       <Icon name={passwordAnalysis?.requirements?.number ? "Check" : "X"} size={12} />
       <span>{t("userAuthentication.number")}</span>
      </div>
     </div>
    </div>
      }
   <div className="relative">
    <Input
          label={t("userAuthentication.confirmPassword")}
          type={showConfirmPassword ? "text" : "password"}
          name="confirmPassword"
          value={formData?.confirmPassword}
          onChange={handleInputChange}
          placeholder={t("userAuthentication.confirmYourPassword")}
          error={errors?.confirmPassword}
          required
          disabled={isLoading} />
        
    <button
          type="button"
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          className="absolute right-3 top-9 text-muted-foreground hover:text-foreground transition-colors"
          disabled={isLoading}>
          
     <Icon name={showConfirmPassword ? "EyeOff" : "Eye"} size={18} />
    </button>
   </div>
   <Checkbox
        label={t("userAuthentication.iAgreeToThe")}
        name="acceptTerms"
        checked={formData?.acceptTerms}
        onChange={handleInputChange}
        error={errors?.acceptTerms}
        required
        disabled={isLoading} />
      
   <Button
        type="submit"
        variant="default"
        size="lg"
        fullWidth
        loading={isLoading}
        className="mt-6"> {t("userAuthentication.createAccount")} 


      </Button>
   <div className="text-center text-sm text-muted-foreground"> {t("userAuthentication.demoUseAnyEmail")} 

      </div>
  </form>);

};

export default RegisterForm;