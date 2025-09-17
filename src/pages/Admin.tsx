import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { 
  Users, 
  ImageIcon, 
  Calendar, 
  MapPin, 
  Upload,
  Trash2,
  DollarSign
} from 'lucide-react';

interface UserProfile {
  id: string;
  name: string;
  user_id: string;
  phone: string;
  approved: boolean;
  created_at: string;
}

interface Photo {
  id: string;
  filename: string;
  original_name: string;
  storage_path: string;
  price: number;
  created_at: string;
  event_id: string | null;
}

interface Event {
  id: string;
  name: string;
  description: string | null;
  event_date: string;
  location: string | null;
  thumbnail_url: string | null;
}

const Admin = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Event form state
  const [eventName, setEventName] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  
  // Photo upload state
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchPhotos();
    fetchEvents();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ approved: true })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Usuário aprovado com sucesso!"
      });

      fetchUsers();
    } catch (error) {
      console.error('Error approving user:', error);
      toast({
        title: "Erro",
        description: "Não foi possível aprovar o usuário",
        variant: "destructive"
      });
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('events')
        .insert([{
          name: eventName,
          description: eventDescription || null,
          event_date: eventDate,
          location: eventLocation || null
        }]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Evento criado com sucesso!"
      });

      // Reset form
      setEventName('');
      setEventDescription('');
      setEventDate('');
      setEventLocation('');
      
      fetchEvents();
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o evento",
        variant: "destructive"
      });
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `photos/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Save photo record to database
        const { error: dbError } = await supabase
          .from('photos')
          .insert([{
            filename: fileName,
            original_name: file.name,
            storage_path: filePath,
            file_size: file.size,
            mime_type: file.type,
            price: 0.00 // Default price
          }]);

        if (dbError) throw dbError;
      }

      toast({
        title: "Sucesso",
        description: `${files.length} foto(s) enviada(s) com sucesso!`
      });

      fetchPhotos();
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar fotos",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleUpdatePhotoPrice = async (photoId: string, newPrice: number) => {
    try {
      const { error } = await supabase
        .from('photos')
        .update({ price: newPrice })
        .eq('id', photoId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Preço atualizado com sucesso!"
      });

      fetchPhotos();
    } catch (error) {
      console.error('Error updating photo price:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o preço",
        variant: "destructive"
      });
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      const { error } = await supabase
        .from('photos')
        .delete()
        .eq('id', photoId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Foto excluída com sucesso!"
      });

      fetchPhotos();
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a foto",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl mb-4">⚙️</div>
          <p className="text-muted-foreground">Carregando painel administrativo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Painel Administrativo</h1>
        <p className="text-muted-foreground">
          Gerencie eventos, fotos e usuários da plataforma
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">
              {users.filter(u => u.approved).length} aprovados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Fotos</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{photos.length}</div>
            <p className="text-xs text-muted-foreground">
              Disponíveis na galeria
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
            <p className="text-xs text-muted-foreground">
              Eventos cadastrados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Create Event Form */}
      <Card>
        <CardHeader>
          <CardTitle>Criar Novo Evento</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateEvent} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="eventName">Nome do Evento</Label>
                <Input
                  id="eventName"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="eventDate">Data</Label>
                <Input
                  id="eventDate"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="eventLocation">Local</Label>
              <Input
                id="eventLocation"
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="eventDescription">Descrição</Label>
              <Input
                id="eventDescription"
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
              />
            </div>
            <Button type="submit">Criar Evento</Button>
          </form>
        </CardContent>
      </Card>

      {/* Photo Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Upload de Fotos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              type="file"
              multiple
              accept="image/*"
              onChange={handlePhotoUpload}
              disabled={uploading}
            />
            {uploading && (
              <p className="text-sm text-muted-foreground">
                Enviando fotos...
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Photos Management */}
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Fotos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {photos.map((photo) => (
              <div key={photo.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{photo.original_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Enviada em {new Date(photo.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4" />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={photo.price}
                      onChange={(e) => handleUpdatePhotoPrice(photo.id, parseFloat(e.target.value) || 0)}
                      className="w-20"
                    />
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeletePhoto(photo.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Users Management */}
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.phone}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={user.approved ? "default" : "outline"}>
                    {user.approved ? "Aprovado" : "Pendente"}
                  </Badge>
                  {!user.approved && (
                    <Button
                      size="sm"
                      onClick={() => handleApproveUser(user.id)}
                    >
                      Aprovar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Admin;