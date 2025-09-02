import { useState, useEffect } from "react";

export const useNowLabel = () => {
  const [currentTime, setCurrentTime] = useState("");
  
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString());
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return currentTime;
};