export interface Message {
  id: string;
  content: string;
  type?: "text" | "audio" | "image" | "file" | string;
  audio_url?: string;
  audio_duration?: number;
  media_url?: string;
  media_type?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  file_url?: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  created_at: string;
}

export interface TypingUser {
  username: string;
  avatar_url?: string;
  timestamp: number;
}

export interface OnlineUser {
  username: string;
  avatar_url?: string;
}

export interface CurrentUser {
  id: string;
  username: string;
  avatar_url: string;
}

export interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  type: string;
  audio_url?: string;
  audio_duration?: number;
  media_url?: string;
  media_type?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  file_url?: string;
  is_read: boolean;
  created_at: string;
  sender_username: string;
  sender_avatar: string;
}
