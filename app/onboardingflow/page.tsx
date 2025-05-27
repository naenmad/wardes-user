'use client'

import { FC } from 'react';
import { Box, Button, Typography, Container } from '@mui/material';
import { useRouter } from 'next/navigation';

// Halaman onboarding standalone
const OnboardingPage = () => {
    const router = useRouter();

    // Handler untuk menyelesaikan onboarding
    const handleComplete = () => {
        // Simpan status onboarding ke localStorage
        if (typeof window !== 'undefined') {
            localStorage.setItem('onboardingCompleted', 'true');
        }

        // Redirect ke halaman utama
        router.push('/');
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                py: 4
            }}>
                <Typography variant="h4" gutterBottom align="center">
                    Selamat Datang di Warung Desa
                </Typography>

                <Typography variant="body1" paragraph align="center">
                    Nikmati pengalaman memesan makanan secara digital
                </Typography>

                {/* Konten onboarding dengan langkah-langkah */}
                <Box sx={{ my: 4 }}>
                    {/* Konten onboarding steps bisa ditambahkan di sini */}
                </Box>

                <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    onClick={handleComplete}
                    sx={{
                        mt: 4,
                        bgcolor: '#bc5a3c',
                        '&:hover': {
                            bgcolor: '#a04e34',
                        },
                        borderRadius: 3,
                        py: 1.5
                    }}
                >
                    Mulai Menjelajah
                </Button>
            </Box>
        </Container>
    );
};

export default OnboardingPage;