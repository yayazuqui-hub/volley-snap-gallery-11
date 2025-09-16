import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, ImageIcon, ShoppingCart } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🏐</div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-6xl mx-auto">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Bem-vindo ao Fotos do Vôlei! 🏐</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Acesse sua conta para ver fotos dos eventos, criar seu carrinho de fotos favoritas e muito mais.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <Button 
              onClick={() => navigate('/auth')}
              size="lg"
              className="flex-1"
            >
              Fazer Login
            </Button>
            <Button 
              onClick={() => navigate('/admin')}
              variant="outline"
              size="lg"
              className="flex-1"
            >
              Área Admin
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
            <Card>
              <CardHeader className="text-center">
                <Calendar className="h-12 w-12 mx-auto text-primary mb-4" />
                <CardTitle>Eventos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center">
                  Acompanhe todos os eventos de vôlei e suas datas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <ImageIcon className="h-12 w-12 mx-auto text-primary mb-4" />
                <CardTitle>Galeria</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center">
                  Veja todas as fotos dos eventos em alta qualidade
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <ShoppingCart className="h-12 w-12 mx-auto text-primary mb-4" />
                <CardTitle>Carrinho</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center">
                  Selecione suas fotos favoritas para download
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;