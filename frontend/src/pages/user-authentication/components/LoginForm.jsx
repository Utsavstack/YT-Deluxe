import React, { useState } from 'react';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';
import Icon from '../../../components/AppIcon';

const LoginForm = ({ onSubmit, isLoading, onForgotPassword }) => {
 const [formData, setFormData] = useState({
  email: '',
  password: '',
  rememberMe: false
 });
 const [showPassword, setShowPassword] = useState(false);
 const [errors, setErrors] = useState({});

 const handleInputChange = (e) => {
  const { name, value, type, checked } = e?.target;
  setFormData(prev => ({
   ...prev,
   [name]: type === 'checkbox' ? checked : value
  }));
  
  // Clear error when user starts typing
  if (errors?.[name]) {
   setErrors(prev => ({ ...prev, [name]: '' }));
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
    label="Email Address"
    type="email"
    name="email"
    value={formData?.email}
    onChange={handleInputChange}
    placeholder="Enter your email"
    error={errors?.email}
    required
    disabled={isLoading}
   />
   <div className="relative">
    <Input
     label="Password"
     type={showPassword ? "text" : "password"}
     name="password"
     value={formData?.password}
     onChange={handleInputChange}
     placeholder="Enter your password"
     error={errors?.password}
     required
     disabled={isLoading}
    />
    <button
     type="button"
     onClick={() => setShowPassword(!showPassword)}
     className="absolute right-3 top-9 text-muted-foreground hover:text-foreground transition-colors"
     disabled={isLoading}
    >
     <Icon name={showPassword ? "EyeOff" : "Eye"} size={18} />
    </button>
   </div>
   <div className="flex items-center justify-between">
    <Checkbox
     label="Remember me"
     name="rememberMe"
     checked={formData?.rememberMe}
     onChange={handleInputChange}
     disabled={isLoading}
    />
    
    <button
     type="button"
     onClick={onForgotPassword}
     className="text-sm text-primary hover:text-primary/80 transition-colors"
     disabled={isLoading}
    >
     Forgot password?
    </button>
   </div>
   <Button
    type="submit"
    variant="default"
    size="lg"
    fullWidth
    loading={isLoading}
    className="mt-6"
   >
    Sign In
   </Button>
   <div className="text-center text-sm text-muted-foreground">
    Demo credentials: admin@ytdeluxe.com / password123
   </div>
  </form>
 );
};

export default LoginForm;