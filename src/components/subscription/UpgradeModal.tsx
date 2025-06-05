
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Crown, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
        onClose();
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Error",
        description: "Failed to start checkout process",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const freeFeatures = [
    "5 AI messages",
    "5 function uses",
    "1 food log",
    "1 symptom log",
    "1 mood log",
    "1 task creation"
  ];

  const premiumFeatures = [
    "Unlimited AI messages",
    "Unlimited function uses",
    "Unlimited food logs",
    "Unlimited symptom logs",
    "Unlimited mood logs",
    "Unlimited task creation",
    "Priority support",
    "Advanced features"
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Crown className="h-6 w-6 text-yellow-500" />
            Upgrade to Premium
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid md:grid-cols-2 gap-6 py-6">
          {/* Free Plan */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Free Plan</h3>
            <div className="text-2xl font-bold mb-4">$0<span className="text-sm font-normal">/month</span></div>
            <ul className="space-y-2">
              {freeFeatures.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <X className="h-4 w-4 text-red-500" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Premium Plan */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-6 border-2 border-indigo-200 dark:border-indigo-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Premium Plan
            </h3>
            <div className="text-2xl font-bold mb-4">$7.99<span className="text-sm font-normal">/month</span></div>
            <ul className="space-y-2 mb-6">
              {premiumFeatures.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
            <Button 
              onClick={handleUpgrade} 
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
            >
              {loading ? "Processing..." : "Upgrade Now"}
            </Button>
          </div>
        </div>
        
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          Secure payment powered by Stripe
        </div>
      </DialogContent>
    </Dialog>
  );
};
