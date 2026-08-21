import { useState } from 'react';

// Maps the API's 402 NO_CREDITS response to the right paywall variant.
export default function usePaywall() {
  const [paywall, setPaywall] = useState({ open: false, variant: 'trial' });

  const openPaywallFromResponse = (errorResponse) => {
    const plan = errorResponse?.data?.plan;
    setPaywall({ open: true, variant: plan === 'unga' ? 'monthly' : 'trial' });
  };

  const closePaywall = () => setPaywall((p) => ({ ...p, open: false }));

  return { paywall, openPaywallFromResponse, closePaywall };
}
