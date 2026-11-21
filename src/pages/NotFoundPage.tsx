import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-sm">
        <h1 className="text-6xl font-extrabold text-slate-700 font-mono">404</h1>
        <h2 className="text-xl font-bold text-slate-100">Page Not Found</h2>
        <p className="text-sm text-slate-400">
          The page you requested does not exist or may have been moved.
        </p>
        <div className="pt-2">
          <Link to="/">
            <Button leftIcon={<Home className="h-4 w-4" />}>
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
