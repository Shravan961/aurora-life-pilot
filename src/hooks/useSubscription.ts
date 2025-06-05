
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionData {
  subscribed: boolean;
  subscription_tier: string | null;
  subscription_end: string | null;
}

interface UsageData {
  messages_used: number;
  functions_used: number;
  food_logs_used: number;
  symptom_logs_used: number;
  mood_logs_used: number;
  tasks_used: number;
}

const FREE_LIMITS = {
  messages: 5,
  functions: 5,
  food_logs: 1,
  symptom_logs: 1,
  mood_logs: 1,
  tasks: 1,
};

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData>({
    subscribed: false,
    subscription_tier: null,
    subscription_end: null,
  });
  const [usage, setUsage] = useState<UsageData>({
    messages_used: 0,
    functions_used: 0,
    food_logs_used: 0,
    symptom_logs_used: 0,
    mood_logs_used: 0,
    tasks_used: 0,
  });
  const [loading, setLoading] = useState(true);

  const checkSubscription = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      
      setSubscription(data);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const loadUsage = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('usage_limits')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setUsage({
          messages_used: data.messages_used,
          functions_used: data.functions_used,
          food_logs_used: data.food_logs_used,
          symptom_logs_used: data.symptom_logs_used,
          mood_logs_used: data.mood_logs_used,
          tasks_used: data.tasks_used,
        });
      }
    } catch (error) {
      console.error('Error loading usage:', error);
    } finally {
      setLoading(false);
    }
  };

  const incrementUsage = async (type: keyof UsageData) => {
    if (!user || subscription.subscribed) return true;

    const currentUsage = usage[type];
    const limit = FREE_LIMITS[type.replace('_used', '') as keyof typeof FREE_LIMITS];

    if (currentUsage >= limit) {
      return false; // Usage limit exceeded
    }

    try {
      const { error } = await supabase
        .from('usage_limits')
        .upsert({
          user_id: user.id,
          [type]: currentUsage + 1,
        });

      if (error) throw error;

      setUsage(prev => ({
        ...prev,
        [type]: prev[type] + 1,
      }));

      return true;
    } catch (error) {
      console.error('Error incrementing usage:', error);
      return false;
    }
  };

  const canUseFeature = (type: keyof UsageData): boolean => {
    if (subscription.subscribed) return true;
    
    const currentUsage = usage[type];
    const limit = FREE_LIMITS[type.replace('_used', '') as keyof typeof FREE_LIMITS];
    
    return currentUsage < limit;
  };

  const getRemainingUsage = (type: keyof UsageData): number => {
    if (subscription.subscribed) return Infinity;
    
    const currentUsage = usage[type];
    const limit = FREE_LIMITS[type.replace('_used', '') as keyof typeof FREE_LIMITS];
    
    return Math.max(0, limit - currentUsage);
  };

  useEffect(() => {
    if (user) {
      checkSubscription();
      loadUsage();
    } else {
      setLoading(false);
    }
  }, [user]);

  return {
    subscription,
    usage,
    loading,
    checkSubscription,
    incrementUsage,
    canUseFeature,
    getRemainingUsage,
    isSubscribed: subscription.subscribed,
  };
};
