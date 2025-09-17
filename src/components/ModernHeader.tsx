import React, { useState } from 'react';
import { Menu, Search, Bell, User, X, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { MobileMenu } from '@/components/MobileMenu';
import { useCart } from '@/hooks/useCart';

export function ModernHeader() {
  const { totalItems } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="h-16 glass-effect border-b border-border/50 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-50">
        {/* Left Section - Logo & Menu */}
        <div className="flex items-center space-x-4">
          {/* Mobile Menu Toggle */}
          <Button 
            variant="ghost" 
            size="sm"
            className="lg:hidden hover:bg-primary/10"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          {/* Desktop Menu Toggle */}
          <div className="hidden lg:flex">
            <SidebarTrigger />
          </div>

          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="text-2xl">🏐</div>
            <div className="hidden sm:flex flex-col">
              <span className="font-bold text-lg gradient-text">Fotos do Vôlei</span>
              <span className="text-xs text-muted-foreground">
                Galeria de Fotos
              </span>
            </div>
          </div>
        </div>

        {/* Center Section - Search (Hidden on mobile) */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar fotos..."
              className="pl-10 bg-background/50 border-border/50 focus:border-primary/50"
            />
          </div>
        </div>

        {/* Right Section - Actions & Profile */}
        <div className="flex items-center space-x-2">
          {/* Mobile Search */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="md:hidden hover:bg-primary/10"
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Cart Badge */}
          {totalItems > 0 && (
            <div className="relative">
              <Button 
                variant="ghost" 
                size="sm" 
                className="hover:bg-primary/10 relative"
              >
                <ShoppingCart className="h-5 w-5" />
                <Badge 
                  variant="default" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-primary min-w-5"
                >
                  {totalItems > 99 ? '99+' : totalItems}
                </Badge>
              </Button>
            </div>
          )}

          {/* Notifications */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="hover:bg-primary/10 relative"
          >
            <Bell className="h-5 w-5" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="hover:bg-primary/10 flex items-center space-x-2"
              >
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
                <span className="hidden sm:block text-sm font-medium">
                  Menu
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 glass-effect">
              <div className="px-3 py-2">
                <p className="text-sm font-medium">Fotos do Vôlei</p>
                <Badge 
                  variant="outline" 
                  className="text-xs mt-1"
                >
                  Galeria
                </Badge>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="hover:bg-primary/10">
                <User className="mr-2 h-4 w-4" />
                Perfil
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Mobile Menu */}
      <MobileMenu 
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </>
  );
}