import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Purchase {
  photo_id: string;
  purchased_at: string;
}

export function usePurchases() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
        setLoading(true);
        // Since we don't have auth, we'll just return empty purchases
        setPurchases([]);
    } catch (error) {
      console.error('Error fetching purchases:', error);
      setPurchases([]);
    } finally {
      setLoading(false);
    }
  };

  const isPurchased = (photoId: string) => {
    return purchases.some(purchase => purchase.photo_id === photoId);
  };

  const refreshPurchases = () => {
    fetchPurchases();
  };

  return {
    purchases,
    loading,
    isPurchased,
    refreshPurchases
  };
}