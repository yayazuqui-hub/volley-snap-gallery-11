import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { usePurchases } from '@/hooks/usePurchases';
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
import { Search, ShoppingCart, Calendar, ArrowLeft, Eye, Plus, Minus, Download, Check } from 'lucide-react';

interface Photo {
  id: string;
  filename: string;
  original_name: string;
  storage_path: string;
  created_at: string;
  price: number;
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
  const [searchParams] = useSearchParams();
  const { isInCart, addItem, removeItem, totalItems } = useCart();
  const { isPurchased, refreshPurchases } = usePurchases();
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

  // Check for payment status in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    
    if (paymentStatus === 'success') {
      toast({
        title: "Pagamento aprovado!",
        description: "Suas fotos já estão disponíveis para download sem marca d'água."
      });
      refreshPurchases();
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (paymentStatus === 'failure') {
      toast({
        title: "Pagamento rejeitado",
        description: "Houve um problema com seu pagamento. Tente novamente.",
        variant: "destructive"
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (paymentStatus === 'pending') {
      toast({
        title: "Pagamento pendente",
        description: "Seu pagamento está sendo processado. Aguarde a confirmação."
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [refreshPurchases]);

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

  const getPhotoUrl = (storagePath: string) => {
    return supabase.storage.from('photos').getPublicUrl(storagePath).data.publicUrl;
  };

  const handlePhotoView = (photo: Photo) => {
    setSelectedPhoto(photo);
    setIsViewerOpen(true);
  };

  const handleCartClick = (photo: Photo) => {
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

  const downloadSinglePhoto = async (photo: Photo) => {
    if (!userProfile?.approved) {
      toast({
        title: "Acesso negado",
        description: "Você precisa de aprovação do administrador",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from('photos')
        .download(photo.storage_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = photo.original_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Track download
      if (user) {
        await supabase
          .from('user_downloads')
          .upsert({
            user_id: user.id,
            photo_id: photo.id,
            download_count: 1
          });
      }

      toast({
        title: "Download concluído",
        description: `${photo.original_name} foi baixada com sucesso!`
      });
    } catch (error) {
      console.error('Error downloading photo:', error);
      toast({
        title: "Erro",
        description: "Erro ao baixar a foto",
        variant: "destructive"
      });
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

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl mb-4">📸</div>
          <p className="text-muted-foreground">Carregando galeria...</p>
        </div>
      </div>
    );
  }

  // Get current event info for header
  const currentEvent = selectedEventId ? events.find(e => e.id === selectedEventId) : null;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {selectedEventId && (
            <Button 
              variant="outline" 
              onClick={() => navigate('/gallery')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Todas as fotos
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-bold">
              {currentEvent ? currentEvent.name : 'Galeria de Fotos'}
            </h1>
            {currentEvent && (
              <div className="flex items-center text-muted-foreground">
                <Calendar className="h-4 w-4 mr-2" />
                {new Date(currentEvent.event_date).toLocaleDateString('pt-BR')}
              </div>
            )}
          </div>
        </div>
        <CartSidebar canDownload={userProfile?.approved} userId={user?.id} />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Pesquisar fotos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="w-full sm:w-64">
          <Select value={eventFilter} onValueChange={handleEventFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por evento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os eventos</SelectItem>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.name} - {new Date(event.event_date).toLocaleDateString('pt-BR')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Face Recognition Filter */}
      <FaceRecognition
        photos={filteredPhotos}
        onPhotosFiltered={handleFacePhotosFiltered}
        onClearFilter={handleClearFaceFilter}
        isActive={isFaceFilterActive}
      />

      {/* Photos Grid */}
      {filteredPhotos.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📸</div>
          <h3 className="text-lg font-semibold mb-2">Nenhuma foto encontrada</h3>
          <p className="text-muted-foreground">
            {searchQuery || eventFilter !== 'all' || isFaceFilterActive
              ? 'Tente ajustar seus filtros de busca'
              : 'Ainda não há fotos nesta galeria'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredPhotos.map((photo) => (
            <Card key={photo.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
              <div className="relative aspect-square">
                <ImageProtection
                  src={getPhotoUrl(photo.storage_path)}
                  alt={photo.original_name}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-3">
                <div className="space-y-2">
                  <div>
                    <h3 className="font-medium text-sm truncate">{photo.original_name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {new Date(photo.created_at).toLocaleDateString('pt-BR')}
                    </p>
                    {photo.events && (
                      <Badge variant="outline" className="text-xs">
                        {photo.events.name}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      {photo.price > 0 ? (
                        <Badge variant="default" className="text-xs">
                          R$ {photo.price.toFixed(2)}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Gratuita
                        </Badge>
                      )}
                      
                      {isPurchased(photo.id) && (
                        <Badge variant="default" className="text-xs bg-green-500">
                          <Check className="h-3 w-3 mr-1" />
                          Comprada
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePhotoView(photo)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {photo.price === 0 || isPurchased(photo.id) ? (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => downloadSinglePhoto(photo)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant={isInCart(photo.id) ? "destructive" : "default"}
                          size="sm"
                          onClick={() => handleCartClick(photo)}
                        >
                          {isInCart(photo.id) ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
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
        canDownload={userProfile?.approved}
        userId={user?.id}
      />
    </div>
  );
};

export default Gallery;