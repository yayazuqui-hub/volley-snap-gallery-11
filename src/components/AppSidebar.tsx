import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  Calendar, 
  ImageIcon, 
  Settings, 
  LogOut,
  ShoppingCart 
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';

interface AppSidebarProps {
  userProfile?: {
    approved: boolean;
    name: string;
  } | null;
}

export function AppSidebar({ userProfile }: AppSidebarProps) {
  const location = useLocation();
  const { signOut } = useAuth();
  const { totalItems } = useCart();
  
  const currentPath = location.pathname;
  
  const mainItems = [
    { title: "Dashboard", url: "/dashboard", icon: Home },
    { title: "Eventos", url: "/events", icon: Calendar },
    { title: "Galeria", url: "/gallery", icon: ImageIcon },
  ];

  const adminItems = userProfile?.approved ? [
    { title: "Administração", url: "/admin", icon: Settings },
  ] : [];

  const isActive = (path: string) => currentPath === path;
  
  const getNavClassName = (isActive: boolean) => 
    isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted";

  return (
    <Sidebar className="border-r">
      <SidebarContent>
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🏐</span>
            <div>
              <h2 className="font-semibold">Fotos do Vôlei</h2>
              <p className="text-xs text-muted-foreground">
                {userProfile?.name || 'Usuário'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={getNavClassName(isActive(item.url))}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Cart Section */}
        {totalItems > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Carrinho</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="px-3 py-2 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShoppingCart className="h-4 w-4" />
                  <span className="text-sm">Itens selecionados</span>
                </div>
                <Badge variant="secondary">{totalItems}</Badge>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Admin Section */}
        {adminItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Administração</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        className={getNavClassName(isActive(item.url))}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="p-4 border-t">
        <div className="flex items-center justify-between mb-2">
          <Badge variant={userProfile?.approved ? "secondary" : "outline"} className="text-xs">
            {userProfile?.approved ? "Aprovado" : "Pendente"}
          </Badge>
        </div>
        <Button onClick={signOut} variant="outline" size="sm" className="w-full">
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}