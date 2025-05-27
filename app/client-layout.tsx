'use client'

import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { useState, useEffect } from 'react';
import Splash from '../src/components/splash/Splash';
import OnboardingFlow from '../src/components/onboardingflow/onBoardingFlow';
import { useRouter } from 'next/navigation';

// Create theme - this was missing
const theme = createTheme({
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                'html, body': {
                    margin: 0,
                    padding: 0,
                    height: '100%',
                    width: '100%',
                },
            },
        },
    },
    palette: {
        primary: {
            main: '#bc5a3c',
        },
    },
});

// Development flag
const FORCE_ONBOARDING = false;
const isDev = process.env.NODE_ENV === 'development';

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [showSplash, setShowSplash] = useState(true);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
    const router = useRouter();

    // Check if user has completed onboarding before
    useEffect(() => {
        // In development with FORCE_ONBOARDING enabled, always set to false
        if (isDev && FORCE_ONBOARDING) {
            setHasCompletedOnboarding(false);
            return;
        }

        // Normal behavior for production
        if (typeof window !== 'undefined') {
            const onboardingCompleted = localStorage.getItem('onboardingCompleted');
            setHasCompletedOnboarding(!!onboardingCompleted);
        }
    }, []);

    // Handle splash completion
    const handleSplashComplete = () => {
        setShowSplash(false);

        // Show onboarding only if user hasn't completed it before
        // OR we're forcing it in development mode
        if (!hasCompletedOnboarding || (isDev && FORCE_ONBOARDING)) {
            setShowOnboarding(true);
        }
    };

    // Handle onboarding completion
    const handleOnboardingComplete = () => {
        setShowOnboarding(false);

        // Save to localStorage
        localStorage.setItem('onboardingCompleted', 'true');
    };

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            {showSplash && (
                <Splash
                    duration={isDev ? 1000 : 3000}
                    onComplete={handleSplashComplete}
                    logo="/images/logo.png"
                    title="Wardes App"
                    subtitle="By Warung Desa"
                />
            )}

            {!showSplash && showOnboarding && (
                <OnboardingFlow onComplete={handleOnboardingComplete} />
            )}

            {!showSplash && !showOnboarding && children}
        </ThemeProvider>
    );
}