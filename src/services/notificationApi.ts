import { api } from './api';

export interface EmailPreferences {
  new_posts: boolean;
  admin_notifications: boolean;
  comment_replies: boolean;
  weekly_digest: boolean;
}

export interface EmailNotification {
  subject: string;
  message: string;
  include_unsubscribed?: boolean;
}

export interface NotificationResponse {
  success: boolean;
  message: string;
  sent_count: number;
  total_users: number;
}

export interface RecipientInfo {
  id: string;
  name: string;
  email: string;
  subscribed: boolean;
}

export interface RecipientsResponse {
  total_users: number;
  subscribed_count: number;
  users: RecipientInfo[];
}

export const notificationApi = {
  // Send admin broadcast
  sendBroadcast: async (notification: EmailNotification): Promise<NotificationResponse> => {
    const response = await api.post('/notifications/admin/broadcast', notification);
    return response.data;
  },

  // Get broadcast recipients
  getBroadcastRecipients: async (includeUnsubscribed: boolean = false): Promise<RecipientsResponse> => {
    const response = await api.get(`/notifications/admin/recipients?include_unsubscribed=${includeUnsubscribed}`);
    return response.data;
  },

  // Get email preferences
  getEmailPreferences: async (): Promise<EmailPreferences> => {
    const response = await api.get('/notifications/preferences');
    return response.data;
  },

  // Update email preferences
  updateEmailPreferences: async (preferences: Partial<EmailPreferences>): Promise<any> => {
    const response = await api.put('/notifications/preferences', preferences);
    return response.data;
  },

  // Test new post notification (admin only)
  testNewPostNotification: async (): Promise<{ success: boolean; message: string }> => {
    const response = await api.get('/notifications/test/new-post');
    return response.data;
  },

  // Admin: Get all user email preferences
  getAllUserPreferences: async (): Promise<{
    success: boolean;
    users: Array<{
      id: string;
      name: string;
      email: string;
      role: string;
      preferences: EmailPreferences;
    }>;
    total_count: number;
  }> => {
    const response = await api.get('/notifications/admin/users/preferences');
    return response.data;
  },

  // Admin: Update specific user's email preferences
  updateUserPreferencesAdmin: async (
    userId: string, 
    preferences: Partial<EmailPreferences>
  ): Promise<{
    success: boolean;
    message: string;
    user_id: string;
    user_name: string;
    preferences: EmailPreferences;
  }> => {
    const response = await api.put(`/notifications/admin/users/${userId}/preferences`, preferences);
    return response.data;
  },

  // Admin: Bulk update multiple users' preferences
  bulkUpdatePreferences: async (
    userIds: string[],
    preferences: Partial<EmailPreferences>
  ): Promise<{
    success: boolean;
    message: string;
    updated_count: number;
    total_requested: number;
  }> => {
    const response = await api.post('/notifications/admin/preferences/bulk-update', {
      user_ids: userIds,
      preferences: preferences
    });
    return response.data;
  }
};