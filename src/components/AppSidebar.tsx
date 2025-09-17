import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  Calendar, 
  ImageIcon, 
  Settings, 
  ShoppingCart,
  Sparkles,
  TrendingUp
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
  useSidebar,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/useCart';

export function AppSidebar() {
  const location = useLocation();
  const { totalItems } = useCart();
  const { state } = useSidebar();
  
  const currentPath = location.pathname;
  const isCollapsed = state === "collapsed";
  
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

  const adminItems = [
    { 
      title: "Administração", 
      url: "/admin", 
      icon: Settings,
      description: "Gerenciar" 
    },
  ];

  const isActive = (path: string) => currentPath === path;
  
  const getNavClassName = (isActive: boolean) => 
    isActive 
      ? "bg-primary text-primary-foreground shadow-md transform scale-[1.02]" 
      : "hover:bg-primary/10 hover:scale-[1.01]";

  return (
    <Sidebar 
      className={`
        glass-effect border-r border-border/50 
        ${isCollapsed ? "w-16" : "w-64"} 
        transition-all duration-300 ease-in-out
      `}
      collapsible="icon"
    >
      <SidebarContent className="p-2">
        {/* Compact Header for Mobile */}
        {!isCollapsed && (
          <div className="p-4 mb-2">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center text-white text-lg shadow-md">
                🏐
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-bold text-lg gradient-text truncate">
                  Fotos do Vôlei
                </h2>
                <p className="text-xs text-muted-foreground truncate">
                  Galeria de Fotos
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className={isCollapsed ? "sr-only" : ""}>
            <Sparkles className="h-4 w-4 mr-2" />
            {!isCollapsed && "Principal"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <NavLink 
                    to={item.url} 
                    className={`
                      ${getNavClassName(isActive(item.url))}
                      rounded-lg p-3 transition-all duration-200
                      flex items-center space-x-3
                      ${isCollapsed ? "justify-center" : ""}
                    `}
                    title={isCollapsed ? item.title : undefined}
                  >
                    <item.icon className={`h-5 w-5 ${isCollapsed ? "mx-auto" : ""}`} />
                    {!isCollapsed && (
                      <div className="flex-1 min-w-0">
                        <span className="font-medium truncate block">{item.title}</span>
                        <span className="text-xs opacity-70 truncate block">
                          {item.description}
                        </span>
                      </div>
                    )}
                  </NavLink>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Cart Section */}
        {totalItems > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className={isCollapsed ? "sr-only" : ""}>
              <ShoppingCart className="h-4 w-4 mr-2" />
              {!isCollapsed && "Carrinho"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <div className={`
                modern-card p-3 
                ${isCollapsed ? "flex justify-center" : "flex items-center justify-between"}
              `}>
                <div className={`flex items-center ${isCollapsed ? "" : "space-x-2"}`}>
                  <ShoppingCart className="h-4 w-4" />
                  {!isCollapsed && (
                    <span className="text-sm font-medium">Itens selecionados</span>
                  )}
                </div>
                <Badge 
                  variant="default" 
                  className={`
                    bg-primary text-primary-foreground 
                    ${isCollapsed ? "absolute -top-1 -right-1 h-5 w-5 text-xs" : ""}
                  `}
                >
                  {totalItems}
                </Badge>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Admin Section */}
        {adminItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className={isCollapsed ? "sr-only" : ""}>
              <TrendingUp className="h-4 w-4 mr-2" />
              {!isCollapsed && "Administração"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <NavLink 
                      to={item.url} 
                      className={`
                        ${getNavClassName(isActive(item.url))}
                        rounded-lg p-3 transition-all duration-200
                        flex items-center space-x-3
                        ${isCollapsed ? "justify-center" : ""}
                      `}
                      title={isCollapsed ? item.title : undefined}
                    >
                      <item.icon className={`h-5 w-5 ${isCollapsed ? "mx-auto" : ""}`} />
                      {!isCollapsed && (
                        <div className="flex-1 min-w-0">
                          <span className="font-medium truncate block">{item.title}</span>
                          <span className="text-xs opacity-70 truncate block">
                            {item.description}
                          </span>
                        </div>
                      )}
                    </NavLink>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="p-4 border-t border-border/50">
        {!isCollapsed && (
          <div className="flex items-center justify-center mb-3">
            <Badge 
              variant="outline" 
              className="text-xs"
            >
              🏐 Vôlei
            </Badge>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}