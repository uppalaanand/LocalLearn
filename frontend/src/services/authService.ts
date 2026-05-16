import api, { setAccessToken } from './api';

interface AuthResponse {
  success: boolean;
  data: {
    user: {
      _id: string;
      name: string;
      email: string;
      role: 'student' | 'teacher' | 'admin';
      phone: string;
      avatar: string;
    };
    accessToken: string;
    teacherProfile?: any;
  };
  message: string;
}

interface MeResponse {
  success: boolean;
  data: {
    user: {
      _id: string;
      name: string;
      email: string;
      role: 'student' | 'teacher' | 'admin';
      phone: string;
      avatar: string;
      location: any;
      favorites: any[];
      isVerified: boolean;
      createdAt: string;
    };
    teacherProfile: any;
  };
}

export const authService = {
  register: async (data: { name: string; email: string; password: string; role: string; phone?: string }) => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    if (response.data.accessToken) {
      setAccessToken(response.data.accessToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response;
  },

  login: async (email: string, password: string) => {
    const response = await api.post<AuthResponse>('/auth/login', { email, password });
    if (response.data.accessToken) {
      setAccessToken(response.data.accessToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore errors on logout
    }
    setAccessToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
  },

  getMe: async () => {
    const response = await api.get<MeResponse>('/auth/me');
    return response;
  },

  getCurrentUser: () => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('accessToken');
  },
};

export default authService;
