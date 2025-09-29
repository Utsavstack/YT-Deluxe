import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const FloatingActionButton = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  const quickActions = [
    {
      id: 'batch',
      label: 'Batch Download',
      icon: 'Download',
      action: () => navigate('/batch-download-manager'),
      color: 'bg-primary hover:bg-primary/90'
    },
    {
      id: 'history',
      label: 'Download History',
      icon: 'History',
      action: () => navigate('/download-history-management'),
      color: 'bg-secondary hover:bg-secondary/90'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: 'Settings',
      action: () => navigate('/user-settings-preferences'),
      color: 'bg-accent hover:bg-accent/90 text-accent-foreground'
    }
  ];

  const handleMainAction = () => {
    if (isExpanded) {
      setIsExpanded(false);
    } else {
      setIsExpanded(true);
    }
  };

  const handleQuickAction = (action) => {
    action();
    setIsExpanded(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-100">
      {/* Quick Action Buttons */}
      {isExpanded && (
        <div className="absolute bottom-16 right-0 space-y-3 animate-slide-up">
          {quickActions?.map((action, index) => (
            <div
              key={action?.id}
              className="flex items-center space-x-3 animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <span className="glass-card px-3 py-1.5 text-sm font-medium text-foreground whitespace-nowrap shadow-glass-md">
                {action?.label}
              </span>
              <Button
                variant="default"
                size="icon"
                onClick={() => handleQuickAction(action?.action)}
                className={`w-12 h-12 rounded-full shadow-glass-lg ${action?.color} spring-bounce`}
              >
                <Icon name={action?.icon} size={20} />
              </Button>
            </div>
          ))}
        </div>
      )}
      {/* Main FAB */}
      <Button
        variant="default"
        size="icon"
        onClick={handleMainAction}
        className={`w-14 h-14 rounded-full shadow-glass-xl bg-primary hover:bg-primary/90 spring-bounce transition-transform duration-300 ${
          isExpanded ? 'rotate-45' : 'rotate-0'
        }`}
      >
        <Icon name="Plus" size={24} />
      </Button>
      {/* Backdrop */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
};

export default FloatingActionButton;