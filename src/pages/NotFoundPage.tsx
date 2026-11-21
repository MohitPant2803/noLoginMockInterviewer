import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex-1 flex items-center justify-center p-4 min-h-[60vh]">
      <div className="text-center space-y-3 max-w-sm">
        <h1 className="text-4xl font-mono font-bold text-text-muted">404</h1>
        <h2 className="text-base font-semibold text-text-primary">Page not found</h2>
        <p className="text-xs text-text-muted">
          The requested route does not exist.
        </p>
        <div className="pt-2">
          <Link to="/">
            <Button size="sm" variant="outline" leftIcon={<Home className="h-3.5 w-3.5" />}>
              Return to overview
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
