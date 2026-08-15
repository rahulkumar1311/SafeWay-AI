import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../services/api';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [apiStatus, setApiStatus] = useState('checking'); // 'checking' | 'healthy' | 'offline'

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  const addToast = (message, type = 'info', duration = 4000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const checkApiHealth = async () => {
    try {
      setApiStatus('checking');
      const response = await apiClient.get('/health');
      if (response && (response.success === true || response.status === 'ok')) {
        setApiStatus('healthy');
      } else {
        setApiStatus('offline');
      }
    } catch (err) {
      setApiStatus('offline');
    }
  };

  useEffect(() => {
    checkApiHealth();
    // Poll API status every 30 seconds
    const interval = setInterval(checkApiHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AppContext.Provider
      value={{
        sidebarOpen,
        setSidebarOpen,
        toggleSidebar,
        closeSidebar,
        toasts,
        addToast,
        removeToast,
        apiStatus,
        checkApiHealth
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
