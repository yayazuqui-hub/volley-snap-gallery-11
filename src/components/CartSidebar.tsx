import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingCart, Trash2, Download, X } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface CartSidebarProps {
  canDownload: boolean;
  userId?: string;
}

export function CartSidebar({ canDownload, userId }: CartSidebarProps) {
  const { items, removeItem, clearCart, totalItems } = useCart();

  const getPhotoUrl = (path: string) => {
    const { data } = supabase.storage
      .from('photos')
      .getPublicUrl(path);
    return data.publicUrl;
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

      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Carrinho de Fotos</span>
            <Badge variant="secondary">{totalItems} item(s)</Badge>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Seu carrinho está vazio</p>
              <p className="text-sm text-muted-foreground">Adicione fotos clicando no ícone + nas fotos da galeria</p>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <Button 
                  onClick={handleDownloadAll}
                  className="flex-1"
                  disabled={!canDownload}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {canDownload ? `Baixar Todas (${totalItems})` : "Aprovação Necessária"}
                </Button>
                <Button 
                  onClick={clearCart}
                  variant="outline"
                  size="icon"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
                {items.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-16 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
                          <img
                            src={getPhotoUrl(item.storage_path)}
                            alt={item.original_name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder.svg';
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {item.original_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.filename}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}