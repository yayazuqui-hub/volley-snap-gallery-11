import React, { useState } from 'react';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ShoppingBag, CreditCard, Loader2 } from 'lucide-react';

interface CartCheckoutProps {
  photos: Array<{
    id: string;
    filename: string;
    original_name: string;
    storage_path: string;
    price: number;
  }>;
}

export function CartCheckout({ photos }: CartCheckoutProps) {
  const { items, clearCart } = useCart();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const cartPhotos = photos.filter(photo => 
    items.some(item => item.id === photo.id)
  );

  const totalAmount = cartPhotos.reduce((sum, photo) => sum + photo.price, 0);

  const handleCheckout = async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para fazer a compra",
        variant: "destructive"
      });
      return;
    }

    if (cartPhotos.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione fotos ao carrinho antes de finalizar a compra"
      });
      return;
    }

    if (totalAmount === 0) {
      toast({
        title: "Fotos gratuitas",
        description: "Essas fotos não têm custo. Você pode baixá-las diretamente.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('mercado-pago-payment', {
        body: {
          photo_ids: cartPhotos.map(photo => photo.id),
          user_id: user.id
        }
      });

      if (error) {
        throw error;
      }

      if (data.init_point) {
        // Redirect to Mercado Pago checkout
        window.location.href = data.init_point;
      } else {
        throw new Error('No payment URL received');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Erro no checkout",
        description: "Não foi possível iniciar o pagamento. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (cartPhotos.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Carrinho vazio</h3>
          <p className="text-muted-foreground text-center">
            Adicione fotos ao carrinho para fazer o checkout
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <ShoppingBag className="h-5 w-5 mr-2" />
          Resumo da Compra
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {cartPhotos.map((photo) => (
            <div key={photo.id} className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium truncate">
                  {photo.original_name}
                </p>
                <Badge variant="secondary" className="text-xs">
                  {photo.filename}
                </Badge>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">
                  {photo.price > 0 ? `R$ ${photo.price.toFixed(2)}` : 'Gratuita'}
                </p>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        <div className="flex items-center justify-between font-semibold">
          <span>Total:</span>
          <span className="text-lg">
            {totalAmount > 0 ? `R$ ${totalAmount.toFixed(2)}` : 'Gratuito'}
          </span>
        </div>

        <div className="space-y-2">
          <Button 
            onClick={handleCheckout} 
            className="w-full"
            disabled={isProcessing || totalAmount === 0}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                {totalAmount > 0 ? 'Pagar com Mercado Pago' : 'Baixar Fotos Gratuitas'}
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={clearCart}
            className="w-full"
          >
            Limpar Carrinho
          </Button>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          <p>Você será redirecionado para o Mercado Pago para completar o pagamento.</p>
          <p>Após a confirmação, as fotos estarão disponíveis para download sem marca d'água.</p>
        </div>
      </CardContent>
    </Card>
  );
}