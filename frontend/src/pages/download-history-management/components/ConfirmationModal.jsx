import React, { useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ConfirmationModal = ({ 
 isOpen, 
 onClose, 
 onConfirm, 
 title, 
 message, 
 confirmText = 'Confirm', 
 cancelText = 'Cancel',
 type = 'default',
 isLoading = false
}) => {
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

 const getIconAndColor = () => {
  switch (type) {
   case 'danger':
    return { icon: 'AlertTriangle', color: 'text-error' };
   case 'warning':
    return { icon: 'AlertCircle', color: 'text-warning' };
   case 'success':
    return { icon: 'CheckCircle', color: 'text-success' };
   default:
    return { icon: 'HelpCircle', color: 'text-primary' };
  }
 };

 const getButtonVariant = () => {
  switch (type) {
   case 'danger':
    return 'destructive';
   case 'warning':
    return 'warning';
   case 'success':
    return 'success';
   default:
    return 'default';
  }
 };

 if (!isOpen) return null;

 const { icon, color } = getIconAndColor();

 return (
  <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
   <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
   <div className="relative w-full max-w-md glass-card shadow-glass-2xl animate-slide-up">
    <div className="p-6">
     <div className="flex items-center space-x-3 mb-4">
      <div className={`flex-shrink-0 ${color}`}>
       <Icon name={icon} size={24} />
      </div>
      <h2 className="text-lg font-semibold text-foreground">
       {title}
      </h2>
     </div>
     
     <p className="text-muted-foreground mb-6">
      {message}
     </p>
     
     <div className="flex items-center justify-end space-x-3">
      <Button
       variant="outline"
       onClick={onClose}
       disabled={isLoading}
      >
       {cancelText}
      </Button>
      <Button
       variant={getButtonVariant()}
       onClick={onConfirm}
       loading={isLoading}
      >
       {confirmText}
      </Button>
     </div>
    </div>
   </div>
  </div>
 );
};

export default ConfirmationModal;