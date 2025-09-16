import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Calendar, Edit, Trash2, Upload } from 'lucide-react';

interface UserProfile {
  id: string;
  name: string;
  phone: string;
  approved: boolean;
  created_at: string;
}

interface Photo {
  id: string;
  filename: string;
  original_name: string;
  storage_path: string;
  created_at: string;
  event_id: string | null;
  price: number;
}

interface Event {
  id: string;
  name: string;
  description: string | null;
  event_date: string;
  location: string | null;
  created_at: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [selectedEventForUpload, setSelectedEventForUpload] = useState<string>('no-event');

  // Event form state
  const [eventForm, setEventForm] = useState({
    name: '',
    description: '',
    event_date: '',
    location: ''
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      checkAdminStatus();
    }
  }, [user, authLoading, navigate]);

  const checkAdminStatus = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('approved')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error checking admin status:', error);
      navigate('/dashboard');
      return;
    }

    if (!data?.approved) {
      navigate('/dashboard');
      return;
    }

    setIsAdmin(true);
    fetchUsers();
    fetchPhotos();
    fetchEvents();
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return;
    }

    setUsers(data || []);
    setLoading(false);
  };

  const fetchPhotos = async () => {
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching photos:', error);
      return;
    }

    setPhotos(data || []);
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

  const createEvent = async () => {
    if (!eventForm.name || !eventForm.event_date) {
      toast({
        title: "Erro",
        description: "Nome e data do evento são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    const { error } = await supabase
      .from('events')
      .insert({
        ...eventForm,
        created_by: user!.id
      });

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar o evento",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Sucesso",
      description: "Evento criado com sucesso!"
    });

    setEventForm({ name: '', description: '', event_date: '', location: '' });
    setCreateEventOpen(false);
    fetchEvents();
  };

  const deleteEvent = async (eventId: string) => {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o evento",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Sucesso",
      description: "Evento excluído com sucesso"
    });

    fetchEvents();
  };

  const toggleUserApproval = async (userId: string, currentApproval: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ approved: !currentApproval })
      .eq('id', userId);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o usuário",
        variant: "destructive"
      });
      return;
    }

    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, approved: !currentApproval } : user
    ));

    toast({
      title: "Sucesso",
      description: `Usuário ${!currentApproval ? 'aprovado' : 'bloqueado'} com sucesso`
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(filePath, file);

        if (uploadError) {
          throw uploadError;
        }

        // Save to database
        const { error: dbError } = await supabase
          .from('photos')
          .insert({
            filename: fileName,
            original_name: file.name,
            file_size: file.size,
            mime_type: file.type,
            storage_path: filePath,
            uploaded_by: user!.id,
            event_id: selectedEventForUpload === 'no-event' ? null : selectedEventForUpload
          });

        if (dbError) {
          throw dbError;
        }
      }

      toast({
        title: "Sucesso",
        description: `${files.length} foto(s) enviada(s) com sucesso!`
      });

      fetchPhotos();
      
      // Clear input
      event.target.value = '';
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar as fotos",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const updatePhotoEvent = async (photoId: string, eventId: string | null) => {
    const { error } = await supabase
      .from('photos')
      .update({ event_id: eventId })
      .eq('id', photoId);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a foto",
        variant: "destructive"
      });
      return;
    }

    setPhotos(prev => prev.map(photo => 
      photo.id === photoId ? { ...photo, event_id: eventId } : photo
    ));

    toast({
      title: "Sucesso",
      description: "Foto atualizada com sucesso"
    });
  };

  const updatePhotoPrice = async (photoId: string, price: number) => {
    const { error } = await supabase
      .from('photos')
      .update({ price })
      .eq('id', photoId);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o preço",
        variant: "destructive"
      });
      return;
    }

    setPhotos(prev => prev.map(photo => 
      photo.id === photoId ? { ...photo, price } : photo
    ));

    toast({
      title: "Sucesso",
      description: "Preço atualizado com sucesso"
    });
  };

  const deletePhoto = async (photoId: string, storagePath: string) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('photos')
        .remove([storagePath]);

      if (storageError) {
        throw storageError;
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('photos')
        .delete()
        .eq('id', photoId);

      if (dbError) {
        throw dbError;
      }

      setPhotos(prev => prev.filter(photo => photo.id !== photoId));

      toast({
        title: "Sucesso",
        description: "Foto excluída com sucesso"
      });
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a foto",
        variant: "destructive"
      });
    }
  };

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

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-4xl mb-4">🚫</div>
          <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
          <p className="text-muted-foreground mb-4">Você não tem permissão para acessar esta página.</p>
          <Button onClick={() => navigate('/dashboard')}>
            Voltar ao Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Administração</h1>
        <p className="text-muted-foreground">Gerencie eventos, fotos e usuários</p>
      </div>

      <Tabs defaultValue="events" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="events">Eventos</TabsTrigger>
          <TabsTrigger value="photos">Fotos</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Gerenciar Eventos</CardTitle>
              <Dialog open={createEventOpen} onOpenChange={setCreateEventOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Evento
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Novo Evento</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nome do Evento</Label>
                      <Input
                        id="name"
                        value={eventForm.name}
                        onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                        placeholder="Ex: Campeonato de Vôlei 2024"
                      />
                    </div>
                    <div>
                      <Label htmlFor="date">Data do Evento</Label>
                      <Input
                        id="date"
                        type="date"
                        value={eventForm.event_date}
                        onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Local</Label>
                      <Input
                        id="location"
                        value={eventForm.location}
                        onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                        placeholder="Ex: Ginásio Municipal"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Descrição</Label>
                      <Textarea
                        id="description"
                        value={eventForm.description}
                        onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                        placeholder="Descrição opcional do evento"
                      />
                    </div>
                    <Button onClick={createEvent} className="w-full">
                      Criar Evento
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {events.map((event) => (
                  <Card key={event.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{event.name}</h3>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>
                              <Calendar className="h-3 w-3 inline mr-1" />
                              {new Date(event.event_date).toLocaleDateString('pt-BR')}
                            </span>
                            {event.location && <span>{event.location}</span>}
                          </div>
                          {event.description && (
                            <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">
                            {photos.filter(p => p.event_id === event.id).length} fotos
                          </Badge>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/gallery?event=${event.id}`)}
                          >
                            <Calendar className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => deleteEvent(event.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {events.length === 0 && (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum evento criado</h3>
                    <p className="text-muted-foreground">Crie seu primeiro evento para começar</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="photos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload de Fotos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="event-select">Associar fotos ao evento (opcional)</Label>
                <Select value={selectedEventForUpload} onValueChange={setSelectedEventForUpload}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um evento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-event">Sem evento específico</SelectItem>
                    {events.filter(event => event.id && event.id.trim() !== '').map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.name} - {new Date(event.event_date).toLocaleDateString('pt-BR')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="w-full"
              />
              {uploading && (
                <p className="text-sm text-muted-foreground">
                  Enviando fotos...
                </p>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {photos.map((photo) => (
              <Card key={photo.id} className="overflow-hidden">
                <div className="aspect-square bg-muted flex items-center justify-center">
                  <img 
                    src={supabase.storage.from('photos').getPublicUrl(photo.storage_path).data.publicUrl}
                    alt={photo.original_name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <CardContent className="p-3 space-y-2">
                  <p className="text-sm font-medium truncate">{photo.original_name}</p>
                  <div className="space-y-2">
                    <Label htmlFor={`price-${photo.id}`}>Preço (R$)</Label>
                    <Input
                      id={`price-${photo.id}`}
                      type="number"
                      step="0.01"
                      min="0"
                      value={photo.price}
                      onChange={(e) => updatePhotoPrice(photo.id, parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                  <Select 
                    value={photo.event_id || 'no-event'} 
                    onValueChange={(value) => updatePhotoEvent(photo.id, value === 'no-event' ? null : value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sem evento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-event">Sem evento</SelectItem>
                      {events.filter(event => event.id && event.id.trim() !== '').map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={() => deletePhoto(photo.id, photo.storage_path)}
                    variant="destructive"
                    size="sm"
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Excluir
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((userProfile) => (
                  <div key={userProfile.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{userProfile.name}</h3>
                      <p className="text-sm text-muted-foreground">{userProfile.phone}</p>
                      <p className="text-xs text-muted-foreground">
                        Cadastrado em: {new Date(userProfile.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={userProfile.approved ? "default" : "secondary"}>
                        {userProfile.approved ? "Aprovado" : "Pendente"}
                      </Badge>
                      <Button
                        onClick={() => toggleUserApproval(userProfile.id, userProfile.approved)}
                        variant={userProfile.approved ? "destructive" : "default"}
                        size="sm"
                      >
                        {userProfile.approved ? "Bloquear" : "Aprovar"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;