import React from 'react';

const BackgroundShapes = () => {
 return (
  <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
   {/* Animated Background Shapes */}
   <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-xl animate-glass-float" />
   <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-accent/30 to-primary/20 rounded-full blur-lg animate-glass-float" style={{ animationDelay: '2s' }} />
   <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-gradient-to-br from-secondary/15 to-accent/25 rounded-full blur-2xl animate-glass-float" style={{ animationDelay: '4s' }} />
   <div className="absolute bottom-20 right-1/3 w-28 h-28 bg-gradient-to-br from-primary/25 to-secondary/15 rounded-full blur-xl animate-glass-float" style={{ animationDelay: '6s' }} />
   <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-36 h-36 bg-gradient-to-br from-accent/20 to-primary/15 rounded-full blur-2xl animate-glass-float" style={{ animationDelay: '8s' }} />
   
   {/* Additional Smaller Shapes */}
   <div className="absolute top-1/4 left-3/4 w-16 h-16 bg-gradient-to-br from-primary/30 to-accent/20 rounded-full blur-md animate-glass-float" style={{ animationDelay: '1s' }} />
   <div className="absolute bottom-1/4 left-1/6 w-20 h-20 bg-gradient-to-br from-secondary/25 to-primary/20 rounded-full blur-lg animate-glass-float" style={{ animationDelay: '3s' }} />
   <div className="absolute top-3/4 right-1/4 w-18 h-18 bg-gradient-to-br from-accent/35 to-secondary/20 rounded-full blur-md animate-glass-float" style={{ animationDelay: '5s' }} />
   
   {/* Gradient Overlay */}
   <div className="absolute inset-0 bg-gradient-to-br from-background/50 via-transparent to-background/30" />
  </div>
 );
};

export default BackgroundShapes;