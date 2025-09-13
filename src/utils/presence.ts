import { User } from '../types';

const ONLINE_THRESHOLD_MINUTES = 5;

/**
 * Determine if a user is currently online based on their last_seen timestamp
 */
export const isUserOnline = (user: User): boolean => {
  if (!user.last_seen) {
    return false;
  }

  const lastSeen = new Date(user.last_seen);
  const threshold = new Date(Date.now() - ONLINE_THRESHOLD_MINUTES * 60 * 1000);

  return lastSeen > threshold;
};

/**
 * Format the last seen time for display
 */
export const formatLastSeen = (lastSeen: string | undefined): string => {
  if (!lastSeen) {
    return 'Never';
  }

  const lastSeenDate = new Date(lastSeen);
  const now = new Date();
  const diffMs = now.getTime() - lastSeenDate.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) {
    return 'Just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  } else if (diffMinutes < 1440) { // Less than 24 hours
    const hours = Math.floor(diffMinutes / 60);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffMinutes / 1440);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }
};

/**
 * Get online status indicator
 */
export const getOnlineStatusIcon = (user: User): string => {
  return isUserOnline(user) ? '🟢' : '⚫';
};