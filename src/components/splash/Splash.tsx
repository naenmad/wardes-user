import { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Container } from '@mui/material';
import Image from 'next/image';
import AOS from 'aos';
import 'aos/dist/aos.css';

interface SplashProps {
    duration?: number;  // Duration in ms for splash screen to remain visible
    onComplete?: () => void;  // Callback when splash animation completes
    logo?: string;  // Path to logo image
    title?: string;  // App or brand name
    subtitle?: string;  // Optional tagline
}

const Splash = ({
    duration = 3000,
    onComplete,
    logo = '/logo.png',  // Remove 'public' from the path
    title = 'Warung Desa',
    subtitle = 'By Warung Desa',
}: SplashProps) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        // Initialize AOS
        AOS.init({
            duration: 1000,
            once: true,
        });

        // Set timer to hide splash screen
        const timer = setTimeout(() => {
            setVisible(false);
            if (onComplete) onComplete();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onComplete]);

    if (!visible) return null;

    return (
        <Box
            sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'background.paper',
                zIndex: 9999,
            }}
        >
            <Container
                maxWidth="sm"
                sx={{
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4
                }}
            >
                {logo && (
                    <Box
                        data-aos="zoom-in"
                        sx={{ mb: 3, position: 'relative', width: 120, height: 120 }}
                    >
                        <Image
                            src={logo}
                            alt={title}
                            fill
                            style={{ objectFit: 'contain' }}
                            priority
                        />
                    </Box>
                )}

                <Typography
                    data-aos="fade-up"
                    data-aos-delay="300"
                    variant="h3"
                    component="h1"
                    fontWeight="bold"
                >
                    {title}
                </Typography>

                {subtitle && (
                    <Typography
                        data-aos="fade-up"
                        data-aos-delay="600"
                        variant="subtitle1"
                        color="text.secondary"
                    >
                        {subtitle}
                    </Typography>
                )}

                <Box
                    data-aos="fade-up"
                    data-aos-delay="900"
                    sx={{ mt: 3 }}
                >
                    <CircularProgress color="primary" />
                </Box>
            </Container>
        </Box>
    );
};

export default Splash;