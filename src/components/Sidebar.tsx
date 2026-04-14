import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, History, SquareMenu as MenuSquare, Users, ChevronDown, ChevronRight, FolderTree, Coffee, HeartPlus, Layers, UserRoundCog, IdCard, IdCardLanyard, Settings, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Route } from '../types';
import { useAuthStore } from '../stores/authStore';
import { useSidebarStore } from '../stores/sidebarStore';
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
    icon: 'ClipboardList',
    subRoutes: [
      {
        path: '/historico',
        name: 'Historial de Pedidos',
        icon: 'History',
      }
    ]
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
    path: '/adicionales',
    subRoutes: [
      {
        path: '/adicionales/opciones',
        name: 'Opciones',
        icon: 'Layers'
      }
    ]
  },
  {
    path: '/usuarios',
    name: 'Staff',
    icon: 'IdCardLanyard',
    adminOnly: true
  },
  {
    path: '/alumnos',
    name: 'Alumnos',
    icon: 'Users',
    adminOnly: true
  },
  {
    path: '/configuracion',
    name: 'Configuración',
    icon: 'Settings',
    adminOnly: true
  },
];

const iconComponents: { [key: string]: React.ComponentType<any> } = {
  LayoutDashboard,
  ClipboardList,
  History,
  MenuSquare,
  Users,
  FolderTree,
  Coffee,
  HeartPlus,
  Layers,
  UserRoundCog,
  IdCard,
  IdCardLanyard,
  Settings,
};

export default function Sidebar() {
  const { user } = useAuthStore();
  const { isCollapsed, toggleSidebar } = useSidebarStore();
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

    if (isCollapsed && level > 0) return null;

    return (
      <div key={route.path} className="relative group">
        <div className={clsx(
          "flex items-center gap-3 py-3 rounded-xl transition-all duration-200",
          {
            'bg-accent text-white shadow-lg shadow-accent/20': isActive,
            'translate-x-1': isActive && !isCollapsed,
            'text-secondary-light hover:bg-white/5': !isActive,
            'text-accent/90': !isActive && isChildActive,
            'px-4': level === 0 && !isCollapsed,
            'px-2 justify-center': isCollapsed,
            'pl-8': level === 1 && !isCollapsed,
            'pl-12': level === 2 && !isCollapsed,
          }
        )}>
          <NavLink
            to={route.path}
            className={clsx("flex items-center gap-3 flex-1", {
              'justify-center': isCollapsed,
            })}
            title={isCollapsed ? route.name : undefined}
          >
            {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
            {!isCollapsed && <span className="font-medium">{route.name}</span>}
          </NavLink>

          {hasSubRoutes && !isCollapsed && (
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

        {isCollapsed && (
          <div className="absolute left-full top-0 ml-2 px-3 py-2 bg-primary-dark dark:bg-darkbg-darker text-white text-sm rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 shadow-lg">
            {route.name}
          </div>
        )}

        {hasSubRoutes && isExpanded && !isCollapsed && (
          <div className="space-y-1 mt-1">
            {route.subRoutes!.map(subRoute => renderNavItem(subRoute, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={clsx(
      "hidden md:flex bg-primary-dark dark:bg-darkbg-darker text-white h-screen flex-col transition-all duration-300 flex-shrink-0",
      isCollapsed ? 'w-16' : 'w-64'
    )}>
      <div className="bg-white dark:bg-darkbg-darker p-4 flex flex-col items-center">
        {!isCollapsed ? (
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
          <div className="h-8" />
        )}
      </div>

      <nav className={clsx("flex-1 space-y-1 overflow-y-auto", isCollapsed ? 'p-2' : 'p-4')}>
        {filteredRoutes.map(route => renderNavItem(route))}
      </nav>

      <div className="border-t border-white/10">
        {!isCollapsed && (
          <div className="px-4 py-3 text-sm text-secondary-light">
            <p className="font-medium truncate">{user?.full_name}</p>
            <p className="text-xs opacity-75 truncate">{user?.email}</p>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className={clsx(
            "w-full flex items-center gap-3 py-3 text-secondary-light/70 hover:text-white hover:bg-white/5 transition-colors duration-200",
            isCollapsed ? 'justify-center px-2' : 'px-6'
          )}
          title={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          {isCollapsed ? (
            <ChevronsRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronsLeft className="w-5 h-5" />
              <span className="text-sm">Colapsar menú</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
