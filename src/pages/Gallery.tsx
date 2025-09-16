import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CartSidebar } from '@/components/CartSidebar';
import { ImageProtection } from '@/components/ImageProtection';
import { PhotoViewer } from '@/components/PhotoViewer';
import { FaceRecognition } from '@/components/FaceRecognition';
import { toast } from '@/hooks/use-toast';
import { Search, ShoppingCart, Calendar, ArrowLeft, Eye } from 'lucide-react';

interface Photo {
  id: string;
  filename: string;
  original_name: string;
  storage_path: string;
  created_at: string;
  event_id: string | null;
  events?: {
    name: string;
    event_date: string;
  } | null;
}

interface Event {
  id: string;
  name: string;
  event_date: string;
}

interface UserProfile {
  approved: boolean;
  name: string;
}

const Gallery = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isInCart, addItem, removeItem, totalItems } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedEventId = searchParams.get('event');
  
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredPhotos, setFilteredPhotos] = useState<Photo[]>([]);
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [faceFilteredPhotos, setFaceFilteredPhotos] = useState<string[]>([]);
  const [isFaceFilterActive, setIsFaceFilterActive] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      fetchUserProfile();
      fetchPhotos();
      fetchEvents();
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    // Set initial event filter from URL
    if (selectedEventId && selectedEventId !== eventFilter) {
      setEventFilter(selectedEventId);
    }
  }, [selectedEventId]);

  useEffect(() => {
    // Filter photos based on search, event filter, and face recognition
    let filtered = photos;

    // Filter by event
    if (eventFilter !== 'all') {
      filtered = filtered.filter(photo => photo.event_id === eventFilter);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(photo =>
        photo.original_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by face recognition
    if (isFaceFilterActive && faceFilteredPhotos.length > 0) {
      filtered = filtered.filter(photo => faceFilteredPhotos.includes(photo.id));
    }

    setFilteredPhotos(filtered);
  }, [photos, searchQuery, eventFilter, faceFilteredPhotos, isFaceFilterActive]);

  const fetchUserProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('approved, name')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return;
    }

    setUserProfile(data);
  };

  const fetchPhotos = async () => {
    const { data, error } = await supabase
      .from('photos')
      .select(`
        *,
        events (
          name,
          event_date
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching photos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as fotos",
        variant: "destructive"
      });
      return;
    }

    setPhotos(data || []);
    setLoading(false);
  };

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: false });

    if (error) {
      console.error('Error fetching events:', error);
      return;
    }

    setEvents(data || []);
  };

  const getPhotoUrl = (path: string) => {
    const { data } = supabase.storage
      .from('photos')
      .getPublicUrl(path);
    return data.publicUrl;
  };

  const handlePhotoView = (photo: Photo) => {
    setSelectedPhoto(photo);
    setIsViewerOpen(true);
  };

  const handleCartClick = (photo: Photo, e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleNavigatePhoto = (direction: 'prev' | 'next') => {
    if (!selectedPhoto) return;
    
    const currentIndex = filteredPhotos.findIndex(p => p.id === selectedPhoto.id);
    let newIndex;
    
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : filteredPhotos.length - 1;
    } else {
      newIndex = currentIndex < filteredPhotos.length - 1 ? currentIndex + 1 : 0;
    }
    
    setSelectedPhoto(filteredPhotos[newIndex]);
  };

  const handleEventFilterChange = (value: string) => {
    setEventFilter(value);
    if (value === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ event: value });
    }
  };

  const handleFacePhotosFiltered = (photoIds: string[]) => {
    setFaceFilteredPhotos(photoIds);
    setIsFaceFilterActive(true);
  };

  const handleClearFaceFilter = () => {
    setFaceFilteredPhotos([]);
    setIsFaceFilterActive(false);
  };

  const selectedEvent = events.find(e => e.id === eventFilter);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl mb-4">🏐</div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        {selectedEventId && selectedEvent && (
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/events')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Eventos
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{selectedEvent.name}</h1>
              <p className="text-muted-foreground">
                <Calendar className="h-4 w-4 inline mr-1" />
                {new Date(selectedEvent.event_date).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        )}
        
        {!selectedEventId && (
          <div>
            <h1 className="text-3xl font-bold">Galeria de Fotos</h1>
            <p className="text-muted-foreground">
              Explore todas as fotos dos eventos em miniatura
            </p>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar fotos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={eventFilter} onValueChange={handleEventFilterChange}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Filtrar por evento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os eventos</SelectItem>
            {events.filter(event => event.id && event.id.trim() !== '').map((event) => (
              <SelectItem key={event.id} value={event.id}>
                {event.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <CartSidebar 
          canDownload={userProfile?.approved || false} 
          userId={user?.id}
        />
      </div>

      {/* Face Recognition */}
      <FaceRecognition
        photos={photos.map(p => ({ id: p.id, storage_path: p.storage_path, original_name: p.original_name }))}
        onPhotosFiltered={handleFacePhotosFiltered}
        onClearFilter={handleClearFaceFilter}
        isActive={isFaceFilterActive}
      />

      {/* Photos Grid */}
      {filteredPhotos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-4xl mb-4">
              {searchQuery || eventFilter !== 'all' || isFaceFilterActive ? '🔍' : '📷'}
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {searchQuery || eventFilter !== 'all' || isFaceFilterActive ? 'Nenhuma foto encontrada' : 'Nenhuma foto ainda'}
            </h3>
            <p className="text-muted-foreground">
              {searchQuery || eventFilter !== 'all' || isFaceFilterActive
                ? 'Tente ajustar os filtros de busca ou reconhecimento facial'
                : 'As fotos dos eventos serão adicionadas aqui em breve!'
              }
            </p>
            {(searchQuery || eventFilter !== 'all' || isFaceFilterActive) && (
              <div className="flex gap-2 justify-center mt-4 flex-wrap">
                {searchQuery && (
                  <Button onClick={() => setSearchQuery('')} variant="outline" size="sm">
                    Limpar busca
                  </Button>
                )}
                {eventFilter !== 'all' && (
                  <Button onClick={() => handleEventFilterChange('all')} variant="outline" size="sm">
                    Ver todas as fotos
                  </Button>
                )}
                {isFaceFilterActive && (
                  <Button onClick={handleClearFaceFilter} variant="outline" size="sm">
                    Limpar filtro facial
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filteredPhotos.map((photo) => (
            <Card 
              key={photo.id} 
              className="group overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handlePhotoView(photo)}
            >
              <div className="relative aspect-square bg-muted">
                <ImageProtection
                  src={getPhotoUrl(photo.storage_path)}
                  alt={photo.original_name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                
                {/* Overlay com ações */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="shadow-lg text-xs px-2 py-1"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Ver
                  </Button>
                  <Button
                    size="sm"
                    variant={isInCart(photo.id) ? "default" : "outline"}
                    onClick={(e) => handleCartClick(photo, e)}
                    className="shadow-lg text-xs px-2 py-1"
                  >
                    <ShoppingCart className="h-3 w-3 mr-1" />
                    {isInCart(photo.id) ? 'Remover' : 'Carrinho'}
                  </Button>
                </div>

                {/* Indicador se está no carrinho */}
                {isInCart(photo.id) && (
                  <Badge className="absolute top-1 right-1 bg-primary text-primary-foreground text-xs">
                    <ShoppingCart className="h-2 w-2 mr-1" />
                    ✓
                  </Badge>
                )}

                {/* Info do evento */}
                {photo.events && (
                  <Badge variant="secondary" className="absolute bottom-1 left-1 text-xs px-1 py-0.5">
                    {photo.events.name.substring(0, 15)}...
                  </Badge>
                )}
              </div>
              
              <CardContent className="p-2">
                <p className="text-xs font-medium truncate">{photo.original_name}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(photo.created_at).toLocaleDateString('pt-BR')}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Photo Viewer */}
      <PhotoViewer
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        photo={selectedPhoto}
        photos={filteredPhotos}
        onNavigate={handleNavigatePhoto}
        canDownload={false}
        userId={user?.id}
      />
    </div>
  );
};

export default Gallery;