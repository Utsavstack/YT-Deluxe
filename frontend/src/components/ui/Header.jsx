import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import Button from './Button';

const Header = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const navigationItems = [
    {
      label: 'Home',
      path: '/home-search-dashboard',
      icon: 'Home',
      tooltip: 'Search and download videos'
    },
    {
      label: 'Batch',
      path: '/batch-download-manager',
      icon: 'Download',
      tooltip: 'Manage bulk downloads'
    },
    {
      label: 'History',
      path: '/download-history-management',
      icon: 'History',
      tooltip: 'View download history'
    },
    {
      label: 'Settings',
      path: '/user-settings-preferences',
      icon: 'Settings',
      tooltip: 'Configure preferences'
    }
  ];

  useEffect(() => {
    // Check authentication status from localStorage
    const authData = localStorage.getItem('ytdeluxe_auth');
    if (authData) {
      try {
        const parsedAuth = JSON.parse(authData);
        setIsAuthenticated(true);
        setUser(parsedAuth?.user);
      } catch (error) {
        console.error('Error parsing auth data:', error);
        localStorage.removeItem('ytdeluxe_auth');
      }
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isUserMenuOpen && !event.target?.closest('.user-menu-container')) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen]);

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleAuthSuccess = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    setIsAuthModalOpen(false);
    localStorage.setItem('ytdeluxe_auth', JSON.stringify({ user: userData }));
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setIsUserMenuOpen(false);
    localStorage.removeItem('ytdeluxe_auth');
    navigate('/home-search-dashboard');
  };

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-100 glass-header">
        <div className="flex items-center justify-between h-16 px-4 lg:px-6">
          {/* Logo Section */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary shadow-glass-md">
              <Icon name="Play" size={20} color="white" />
            </div>
            <div className="block">
              <h1 className="text-xl allan-bold text-foreground">YT Deluxe</h1>
              <p className="text-xs text-muted-foreground">Premium Video Downloader</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 glass-nav">
            {navigationItems?.map((item) => (
              <button
                key={item?.path}
                onClick={() => handleNavigation(item?.path)}
                className={`
                  flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium
                  transition-all duration-200 spring-smooth
                  ${isActivePath(item?.path)
                    ? 'bg-primary text-primary-foreground shadow-glass-sm'
                    : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                  }
                `}
                title={item?.tooltip}
              >
                <Icon name={item?.icon} size={16} />
                <span>{item?.label}</span>
              </button>
            ))}
          </nav>

          {/* User Section */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle removed as per request */}

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative user-menu-container">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-accent transition-colors spring-smooth"
                >
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-foreground">
                      {user?.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <Icon name="ChevronDown" size={16} className={`transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 glass-card shadow-glass-lg z-110 animate-slide-down">
                    <div className="p-3 border-b border-border">
                      <p className="text-sm font-medium text-foreground">{user?.name || 'User'}</p>
                      <p className="text-xs text-muted-foreground">{user?.email || 'user@example.com'}</p>
                    </div>
                    <div className="p-1">
                      <button
                        onClick={() => navigate('/user-settings-preferences')}
                        className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors"
                      >
                        <Icon name="User" size={16} />
                        <span>Profile</span>
                      </button>
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                      >
                        <Icon name="LogOut" size={16} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => setIsAuthModalOpen(true)}
                iconName="User"
                iconPosition="left"
                className="hidden sm:flex"
              >
                Sign In
              </Button>
            )}

            {/* Mobile Menu Button removed as per request */}
          </div>
        </div>

      </header>

      {/* Mobile Navigation (Sticky Bottom) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] border-t border-border bg-background/95 backdrop-blur-md pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <nav className="flex items-center justify-around py-2">
          {navigationItems?.map((item) => (
            <button
              key={item?.path}
              onClick={() => handleNavigation(item?.path)}
              className={`
                flex flex-col items-center space-y-1 px-3 py-1.5 rounded-lg text-xs font-medium
                transition-all duration-200 spring-smooth min-w-0 flex-1
                ${isActivePath(item?.path)
                  ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }
              `}
              title={item?.tooltip}
            >
              <Icon name={item?.icon} size={20} />
              <span className="truncate pt-0.5">{item?.label}</span>
            </button>
          ))}
        </nav>
      </div>
      {/* Authentication Modal */}
      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      )}
    </>
  );
};

// Authentication Modal Component
const AuthModal = ({ isOpen, onClose, onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [isLoading, setIsLoading] = useState(false);

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
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      const userData = {
        name: isLogin ? 'John Doe' : formData?.name,
        email: formData?.email,
        id: Date.now()
      };
      onAuthSuccess(userData);
      setIsLoading(false);
    }, 1000);
  };

  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e?.target?.name]: e?.target?.value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md glass-card shadow-glass-2xl animate-slide-up">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <Icon name="X" size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData?.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                  placeholder="Enter your name"
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData?.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData?.password}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                placeholder="Enter your password"
                required
              />
            </div>

            <Button
              type="submit"
              variant="default"
              size="lg"
              fullWidth
              loading={isLoading}
              className="mt-6"
            >
              {isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;