import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface Purchase {
  photo_id: string;
  purchased_at: string;
}

export function usePurchases() {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPurchases();
    } else {
      setPurchases([]);
      setLoading(false);
    }
  }, [user]);

  const fetchPurchases = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('photo_purchases')
        .select('photo_id, purchased_at')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching purchases:', error);
        return;
      }

      setPurchases(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const isPurchased = (photoId: string) => {
    return purchases.some(purchase => purchase.photo_id === photoId);
  };

  const refreshPurchases = () => {
    if (user) {
      fetchPurchases();
    }
  };

  return {
    purchases,
    loading,
    isPurchased,
    refreshPurchases
  };
}