import React, { createContext, useContext, useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

export interface CartItem {
  id: string;
  filename: string;
  original_name: string;
  storage_path: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (photo: CartItem) => void;
  removeItem: (photoId: string) => void;
  clearCart: () => void;
  isInCart: (photoId: string) => boolean;
  totalItems: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((photo: CartItem) => {
    setItems(prev => {
      if (prev.find(item => item.id === photo.id)) {
        toast({
          title: "Já no carrinho",
          description: "Esta foto já está no seu carrinho"
        });
        return prev;
      }
      
      toast({
        title: "Adicionado ao carrinho",
        description: `${photo.original_name} foi adicionada`
      });
      
      return [...prev, photo];
    });
  }, []);

  const removeItem = useCallback((photoId: string) => {
    setItems(prev => {
      const item = prev.find(item => item.id === photoId);
      if (item) {
        toast({
          title: "Removido do carrinho",
          description: `${item.original_name} foi removida`
        });
      }
      return prev.filter(item => item.id !== photoId);
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    toast({
      title: "Carrinho limpo",
      description: "Todas as fotos foram removidas"
    });
  }, []);

  const isInCart = useCallback((photoId: string) => {
    return items.some(item => item.id === photoId);
  }, [items]);

  const totalItems = items.length;

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      clearCart,
      isInCart,
      totalItems
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}