import React from 'react';
import { Bell, User, LogOut } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const { user, signOut } = useAuthStore();

  return (
    <header className="bg-white dark:bg-darkbg border-b border-gray-200 dark:border-darkbg-darker h-16 px-6 flex items-center justify-between transition-colors duration-200">
      <h1 className="text-xl font-semibold text-primary-dark dark:text-secondary-light">
        Sistema de Gestión de Cafetería
      </h1>
      
      <div className="flex items-center gap-4">
        <ThemeToggle />
        
        <button className="p-2 hover:bg-gray-100 dark:hover:bg-darkbg-lighter rounded-full relative transition-colors duration-200">
          <Bell className="w-6 h-6 text-gray-600 dark:text-secondary-light" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-darkbg-darker">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.full_name}</p>
            <p className="text-xs text-gray-500 dark:text-secondary-light">{user?.email}</p>
          </div>
          <div className="w-10 h-10 bg-primary-light dark:bg-primary rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <button
            onClick={() => signOut()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-darkbg-lighter rounded-full text-gray-600 dark:text-secondary-light transition-colors duration-200"
            title="Cerrar sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}