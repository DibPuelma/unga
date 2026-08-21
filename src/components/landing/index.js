import React from 'react';
import { Box } from '@mui/material';
import LandingNav from './LandingNav';
import Hero from './Hero';
import HowItWorks from './HowItWorks';
import PricingSection from './PricingSection';
import SocialProof from './SocialProof';
import FAQ from './FAQ';
import LandingFooter from './LandingFooter';

export default function LandingPage() {
  return (
    <Box sx={{ bgcolor: 'white' }}>
      <LandingNav />
      <Hero />
      <HowItWorks />
      <PricingSection />
      <SocialProof />
      <FAQ />
      <LandingFooter />
    </Box>
  );
}
