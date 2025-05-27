'use client'

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Box, Typography, CircularProgress, Button } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function PaymentSuccess() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const orderId = searchParams.get('order_id');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Auto redirect setelah 3 detik
        const timer = setTimeout(() => {
            router.push('/');
        }, 3000);

        setLoading(false);

        return () => clearTimeout(timer);
    }, [router]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            px: 3
        }}>
            <CheckCircleIcon sx={{ fontSize: 80, color: 'green', mb: 2 }} />
            <Typography variant="h5" fontWeight="bold" gutterBottom>
                Pembayaran Berhasil!
            </Typography>
            <Typography variant="body1" color="text.secondary" textAlign="center" mb={3}>
                Order #{orderId} telah berhasil dibayar.
                <br />
                Anda akan diarahkan ke halaman utama dalam 3 detik.
            </Typography>
            <Button
                variant="contained"
                onClick={() => router.push('/')}
                sx={{ bgcolor: '#bc5a3c' }}
            >
                Kembali ke Beranda
            </Button>
        </Box>
    );
}