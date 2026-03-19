import React, { useState, useEffect } from 'react';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const ForgotPasswordModal = ({ isOpen, onClose, onSubmit }) => {
 const [email, setEmail] = useState('');
 const [isLoading, setIsLoading] = useState(false);
 const [isSubmitted, setIsSubmitted] = useState(false);
 const [error, setError] = useState('');

 useEffect(() => {
  const handleEscape = (e) => {
   if (e?.key === 'Escape') {
    onClose();
   }
  };

  if (isOpen) {
   document.addEventListener('keydown', handleEscape);
   document.body.style.overflow = 'hidden';
  }

  return () => {
   document.removeEventListener('keydown', handleEscape);
   document.body.style.overflow = 'unset';
  };
 }, [isOpen, onClose]);

 const handleSubmit = async (e) => {
  e?.preventDefault();
  
  if (!email) {
   setError('Email is required');
   return;
  }
  
  if (!/\S+@\S+\.\S+/?.test(email)) {
   setError('Please enter a valid email address');
   return;
  }

  setIsLoading(true);
  setError('');

  // Simulate API call
  setTimeout(() => {
   setIsLoading(false);
   setIsSubmitted(true);
   onSubmit(email);
  }, 1500);
 };

 const handleClose = () => {
  setEmail('');
  setError('');
  setIsSubmitted(false);
  setIsLoading(false);
  onClose();
 };

 if (!isOpen) return null;

 return (
  <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
   <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
   <div className="relative w-full max-w-md glass-card shadow-glass-xl animate-slide-up">
    <div className="p-6">
     <div className="flex items-center justify-between mb-6">
      <h2 className="text-xl font-bold text-foreground">
       {isSubmitted ? 'Check Your Email' : 'Reset Password'}
      </h2>
      <button
       onClick={handleClose}
       className="p-2 hover:bg-accent rounded-lg transition-colors"
      >
       <Icon name="X" size={20} />
      </button>
     </div>

     {!isSubmitted ? (
      <form onSubmit={handleSubmit} className="space-y-4">
       <div className="text-center mb-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
         <Icon name="Mail" size={24} className="text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">
         Enter your email address and we'll send you a link to reset your password.
        </p>
       </div>

       <Input
        label="Email Address"
        type="email"
        value={email}
        onChange={(e) => {
         setEmail(e?.target?.value);
         setError('');
        }}
        placeholder="Enter your email"
        error={error}
        required
        disabled={isLoading}
       />

       <Button
        type="submit"
        variant="default"
        size="lg"
        fullWidth
        loading={isLoading}
        className="mt-6"
       >
        Send Reset Link
       </Button>

       <div className="text-center">
        <button
         type="button"
         onClick={handleClose}
         className="text-sm text-muted-foreground hover:text-foreground transition-colors"
         disabled={isLoading}
        >
         Back to Sign In
        </button>
       </div>
      </form>
     ) : (
      <div className="text-center space-y-4">
       <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <Icon name="CheckCircle" size={24} className="text-green-600" />
       </div>
       <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Email Sent!</h3>
        <p className="text-sm text-muted-foreground mb-4">
         We've sent a password reset link to <strong>{email}</strong>
        </p>
        <p className="text-xs text-muted-foreground">
         Didn't receive the email? Check your spam folder or try again.
        </p>
       </div>
       <div className="space-y-2">
        <Button
         variant="default"
         size="default"
         fullWidth
         onClick={handleClose}
        >
         Back to Sign In
        </Button>
        <Button
         variant="ghost"
         size="default"
         fullWidth
         onClick={() => {
          setIsSubmitted(false);
          setEmail('');
         }}
        >
         Try Different Email
        </Button>
       </div>
      </div>
     )}
    </div>
   </div>
  </div>
 );
};

export default ForgotPasswordModal;