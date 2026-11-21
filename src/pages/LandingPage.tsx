import React from 'react';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';

export const LandingPage: React.FC = () => {
  return (
    <div className="flex flex-col flex-1">
      <HeroSection />
      <FeaturesSection />
    </div>
  );
};
