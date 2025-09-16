import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, ShoppingCart, ChevronLeft, ChevronRight, Plus, Minus } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { supabase } from '@/integrations/supabase/client';
import { ImageProtection } from '@/components/ImageProtection';
import { toast } from '@/hooks/use-toast';

interface Photo {
  id: string;
  filename: string;
  original_name: string;
  storage_path: string;
  created_at: string;
}

interface PhotoViewerProps {
  isOpen: boolean;
  onClose: () => void;
  photo: Photo | null;
  photos: Photo[];
  onNavigate: (direction: 'prev' | 'next') => void;
  canDownload: boolean;
  userId?: string;
}

export function PhotoViewer({ 
  isOpen, 
  onClose, 
  photo, 
  photos, 
  onNavigate, 
  canDownload,
  userId 
}: PhotoViewerProps) {
  const { addItem, removeItem, isInCart } = useCart();

  // Proteções contra captura de tela e interações
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Bloquear Print Screen e teclas de captura
      if (
        e.key === 'PrintScreen' ||
        (e.ctrlKey && e.key === 'p') ||
        (e.ctrlKey && e.shiftKey && e.key === 'S') ||
        (e.metaKey && e.shiftKey && e.key === '4') ||
        (e.metaKey && e.shiftKey && e.key === '3') ||
        e.key === 'F12'
      ) {
        e.preventDefault();
        e.stopPropagation();
        toast({
          title: "Ação bloqueada",
          description: "Captura de tela não permitida",
          variant: "destructive"
        });
        return false;
      }

      // Navegação permitida
      if (e.key === 'ArrowLeft') onNavigate('prev');
      if (e.key === 'ArrowRight') onNavigate('next');
      if (e.key === 'Escape') onClose();
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    const handleSelectStart = (e: Event) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('selectstart', handleSelectStart);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('selectstart', handleSelectStart);
    };
  }, [isOpen, onNavigate, onClose]);

  if (!photo) return null;

  const currentIndex = photos.findIndex(p => p.id === photo.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < photos.length - 1;

  const getPhotoUrl = (path: string) => {
    const { data } = supabase.storage
      .from('photos')
      .getPublicUrl(path);
    return data.publicUrl;
  };


  const handleCartAction = () => {
    const cartItem = {
      id: photo.id,
      filename: photo.filename,
      original_name: photo.original_name,
      storage_path: photo.storage_path
    };

    if (isInCart(photo.id)) {
      removeItem(photo.id);
    } else {
      addItem(cartItem);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-4xl h-[90vh] p-0"
        onContextMenu={(e) => e.preventDefault()}
        style={{ 
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none'
        }}
      >
        <DialogHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold truncate">
              {photo.original_name}
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="relative flex-1 flex flex-col overflow-hidden">
          {/* Image container */}
          <div className="relative flex-1 bg-black flex items-center justify-center">
            <ImageProtection
              src={getPhotoUrl(photo.storage_path)}
              alt={photo.original_name}
              className="max-w-full max-h-full object-contain"
            />
            
            {/* Navigation arrows */}
            {hasPrev && (
              <Button
                variant="outline"
                size="icon"
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-background/90 hover:bg-background"
                onClick={() => onNavigate('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            
            {hasNext && (
              <Button
                variant="outline"
                size="icon"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-background/90 hover:bg-background"
                onClick={() => onNavigate('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}

            {/* Photo counter */}
            <Badge variant="secondary" className="absolute top-4 right-4 bg-background/90">
              {currentIndex + 1} de {photos.length}
            </Badge>
          </div>

          {/* Actions bar */}
          <div className="p-4 border-t bg-background">
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-2">
                <Button
                  onClick={handleCartAction}
                  variant={isInCart(photo.id) ? "default" : "outline"}
                  size="sm"
                >
                  {isInCart(photo.id) ? (
                    <>
                      <Minus className="h-4 w-4 mr-2" />
                      Remover do Carrinho
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar ao Carrinho
                    </>
                  )}
                </Button>
                
                {isInCart(photo.id) && (
                  <Badge variant="secondary">
                    <ShoppingCart className="h-3 w-3 mr-1" />
                    No carrinho
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Aviso de proteção */}
            <div className="mt-2 text-center">
              <Badge variant="destructive" className="text-xs">
                🔒 Conteúdo protegido - Download e captura bloqueados
              </Badge>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}