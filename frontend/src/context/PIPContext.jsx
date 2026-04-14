import React, { createContext, useState, useContext } from 'react';

const PIPContext = createContext(null);

export const usePIP = () => {
  const context = useContext(PIPContext);
  if (!context) {
    throw new Error('usePIP must be used within a PIPProvider');
  }
  return context;
};

export const PIPProvider = ({ children }) => {
  const [pipVideo, setPipVideo] = useState(null);
  const [isPipOpen, setIsPipOpen] = useState(false);

  const openPip = (video) => {
    setPipVideo(video);
    setIsPipOpen(true);
  };

  const closePip = () => {
    setIsPipOpen(false);
    setTimeout(() => setPipVideo(null), 300); // Wait for transition to finish
  };

  return (
    <PIPContext.Provider value={{ pipVideo, isPipOpen, openPip, closePip }}>
      {children}
    </PIPContext.Provider>
  );
};
