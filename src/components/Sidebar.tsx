import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ClipboardList,
  MenuSquare,
  Users,
  ChevronDown,
  ChevronRight,
  FolderTree,
  Coffee,
  HeartPlus,
  Blend,
  Soup
} from 'lucide-react';
import { Route } from '../types';
import { useAuthStore } from '../stores/authStore';
import clsx from 'clsx';

interface SubRoute {
  path: string;
  name: string;
  icon?: string;
  subRoutes?: SubRoute[];
}

interface RouteWithSubRoutes extends Route {
  subRoutes?: SubRoute[];
}

const routes: RouteWithSubRoutes[] = [
  { 
    path: '/dashboard', 
    name: 'Dashboard', 
    icon: 'LayoutDashboard', 
    adminOnly: true 
  },
  { 
    path: '/pedidos', 
    name: 'Pedidos', 
    icon: 'ClipboardList' 
  },
  { 
    path: '/menus', 
    name: 'Menús', 
    icon: 'MenuSquare',
    subRoutes: [
      { 
        path: '/categorias', 
        name: 'Categorías',
        icon: 'FolderTree',
        subRoutes: [
          { 
            path: '/productos', 
            name: 'Productos',
            icon: 'Coffee'
          }
        ]
      }
    ]
  },
  {
    
    name: 'Adicionales',
    icon: 'HeartPlus',
    subRoutes: [
      {
        path: '/adicionales/variantes',
        name: 'Variantes',
        icon: 'Blend'
      },
      {
        path: '/adicionales/ingredientes',
        name: 'Ingredientes',
        icon: 'Soup'
      }
    ]
  },
  { 
    path: '/usuarios', 
    name: 'Usuarios', 
    icon: 'Users', 
    adminOnly: true 
  },
];

const iconComponents: { [key: string]: React.ComponentType<any> } = {
  LayoutDashboard,
  ClipboardList,
  MenuSquare,
  Users,
  FolderTree,
  Coffee,
  HeartPlus,
  Blend,
  Soup,
};

export default function Sidebar() {
  const { user } = useAuthStore();
  const location = useLocation();
  const isAdmin = user?.role === 'Administrador';
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['/menus', '/adicionales']);

  const filteredRoutes = routes.filter(route => !route.adminOnly || isAdmin);

  const toggleMenu = (path: string) => {
    setExpandedMenus(current => 
      current.includes(path)
        ? current.filter(p => p !== path)
        : [...current, path]
    );
  };

  const renderNavItem = (route: RouteWithSubRoutes | SubRoute, level: number = 0) => {
    const Icon = route.icon ? iconComponents[route.icon] : null;
    const hasSubRoutes = route.subRoutes && route.subRoutes.length > 0;
    const isExpanded = expandedMenus.includes(route.path);
    const isActive = location.pathname === route.path;
    const isChildActive = location.pathname.startsWith(route.path);

    return (
      <div key={route.path} className="relative">
        <div className={clsx(
          "flex items-center gap-3 py-3 rounded-xl transition-all duration-200",
          {
            'bg-accent text-white shadow-lg shadow-accent/20 translate-x-2': isActive,
            'text-secondary-light hover:bg-white/5': !isActive,
            'text-accent/90': !isActive && isChildActive,
            'px-4': level === 0,
            'pl-8': level === 1,
            'pl-12': level === 2
          }
        )}>
          {/* Always render NavLink for navigation */}
          <NavLink
            to={route.path}
            className="flex items-center gap-3 flex-1"
          >
            {Icon && <Icon className="w-5 h-5" />}
            <span className="font-medium">{route.name}</span>
          </NavLink>

          {/* Render expand/collapse button for routes with subRoutes */}
          {hasSubRoutes && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleMenu(route.path);
              }}
              className={clsx(
                "p-1 rounded-lg transition-colors hover:bg-white/10",
                "focus:outline-none focus:ring-2 focus:ring-white/20"
              )}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {hasSubRoutes && isExpanded && (
          <div className="space-y-1 mt-1">
            {route.subRoutes.map(subRoute => renderNavItem(subRoute, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-primary-dark dark:bg-darkbg-darker text-white w-64 min-h-screen flex flex-col transition-colors duration-200">
      <div className="bg-white dark:bg-darkbg-darker p-6 flex flex-col items-center">
        <img 
          src="https://ctjfdevwmxtuhylpspih.supabase.co/storage/v1/object/public/product_images//Logo%20Vertical%20(1).jpg"
          alt="Café Admin Logo"
          className="h-28 w-auto mb-4 block dark:hidden"
        />
        <img 
          src="https://ctjfdevwmxtuhylpspih.supabase.co/storage/v1/object/public/product_images//Fondo%20Obscuro.png"
          alt="Café Admin Logo"
          className="h-28 w-auto mb-4 hidden dark:block"
        />
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {filteredRoutes.map(route => renderNavItem(route))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="px-4 py-3 text-sm text-secondary-light">
          <p className="font-medium">{user?.full_name}</p>
          <p className="text-xs opacity-75">{user?.email}</p>
        </div>
      </div>
    </div>
  );
}