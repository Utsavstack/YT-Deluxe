import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import AuthToggle from './components/AuthToggle';
import SocialAuth from './components/SocialAuth';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import ForgotPasswordModal from './components/ForgotPasswordModal';
import GuestAccessBanner from './components/GuestAccessBanner';
import BackgroundShapes from './components/BackgroundShapes';

const UserAuthentication = () => {
 const [isLogin, setIsLogin] = useState(true);
 const [isLoading, setIsLoading] = useState(false);
 const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
 const [authSuccess, setAuthSuccess] = useState(false);
 const navigate = useNavigate();

 // Check if user is already authenticated
 useEffect(() => {
  const authData = localStorage.getItem('ytdeluxe_auth');
  if (authData) {
   navigate('/home-search-dashboard');
  }
 }, [navigate]);

 const handleAuthSubmit = async (formData) => {
  setIsLoading(true);

  // Simulate API call
  setTimeout(() => {
   // Mock authentication logic
   const userData = {
    id: Date.now(),
    name: isLogin ? 'John Doe' : formData?.fullName,
    email: formData?.email,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData?.email}`,
    plan: 'free',
    joinedAt: new Date()?.toISOString()
   };

   // Store auth data
   localStorage.setItem('ytdeluxe_auth', JSON.stringify({
    user: userData,
    token: 'mock_jwt_token_' + Date.now(),
    expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
   }));

   setAuthSuccess(true);
   setIsLoading(false);

   // Redirect after success animation
   setTimeout(() => {
    navigate('/home-search-dashboard');
   }, 1500);
  }, 2000);
 };

 const handleSocialAuth = async (provider) => {
  setIsLoading(true);

  // Simulate social auth
  setTimeout(() => {
   const userData = {
    id: Date.now(),
    name: `User via ${provider}`,
    email: `user@${provider}.com`,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${provider}`,
    plan: 'free',
    joinedAt: new Date()?.toISOString(),
    provider: provider
   };

   localStorage.setItem('ytdeluxe_auth', JSON.stringify({
    user: userData,
    token: 'mock_social_token_' + Date.now(),
    expiresAt: Date.now() + (24 * 60 * 60 * 1000)
   }));

   setAuthSuccess(true);
   setIsLoading(false);

   setTimeout(() => {
    navigate('/home-search-dashboard');
   }, 1500);
  }, 1500);
 };

 const handleForgotPassword = (email) => {
  console.log('Password reset requested for:', email);
  // In real app, this would trigger password reset email
 };

 const handleGuestAccess = () => {
  // Set guest session
  localStorage.setItem('ytdeluxe_guest', JSON.stringify({
   isGuest: true,
   downloadsRemaining: 3,
   sessionStart: Date.now()
  }));

  navigate('/home-search-dashboard');
 };

 const handleBackToHome = () => {
  navigate('/home-search-dashboard');
 };

 if (authSuccess) {
  return (
   <div className="min-h-screen bg-background flex items-center justify-center p-4">
    <BackgroundShapes />
    <div className="text-center space-y-4 glass-card p-8 max-w-md w-full">
     <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto animate-bounce">
      <Icon name="CheckCircle" size={32} className="text-green-600" />
     </div>
     <h2 className="text-2xl font-bold text-foreground">Welcome!</h2>
     <p className="text-muted-foreground">
      Authentication successful. Redirecting to dashboard...
     </p>
     <div className="w-full bg-muted rounded-full h-2">
      <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: '100%' }} />
     </div>
    </div>
   </div>
  );
 }

 return (
  <div className="min-h-screen bg-background">
   <BackgroundShapes />
   {/* Header */}
   <header className="relative z-10 p-4 lg:p-6">
    <div className="flex items-center justify-between">
     <div className="flex items-center space-x-3">
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary shadow-glass-md">
       <Icon name="Play" size={20} color="white" />
      </div>
      <div>
       <h1 className="text-xl font-bold text-foreground">YT Deluxe</h1>
       <p className="text-xs text-muted-foreground">Premium Downloader</p>
      </div>
     </div>
     
     <Button
      variant="ghost"
      size="sm"
      onClick={handleBackToHome}
      iconName="ArrowLeft"
      iconPosition="left"
     >
      Back to Home
     </Button>
    </div>
   </header>
   {/* Main Content */}
   <main className="relative z-10 flex items-center justify-center min-h-[calc(100vh-120px)] p-4">
    <div className="w-full max-w-md">
     {/* Desktop Layout */}
     <div className="hidden lg:block">
      <div className="glass-card shadow-glass-xl p-8">
       <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glass-md">
         <Icon name="User" size={24} color="white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
         {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="text-muted-foreground text-sm">
         {isLogin 
          ? 'Sign in to access your downloads and preferences' 
          : 'Join YT Deluxe for unlimited downloads and features'
         }
        </p>
       </div>

       <AuthToggle isLogin={isLogin} onToggle={setIsLogin} />

       {isLogin ? (
        <LoginForm
         onSubmit={handleAuthSubmit}
         isLoading={isLoading}
         onForgotPassword={() => setIsForgotPasswordOpen(true)}
        />
       ) : (
        <RegisterForm
         onSubmit={handleAuthSubmit}
         isLoading={isLoading}
        />
       )}

       <div className="mt-6">
        <SocialAuth
         onSocialAuth={handleSocialAuth}
         isLoading={isLoading}
        />
       </div>

       <GuestAccessBanner onGuestAccess={handleGuestAccess} />
      </div>
     </div>

     {/* Mobile Layout */}
     <div className="lg:hidden">
      <div className="glass-card shadow-glass-xl p-6">
       <div className="text-center mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center mx-auto mb-3 shadow-glass-md">
         <Icon name="User" size={20} color="white" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-1">
         {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p className="text-muted-foreground text-xs">
         {isLogin 
          ? 'Sign in to your account' :'Join YT Deluxe today'
         }
        </p>
       </div>

       <AuthToggle isLogin={isLogin} onToggle={setIsLogin} />

       {isLogin ? (
        <LoginForm
         onSubmit={handleAuthSubmit}
         isLoading={isLoading}
         onForgotPassword={() => setIsForgotPasswordOpen(true)}
        />
       ) : (
        <RegisterForm
         onSubmit={handleAuthSubmit}
         isLoading={isLoading}
        />
       )}

       <div className="mt-4">
        <SocialAuth
         onSocialAuth={handleSocialAuth}
         isLoading={isLoading}
        />
       </div>

       <GuestAccessBanner onGuestAccess={handleGuestAccess} />
      </div>
     </div>

     {/* Features Preview */}
     <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
      {[
       { icon: 'Download', title: 'Fast Downloads', desc: 'High-speed video downloads' },
       { icon: 'Layers', title: 'Batch Processing', desc: 'Download multiple videos' },
       { icon: 'Shield', title: 'Secure & Safe', desc: 'Privacy-focused platform' }
      ]?.map((feature, index) => (
       <div key={index} className="glass-card p-4 text-center">
        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
         <Icon name={feature?.icon} size={16} className="text-primary" />
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-1">{feature?.title}</h3>
        <p className="text-xs text-muted-foreground">{feature?.desc}</p>
       </div>
      ))}
     </div>
    </div>
   </main>
   {/* Footer */}
   <footer className="relative z-10 text-center p-4 text-xs text-muted-foreground">
    <p>&copy; {new Date()?.getFullYear()} YT Deluxe. All rights reserved.</p>
    <div className="flex items-center justify-center space-x-4 mt-2">
     <button className="hover:text-foreground transition-colors">Terms</button>
     <span>•</span>
     <button className="hover:text-foreground transition-colors">Privacy</button>
     <span>•</span>
     <button className="hover:text-foreground transition-colors">Support</button>
    </div>
   </footer>
   {/* Forgot Password Modal */}
   <ForgotPasswordModal
    isOpen={isForgotPasswordOpen}
    onClose={() => setIsForgotPasswordOpen(false)}
    onSubmit={handleForgotPassword}
   />
  </div>
 );
};

export default UserAuthentication;