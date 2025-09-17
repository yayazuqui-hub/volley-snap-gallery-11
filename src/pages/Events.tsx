import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Calendar, MapPin, ImageIcon, Search } from 'lucide-react';

interface Event {
  id: string;
  name: string;
  description: string | null;
  event_date: string;
  location: string | null;
  thumbnail_url: string | null;
  photo_count?: number;
}

const Events = () => {
  const [searchParams] = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    // Filter events based on search query
    if (searchQuery.trim() === '') {
      setFilteredEvents(events);
    } else {
      const filtered = events.filter(event =>
        event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (event.location && event.location.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredEvents(filtered);
    }
  }, [searchQuery, events]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          id,
          name,
          description,
          event_date,
          location,
          thumbnail_url
        `)
        .order('event_date', { ascending: false });

      if (error) throw error;

      // Count photos for each event
      const eventsWithPhotoCount = await Promise.all(
        (data || []).map(async (event) => {
          const { count } = await supabase
            .from('photos')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id);

          return {
            ...event,
            photo_count: count || 0
          };
        })
      );

      setEvents(eventsWithPhotoCount);
      setFilteredEvents(eventsWithPhotoCount);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os eventos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleViewEvent = (eventId: string) => {
    // Navigate to gallery with event filter - simplified without navigation
    console.log('View event:', eventId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl mb-4">🏐</div>
          <p className="text-muted-foreground">Carregando eventos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Eventos</h1>
        <p className="text-muted-foreground">
          Confira todos os eventos de vôlei e suas fotos
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar eventos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? 'Nenhum evento encontrado' : 'Nenhum evento ainda'}
            </h3>
            <p className="text-muted-foreground">
              {searchQuery 
                ? 'Tente buscar com outros termos' 
                : 'Os eventos serão exibidos aqui quando forem criados'
              }
            </p>
          </div>
        ) : (
          filteredEvents.map((event) => (
            <Card key={event.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{event.name}</CardTitle>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        {formatDate(event.event_date)}
                      </div>
                      {event.location && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          {event.location}
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {event.photo_count} fotos
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                {event.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {event.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <ImageIcon className="h-4 w-4 mr-1" />
                    {event.photo_count} fotos disponíveis
                  </div>
                  
                  {event.photo_count > 0 && (
                    <Button 
                      size="sm" 
                      onClick={() => handleViewEvent(event.id)}
                      className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Ver Fotos
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Events;