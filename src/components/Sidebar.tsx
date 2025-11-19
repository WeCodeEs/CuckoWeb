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
  Soup,
  ChevronLeft,
  ChevronRightIcon
} from 'lucide-react';
import { Route } from '../types';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
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
  const { isSidebarCollapsed, toggleSidebar } = useThemeStore();
  const location = useLocation();
  const isAdmin = user?.role === 'Administrador';
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['/menus', '/adicionales']);
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

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

    if (isSidebarCollapsed && level > 0) {
      return null;
    }

    return (
      <div key={route.path} className="relative" title={isSidebarCollapsed ? route.name : ''}>
        <div className={clsx(
          "flex items-center gap-3 py-3 rounded-xl transition-all duration-200",
          {
            'bg-accent text-white shadow-lg shadow-accent/20 translate-x-2': isActive,
            'text-secondary-light hover:bg-white/5': !isActive,
            'text-accent/90': !isActive && isChildActive,
            'px-4': level === 0,
            'pl-8': level === 1 && !isSidebarCollapsed,
            'pl-12': level === 2 && !isSidebarCollapsed,
            'justify-center': isSidebarCollapsed && level === 0
          }
        )}>
          {isSidebarCollapsed ? (
            <NavLink
              to={route.path}
              className="flex items-center justify-center"
            >
              {Icon && <Icon className="w-5 h-5" />}
            </NavLink>
          ) : (
            <>
              <NavLink
                to={route.path}
                className="flex items-center gap-3 flex-1"
              >
                {Icon && <Icon className="w-5 h-5" />}
                <span className="font-medium">{route.name}</span>
              </NavLink>

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
            </>
          )}
        </div>

        {hasSubRoutes && isExpanded && !isSidebarCollapsed && (
          <div className="space-y-1 mt-1">
            {route.subRoutes.map(subRoute => renderNavItem(subRoute, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={clsx(
      "bg-primary-dark dark:bg-darkbg-darker text-white min-h-screen flex flex-col transition-all duration-300 relative",
      isSidebarCollapsed ? "w-16" : "w-64"
    )}>
      <div className={clsx(
        "bg-white dark:bg-darkbg-darker flex flex-col items-center transition-all duration-300",
        isSidebarCollapsed ? "p-3" : "p-6"
      )}>
        {!isSidebarCollapsed ? (
          <>
            <img
              src={`${SUPABASE_URL}/storage/v1/object/sign/images/Logo_Vertical.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9iYjIwYTQ2OC0zZGUxLTQ4ZGMtOWY4Zi04ODUyNDRiNDIwYzEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWFnZXMvTG9nb19WZXJ0aWNhbC5qcGciLCJpYXQiOjE3NTk4Njk0ODQsImV4cCI6NDkxMzQ2OTQ4NH0.fVr0DAFBXQuW-38eQIqfCCAqNwo3mCdEo45tLJmohqM`}
              alt="Café Admin Logo"
              className="h-28 w-auto mb-4 block dark:hidden"
            />
            <img
              src={`${SUPABASE_URL}/storage/v1/object/sign/images/Logo_Cuckoo_Fondo_Oscuro.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9iYjIwYTQ2OC0zZGUxLTQ4ZGMtOWY4Zi04ODUyNDRiNDIwYzEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJpbWFnZXMvTG9nb19DdWNrb29fRm9uZG9fT3NjdXJvLnBuZyIsImlhdCI6MTc1OTg2OTcxNywiZXhwIjo0OTEzNDY5NzE3fQ.6JcaTT2Nwfu9PpiDSpjhhbGREcnVvI1lPktXne9A_DQ`}
              alt="Café Admin Logo"
              className="h-28 w-auto mb-4 hidden dark:block"
            />
          </>
        ) : (
          <img
            src="/assets/Isotipo.png"
            alt="Logo"
            className="h-10 w-10"
          />
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {filteredRoutes.map(route => renderNavItem(route))}
      </nav>

      <div className="border-t border-white/10">
        {!isSidebarCollapsed ? (
          <div className="p-4 flex items-center justify-between">
            <div className="px-4 py-3 text-sm text-secondary-light flex-1">
              <p className="font-medium">{user?.full_name}</p>
              <p className="text-xs opacity-75">{user?.email}</p>
            </div>
            <button
              onClick={toggleSidebar}
              className="bg-accent/10 hover:bg-accent/20 text-accent p-2 rounded-lg transition-all duration-200"
              title="Contraer sidebar"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="p-3 flex justify-center">
            <button
              onClick={toggleSidebar}
              className="bg-accent/10 hover:bg-accent/20 text-accent p-2 rounded-lg transition-all duration-200"
              title="Expandir sidebar"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}