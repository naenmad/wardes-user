'use client'

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Box, Typography, CircularProgress, Button } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function PaymentFinish() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const orderId = searchParams.get('order_id');
    const status = searchParams.get('transaction_status');

    useEffect(() => {
        // Update order status dan redirect
        const handlePaymentFinish = async () => {
            if (orderId && status === 'settlement') {
                try {
                    // Update status order
                    await fetch('/api/update-order-status', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ orderId, status: 'confirmed' }),
                    });

                    // Clear cart
                    localStorage.removeItem('cart');

                    setLoading(false);

                    // Redirect ke home setelah 3 detik
                    setTimeout(() => {
                        router.push('/');
                    }, 3000);
                } catch (error) {
                    console.error('Error updating order:', error);
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };

        handlePaymentFinish();
    }, [orderId, status, router]);

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