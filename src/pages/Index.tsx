import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, ImageIcon, ShoppingCart, Sparkles, Users, Trophy } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-volleyball-secondary/10 rounded-full blur-3xl animate-pulse delay-1000" />
      
      <div className="w-full max-w-6xl mx-auto relative z-10">
        <div className="text-center space-y-8">
          {/* Hero Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-center space-x-4 mb-6">
              <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg animate-bounce">
                🏐
              </div>
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center text-2xl animate-bounce delay-150">
                ✨
              </div>
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-bold tracking-tight">
              <span className="gradient-text">Bem-vindo ao</span>
              <br />
              <span className="text-foreground">Fotos do Vôlei!</span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Acesse sua conta para ver fotos dos eventos, criar seu carrinho de fotos favoritas e muito mais. 
              <span className="text-primary font-medium">Faça parte da nossa comunidade!</span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <Button 
              onClick={() => navigate('/auth')}
              size="lg"
              className="flex-1 h-12 text-lg font-medium gradient-primary hover:shadow-lg hover:scale-105 transition-all duration-200"
            >
              <Users className="mr-2 h-5 w-5" />
              Fazer Login
            </Button>
            <Button 
              onClick={() => navigate('/admin')}
              variant="outline"
              size="lg"
              className="flex-1 h-12 text-lg font-medium border-2 hover:bg-primary/10 hover:border-primary/50 hover:scale-105 transition-all duration-200"
            >
              <Trophy className="mr-2 h-5 w-5" />
              Área Admin
            </Button>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-16">
            <Card className="modern-card group">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto mb-4 gradient-primary rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="h-8 w-8" />
                </div>
                <CardTitle className="text-xl font-bold">Eventos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center leading-relaxed">
                  Acompanhe todos os eventos de vôlei, suas datas e participe da nossa comunidade esportiva
                </p>
              </CardContent>
            </Card>

            <Card className="modern-card group">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-volleyball-secondary to-volleyball-accent rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <ImageIcon className="h-8 w-8" />
                </div>
                <CardTitle className="text-xl font-bold">Galeria</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center leading-relaxed">
                  Veja todas as fotos dos eventos em alta qualidade com reconhecimento facial inteligente
                </p>
              </CardContent>
            </Card>

            <Card className="modern-card group">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-volleyball-accent to-primary rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <ShoppingCart className="h-8 w-8" />
                </div>
                <CardTitle className="text-xl font-bold">Carrinho</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center leading-relaxed">
                  Selecione suas fotos favoritas para download e mantenha suas memórias para sempre
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Call to Action */}
          <div className="mt-16 p-8 modern-card max-w-2xl mx-auto">
            <div className="flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-primary mr-2" />
              <span className="text-lg font-semibold gradient-text">
                Pronto para começar?
              </span>
            </div>
            <p className="text-muted-foreground mb-6">
              Junte-se a centenas de atletas que já utilizam nossa plataforma para guardar seus melhores momentos!
            </p>
            <Button 
              onClick={() => navigate('/auth')}
              className="gradient-primary hover:shadow-xl hover:scale-105 transition-all duration-300"
              size="lg"
            >
              Começar Agora
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;