import React from 'react';
import Button from '../../../components/ui/Button';

const AuthToggle = ({ isLogin, onToggle }) => {
 return (
  <div className="flex bg-muted rounded-lg p-1 mb-6">
   <Button
    variant={isLogin ? "default" : "ghost"}
    size="sm"
    fullWidth
    onClick={() => onToggle(true)}
    className="rounded-md"
   >
    Sign In
   </Button>
   <Button
    variant={!isLogin ? "default" : "ghost"}
    size="sm"
    fullWidth
    onClick={() => onToggle(false)}
    className="rounded-md"
   >
    Sign Up
   </Button>
  </div>
 );
};

export default AuthToggle;