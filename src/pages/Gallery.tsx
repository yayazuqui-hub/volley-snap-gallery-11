import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { usePurchases } from '@/hooks/usePurchases';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { CartSidebar } from '@/components/CartSidebar';
import { FaceRecognition } from '@/components/FaceRecognition';
import { PhotoViewer } from '@/components/PhotoViewer';
import { ImageProtection } from '@/components/ImageProtection';
import { 
  Search, 
  Filter, 
  ShoppingCart, 
  Download, 
  Eye,
  Calendar,
  DollarSign,
  X
} from 'lucide-react';

interface Photo {
  id: string;
  filename: string;
  original_name: string;
  storage_path: string;
  price: number;
  created_at: string;
  event_id: string | null;
  events?: {
    name: string;
  };
}

interface Event {
  id: string;
  name: string;
  event_date: string;
}

const Gallery = () => {
  const [searchParams] = useSearchParams();
  const { isInCart, addItem, removeItem, totalItems } = useCart();
  const { isPurchased, refreshPurchases } = usePurchases();
  
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredPhotos, setFilteredPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);
  const [photoViewerIndex, setPhotoViewerIndex] = useState(0);
  const [showFaceRecognition, setShowFaceRecognition] = useState(false);
  const [showCartSidebar, setShowCartSidebar] = useState(false);

  const handleOpenPhotoViewer = (photoIndex: number) => {
    setPhotoViewerIndex(photoIndex);
    setShowPhotoViewer(true);
  };

  const handleNavigatePhoto = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && photoViewerIndex > 0) {
      setPhotoViewerIndex(photoViewerIndex - 1);
    } else if (direction === 'next' && photoViewerIndex < filteredPhotos.length - 1) {
      setPhotoViewerIndex(photoViewerIndex + 1);
    }
  };

  useEffect(() => {
    fetchPhotos();
    fetchEvents();
  }, []);

  useEffect(() => {
    const eventId = searchParams.get('event');
    if (eventId) {
      setSelectedEvent(eventId);
    }
  }, [searchParams]);

  useEffect(() => {
    filterPhotos();
  }, [photos, searchQuery, selectedEvent]);

  const fetchPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('photos')
        .select(`
          *,
          events (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      console.error('Error fetching photos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as fotos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, name, event_date')
        .order('event_date', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const filterPhotos = () => {
    let filtered = photos;

    if (selectedEvent) {
      filtered = filtered.filter(photo => photo.event_id === selectedEvent);
    }

    if (searchQuery) {
      filtered = filtered.filter(photo =>
        photo.original_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (photo.events?.name && photo.events.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    setFilteredPhotos(filtered);
  };

  const handleAddToCart = (photo: Photo) => {
    if (isInCart(photo.id)) {
      removeItem(photo.id);
      toast({
        title: "Removido do carrinho",
        description: `${photo.original_name} foi removido do carrinho`
      });
    } else {
      addItem({
        id: photo.id,
        filename: photo.filename,
        original_name: photo.original_name,
        storage_path: photo.storage_path
      });
      toast({
        title: "Adicionado ao carrinho",
        description: `${photo.original_name} foi adicionado ao carrinho`
      });
    }
  };

  const handleDownload = async (photo: Photo) => {
    try {
      const { data } = await supabase.storage
        .from('photos')
        .download(photo.storage_path);

      if (data) {
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = photo.original_name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
          title: "Download iniciado",
          description: `${photo.original_name} está sendo baixado`
        });
      }
    } catch (error) {
      console.error('Error downloading photo:', error);
      toast({
        title: "Erro no download",
        description: "Não foi possível baixar a foto",
        variant: "destructive"
      });
    }
  };

  const getPhotoUrl = (storagePath: string) => {
    const { data } = supabase.storage
      .from('photos')
      .getPublicUrl(storagePath);
    return data.publicUrl;
  };

  const canDownload = (photo: Photo) => {
    return photo.price === 0 || isPurchased(photo.id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl mb-4">📸</div>
          <p className="text-muted-foreground">Carregando galeria...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Galeria de Fotos</h1>
          <p className="text-muted-foreground">
            Explore e baixe suas fotos favoritas dos eventos
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowFaceRecognition(true)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Busca Facial
          </Button>
          
          {totalItems > 0 && (
            <CartSidebar />
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar fotos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <select
          value={selectedEvent}
          onChange={(e) => setSelectedEvent(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background"
        >
          <option value="">Todos os eventos</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.name}
            </option>
          ))}
        </select>
      </div>

      {/* Photos Grid */}
      {filteredPhotos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-4xl mb-4">📸</div>
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery || selectedEvent ? 'Nenhuma foto encontrada' : 'Nenhuma foto ainda'}
            </h3>
            <p className="text-muted-foreground">
              {searchQuery || selectedEvent 
                ? 'Tente ajustar os filtros de busca' 
                : 'As fotos dos eventos serão exibidas aqui'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredPhotos.map((photo) => (
            <Card key={photo.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-square relative group cursor-pointer">
                <ImageProtection
                  src={getPhotoUrl(photo.storage_path)}
                  alt={photo.original_name}
                  className="w-full h-full object-cover"
                  onLoad={() => {}}
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleOpenPhotoViewer(filteredPhotos.indexOf(photo))}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    {canDownload(photo) ? (
                      <Button
                        size="sm"
                        onClick={() => handleDownload(photo)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant={isInCart(photo.id) ? "destructive" : "default"}
                        onClick={() => handleAddToCart(photo)}
                      >
                        <ShoppingCart className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              
              <CardContent className="p-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">
                      {photo.original_name}
                    </p>
                    {photo.price > 0 && (
                      <Badge variant="secondary" className="flex items-center">
                        <DollarSign className="h-3 w-3 mr-1" />
                        {photo.price.toFixed(2)}
                      </Badge>
                    )}
                  </div>
                  
                  {photo.events && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1" />
                      {photo.events.name}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modals and Sidebars */}
      {showPhotoViewer && filteredPhotos[photoViewerIndex] && (
        <PhotoViewer
          isOpen={showPhotoViewer}
          onClose={() => setShowPhotoViewer(false)}
          photo={filteredPhotos[photoViewerIndex]}
          photos={filteredPhotos}
          onNavigate={handleNavigatePhoto}
          canDownload={canDownload(filteredPhotos[photoViewerIndex])}
        />
      )}

      {showFaceRecognition && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Busca Facial</h3>
              <Button
                variant="ghost"
                size="sm" 
                onClick={() => setShowFaceRecognition(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <FaceRecognition
              photos={photos}
              onPhotosFiltered={(photoIds) => {
                const foundPhotos = photos.filter(p => photoIds.includes(p.id));
                setFilteredPhotos(foundPhotos);
                setShowFaceRecognition(false);
              }}
              onClearFilter={() => {
                setFilteredPhotos(photos);
                setShowFaceRecognition(false);
              }}
              isActive={true}
            />
          </div>
        </div>
      )}

      <CartSidebar />
    </div>
  );
};

export default Gallery;