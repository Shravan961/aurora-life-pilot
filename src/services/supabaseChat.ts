
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage } from '@/types';

export interface SupabaseChatMessage {
  id: string;
  user_id: string;
  sender: 'user' | 'aurora';
  content: string;
  message_type: 'message' | 'tool' | 'clone';
  thread_id: string;
  clone_id?: string;
  timestamp: number;
  created_at: string;
  updated_at: string;
}

export interface SupabaseClone {
  id: string;
  user_id: string;
  name: string;
  role: string;
  personality?: string;
  style: string;
  system_prompt: string;
  conversation_log: any[];
  memory: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const supabaseChatService = {
  async saveMessage(message: ChatMessage, cloneId?: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('chat_messages')
      .insert({
        user_id: user.id,
        sender: message.sender,
        content: message.text,
        message_type: 'message',
        thread_id: message.threadId || 'default',
        clone_id: cloneId,
        timestamp: message.timestamp
      });

    if (error) throw error;
  },

  async getMessages(threadId: string = 'default'): Promise<ChatMessage[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', user.id)
      .eq('thread_id', threadId)
      .order('timestamp', { ascending: true });

    if (error) throw error;

    return (data || []).map(msg => ({
      id: msg.id,
      sender: msg.sender as 'user' | 'aurora',
      text: msg.content,
      timestamp: msg.timestamp,
      threadId: msg.thread_id
    }));
  },

  async clearMessages(threadId: string = 'default'): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('user_id', user.id)
      .eq('thread_id', threadId);

    if (error) throw error;
  },

  async saveClone(clone: Omit<SupabaseClone, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('clones')
      .insert({
        user_id: user.id,
        ...clone
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  },

  async getClones(): Promise<SupabaseClone[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('clones')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async updateClone(id: string, updates: Partial<SupabaseClone>): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('clones')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
  },

  async deleteClone(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('clones')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
  },

  async deactivateAllClones(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('clones')
      .update({ is_active: false })
      .eq('user_id', user.id);

    if (error) throw error;
  }
};
