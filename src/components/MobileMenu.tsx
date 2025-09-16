import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  Calendar, 
  ImageIcon, 
  Settings,
  X,
  ShoppingCart,
  LogOut,
  User
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile?: {
    approved: boolean;
    name: string;
  } | null;
}

export function MobileMenu({ isOpen, onClose, userProfile }: MobileMenuProps) {
  const location = useLocation();
  const { signOut } = useAuth();
  const { totalItems } = useCart();
  
  const currentPath = location.pathname;
  
  const mainItems = [
    { 
      title: "Dashboard", 
      url: "/dashboard", 
      icon: Home,
      description: "Visão geral" 
    },
    { 
      title: "Eventos", 
      url: "/events", 
      icon: Calendar,
      description: "Próximos jogos" 
    },
    { 
      title: "Galeria", 
      url: "/gallery", 
      icon: ImageIcon,
      description: "Suas fotos" 
    },
  ];

  const adminItems = userProfile?.approved ? [
    { 
      title: "Administração", 
      url: "/admin", 
      icon: Settings,
      description: "Gerenciar" 
    },
  ] : [];

  const isActive = (path: string) => currentPath === path;
  
  const handleNavClick = () => {
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-80 p-0 glass-effect">
        <SheetHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center space-x-3">
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center text-white text-lg shadow-md">
                🏐
              </div>
              <div>
                <span className="font-bold text-lg gradient-text">Fotos do Vôlei</span>
                <p className="text-xs text-muted-foreground font-normal">
                  {userProfile?.name || 'Usuário'}
                </p>
              </div>
            </SheetTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="hover:bg-primary/10"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 px-6 space-y-6">
          {/* Navigation Links */}
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center">
              <span>Principal</span>
            </h3>
            {mainItems.map((item) => (
              <NavLink
                key={item.title}
                to={item.url}
                onClick={handleNavClick}
                className={`
                  flex items-center space-x-3 p-3 rounded-lg transition-all duration-200
                  ${isActive(item.url) 
                    ? "bg-primary text-primary-foreground shadow-md" 
                    : "hover:bg-primary/10"
                  }
                `}
              >
                <item.icon className="h-5 w-5" />
                <div className="flex-1">
                  <span className="font-medium">{item.title}</span>
                  <p className="text-xs opacity-70">{item.description}</p>
                </div>
              </NavLink>
            ))}
          </div>

          {/* Cart Section */}
          {totalItems > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Carrinho
              </h3>
              <div className="modern-card p-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShoppingCart className="h-4 w-4" />
                  <span className="text-sm font-medium">Itens selecionados</span>
                </div>
                <Badge variant="default" className="bg-primary text-primary-foreground">
                  {totalItems}
                </Badge>
              </div>
            </div>
          )}

          {/* Admin Section */}
          {adminItems.length > 0 && (
            <div className="space-y-1">
              <Separator />
              <h3 className="text-sm font-medium text-muted-foreground mb-3 pt-4">
                Administração
              </h3>
              {adminItems.map((item) => (
                <NavLink
                  key={item.title}
                  to={item.url}
                  onClick={handleNavClick}
                  className={`
                    flex items-center space-x-3 p-3 rounded-lg transition-all duration-200
                    ${isActive(item.url) 
                      ? "bg-primary text-primary-foreground shadow-md" 
                      : "hover:bg-primary/10"
                    }
                  `}
                >
                  <item.icon className="h-5 w-5" />
                  <div className="flex-1">
                    <span className="font-medium">{item.title}</span>
                    <p className="text-xs opacity-70">{item.description}</p>
                  </div>
                </NavLink>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border/50 mt-auto">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{userProfile?.name || 'Usuário'}</p>
                <Badge 
                  variant={userProfile?.approved ? "default" : "outline"} 
                  className="text-xs"
                >
                  {userProfile?.approved ? "✓ Aprovado" : "⏳ Pendente"}
                </Badge>
              </div>
            </div>
            
            <Button 
              onClick={() => {
                signOut();
                onClose();
              }}
              variant="outline" 
              size="sm" 
              className="w-full hover:bg-destructive/10 hover:border-destructive/50 hover:text-destructive"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}