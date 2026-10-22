import api from './api';

export const authService = {
  getMe: () => api.get<any>('/auth/me'),
  updateProfile: (data: any) => api.put<any>('/auth/profile', data),
};

export const classService = {
  getClasses: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<any>(`/classes${query}`);
  },

  getFeaturedClasses: () => api.get<any>('/classes/featured'),

  getClassById: (id: string) => api.get<any>(`/classes/${id}`),

  createClass: (data: any) => api.post<any>('/classes', data),

  updateClass: (id: string, data: any) => api.put<any>(`/classes/${id}`, data),

  deleteClass: (id: string) => api.delete<any>(`/classes/${id}`),

  enrollInClass: (id: string) => api.post<any>(`/classes/${id}/enroll`),
  
  joinRequest: (id: string) => api.post<any>(`/classes/${id}/join-request`),
  getJoinStatus: (id: string) => api.get<any>(`/classes/${id}/join-status`),

  bookTrial: (id: string, data?: any) => api.post<any>(`/classes/${id}/book-trial`, data),
  getTrialStatus: (id: string) => api.get<any>(`/classes/${id}/trial-status`),

  getReviews: (classId: string) => api.get<any>(`/classes/${classId}/reviews`),

  addReview: (classId: string, data: { rating: number; text: string }) =>
    api.post<any>(`/classes/${classId}/reviews`, data),
  
  updateReview: (classId: string, reviewId: string, data: { rating: number; text: string }) =>
    api.put<any>(`/classes/${classId}/reviews/${reviewId}`, data),
    
  deleteReview: (classId: string, reviewId: string) =>
    api.delete<any>(`/classes/${classId}/reviews/${reviewId}`),
};

export const categoryService = {
  getCategories: () => api.get<any>('/categories'),
};

export const teacherService = {
  getTeachers: () => api.get<any>('/teachers'),
  getTeacherById: (id: string) => api.get<any>(`/teachers/${id}`),
  updateProfile: (data: any) => api.put<any>('/teachers/profile', data),
};

export const studentService = {
  getDashboard: () => api.get<any>('/student/dashboard'),
  getFavorites: () => api.get<any>('/student/favorites'),
};

export const teacherDashService = {
  getDashboard: () => api.get<any>('/teacher/dashboard'),
  getJoinRequests: () => api.get<any>('/join-requests/teacher'),
  acceptJoinRequest: (id: string) => api.put<any>(`/join-requests/${id}/accept`),
  rejectJoinRequest: (id: string) => api.put<any>(`/join-requests/${id}/reject`),
  
  getTrialRequests: () => api.get<any>('/trials/teacher'),
  acceptTrialRequest: (id: string) => api.put<any>(`/trials/${id}/accept`),
  rejectTrialRequest: (id: string) => api.put<any>(`/trials/${id}/reject`),
};

export const classManagementService = {
  getClassManagement: (id: string) => api.get<any>(`/class-management/${id}`),
  createAnnouncement: (id: string, text: string) => api.post<any>(`/class-management/${id}/announcements`, { text }),
  updateAnnouncement: (classId: string, annId: string, text: string) => api.put<any>(`/class-management/${classId}/announcements/${annId}`, { text }),
  deleteAnnouncement: (classId: string, annId: string) => api.delete<any>(`/class-management/${classId}/announcements/${annId}`),
  addSession: (id: string, data: any) => api.post<any>(`/class-management/${id}/schedule`, data),
  updateSession: (classId: string, sessionId: string, data: any) =>
    api.put<any>(`/class-management/${classId}/schedule/${sessionId}`, data),
  deleteSession: (classId: string, sessionId: string) => api.delete<any>(`/class-management/${classId}/schedule/${sessionId}`),
  getMessages: (id: string) => api.get<any>(`/class-management/${id}/chat`),
  sendMessage: (id: string, text: string) => api.post<any>(`/class-management/${id}/chat`, { text }),
  setChatMuted: (id: string, muted: boolean) => api.put<any>(`/class-management/${id}/chat/settings`, { muted }),
  deleteMessage: (id: string, messageId: string) => api.delete<any>(`/class-management/${id}/chat/${messageId}`),
  sendReminders: (id: string) => api.post<any>(`/class-management/${id}/payments/reminders`),
  markAttendance: (id: string, records: any[]) => api.post<any>(`/class-management/${id}/attendance`, { records }),
  getAttendance: (id: string) => api.get<any>(`/class-management/${id}/attendance`),
  getPayments: (id: string) => api.get<any>(`/class-management/${id}/payments`),
  getMembers: (id: string) => api.get<any>(`/class-management/${id}/members`),
  inviteStudent: (id: string, data: { name: string; email: string }) =>
    api.post<any>(`/class-management/${id}/members/invite`, data),
};

export const notificationService = {
  getNotifications: () => api.get<any>('/notifications'),
  markAsRead: (id: string) => api.put<any>(`/notifications/${id}/read`),
  markAllAsRead: () => api.put<any>('/notifications/read-all'),
};

export const favoriteService = {
  getFavorites: () => api.get<any>('/favorites'),
  toggleFavorite: (classId: string) => api.post<any>(`/favorites/${classId}`),
  removeFavorite: (classId: string) => api.delete<any>(`/favorites/${classId}`),
};

export const messageService = {
  sendDirectMessage: (id: string, text: string) => api.post<any>(`/messages/${id}`, { text }),
  deleteDirectMessage: (id: string, messageId: string) => api.delete<any>(`/messages/${id}/${messageId}`),
  getConversations: () => api.get<any>('/messages/conversations'),
  getDirectMessages: (userId: string) => api.get<any>(`/messages/${userId}`),
  markAsRead: (userId: string) => api.post<any>(`/messages/${userId}/read`),
  getUnreadCount: () => api.get<any>('/messages/unread-count'),
};
