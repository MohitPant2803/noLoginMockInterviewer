import React from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Header } from './Header';
import { Footer } from './Footer';

export const RootLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-canvas text-text-primary font-sans">
      <Header />
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
      <Footer />
      <Toaster
        theme="light"
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          className: 'bg-white border border-border-strong text-text-primary shadow-md rounded text-xs',
        }}
      />
    </div>
  );
};
