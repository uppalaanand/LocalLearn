import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

type Role = 'student' | 'teacher';

interface RoleContextType {
  role: Role;
  setRole: (role: Role) => void;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<Role>('student');

  // Try to sync with auth context if available
  useEffect(() => {
    try {
      const user = localStorage.getItem('user');
      if (user) {
        const parsed = JSON.parse(user);
        if (parsed.role === 'teacher' || parsed.role === 'student') {
          setRole(parsed.role);
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  return (
    <RoleContext.Provider value={{ role, setRole }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};
