import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { PageBackdrop } from '../components/festive/FestiveDecor';

export default function MainLayout() {
  return (
    <div className="isolate flex h-screen bg-gray-50 dark:bg-darkbg transition-colors duration-200 overflow-hidden">
      <Sidebar />
      <div className="relative flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <PageBackdrop />
        <Header />
        <main className="flex-1 overflow-auto p-2 md:p-3 lg:p-4 xl:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}