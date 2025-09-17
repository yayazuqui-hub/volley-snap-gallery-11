import React, { useState, useEffect } from 'react';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ShoppingCart, Download, X, Trash2 } from 'lucide-react';
import { CartCheckout } from './CartCheckout';

interface CartSidebarProps {
  canDownload?: boolean;
  userId?: string;
}

interface Photo {
  id: string;
  filename: string;
  original_name: string;
  storage_path: string;
  price: number;
}

export function CartSidebar({ canDownload = false, userId }: CartSidebarProps) {
  const { items, removeItem, clearCart, totalItems } = useCart();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPhotos();
  }, [items]);

  const fetchPhotos = async () => {
    if (items.length === 0) {
      setPhotos([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('photos')
        .select('id, filename, original_name, storage_path, price')
        .in('id', items.map(item => item.id));

      if (error) {
        console.error('Error fetching photos:', error);
        return;
      }

      setPhotos(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPhotoUrl = (storagePath: string) => {
    return supabase.storage.from('photos').getPublicUrl(storagePath).data.publicUrl;
  };

  const handleDownloadAll = async () => {
    if (!canDownload) {
      toast({
        title: "Acesso negado",
        description: "Você precisa de aprovação do administrador para baixar fotos",
        variant: "destructive"
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: "Carrinho vazio",
        description: "Adicione fotos ao carrinho primeiro",
        variant: "destructive"
      });
      return;
    }

    try {
      let successCount = 0;
      
      for (const item of items) {
        try {
          const { data, error } = await supabase.storage
            .from('photos')
            .download(item.storage_path);

          if (error) throw error;

          const url = URL.createObjectURL(data);
          const a = document.createElement('a');
          a.href = url;
          a.download = item.original_name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          // Track download
          if (userId) {
            await supabase
              .from('user_downloads')
              .upsert({
                user_id: userId,
                photo_id: item.id,
                download_count: 1
              });
          }

          successCount++;
        } catch (error) {
          console.error(`Error downloading ${item.original_name}:`, error);
        }
      }

      if (successCount > 0) {
        toast({
          title: "Downloads concluídos",
          description: `${successCount} foto(s) baixada(s) com sucesso!`
        });
      }
    } catch (error) {
      console.error('Error downloading photos:', error);
      toast({
        title: "Erro",
        description: "Erro ao baixar algumas fotos",
        variant: "destructive"
      });
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <ShoppingCart className="h-4 w-4 mr-2" />
          Carrinho
          {totalItems > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center">
            <ShoppingCart className="h-5 w-5 mr-2" />
            Carrinho ({totalItems})
          </SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Seu carrinho está vazio</p>
            </div>
          ) : loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Carregando...</p>
            </div>
          ) : (
            <>
              <Tabs defaultValue="items" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="items">Itens</TabsTrigger>
                  <TabsTrigger value="checkout">Checkout</TabsTrigger>
                </TabsList>
                
                <TabsContent value="items" className="space-y-3">
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {items.map((item) => {
                      const photo = photos.find(p => p.id === item.id);
                      return (
                        <div key={item.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                          <img 
                            src={getPhotoUrl(item.storage_path)}
                            alt={item.original_name}
                            className="w-16 h-16 object-cover rounded"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium truncate">{item.original_name}</p>
                            <div className="flex items-center justify-between">
                              <Badge variant="secondary" className="text-xs">
                                {item.filename}
                              </Badge>
                              {photo && (
                                <span className="text-xs text-muted-foreground">
                                  {photo.price > 0 ? `R$ ${photo.price.toFixed(2)}` : 'Gratuita'}
                                </span>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="border-t pt-4 space-y-2">
                    {canDownload && (
                      <Button onClick={handleDownloadAll} className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        Baixar Todas ({totalItems})
                      </Button>
                    )}
                    
                    <Button variant="outline" onClick={clearCart} className="w-full">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Limpar Carrinho
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="checkout">
                  <CartCheckout photos={photos} />
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}