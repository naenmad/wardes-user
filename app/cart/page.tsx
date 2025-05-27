'use client'

import { useState, useEffect } from 'react';
import { useCart, CartItemDetail } from '../../contexts/CartContext'; // Impor CartItemDetail
import {
    Box, Typography, Container, Card, IconButton,
    List, ListItem, ListItemText, ListItemAvatar, Avatar,
    Button, Divider, CircularProgress, Stack
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Cart() {
    // Ambil updateQuantity dari useCart
    const { cartItems, removeFromCart, updateQuantity, clearCart, isLoading } = useCart();
    const router = useRouter();

    const formatPrice = (price: number | undefined | null) => { // Tambahkan tipe untuk price
        if (price === undefined || price === null) {
            return 'Rp0';
        }
        return `Rp${price.toLocaleString('id-ID')}`;
    };

    const getTotalPrice = () => {
        return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    // Fungsi getSubtotal, getTax, getServiceFee, getGrandTotal bisa tetap sama

    const getSubtotal = () => {
        return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const getTax = () => {
        return getSubtotal() * 0.11; // 11% tax
    };

    const getServiceFee = () => {
        return 2000; // Rp2.000 flat fee
    };

    const getGrandTotal = () => {
        return getSubtotal() + getTax() + getServiceFee();
    };


    const handleBack = () => {
        router.back();
    };

    const handleCheckout = () => {
        router.push('/checkout');
    };

    // Fungsi untuk menangani pengurangan kuantitas atau penghapusan item
    const handleDecreaseQuantity = (item: CartItemDetail) => {
        if (item.quantity > 1) {
            updateQuantity(item.id, item.quantity - 1, { spicyLevel: item.spicyLevel, iceLevel: item.iceLevel });
        } else {
            // Jika kuantitas 1, hapus item
            removeFromCart(item.id, { spicyLevel: item.spicyLevel, iceLevel: item.iceLevel });
        }
    };

    // Fungsi untuk menangani penambahan kuantitas
    const handleIncreaseQuantity = (item: CartItemDetail) => {
        updateQuantity(item.id, item.quantity + 1, { spicyLevel: item.spicyLevel, iceLevel: item.iceLevel });
    };


    return (
        <Box sx={{ bgcolor: 'background.paper', minHeight: '100vh', pb: 8 }}>
            {/* Header */}
            <Box sx={{ bgcolor: 'white', py: 2, position: 'sticky', top: 0, zIndex: 10 }}>
                <Container maxWidth="sm">
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <IconButton onClick={handleBack} edge="start">
                            <ArrowBackIcon />
                        </IconButton>
                        <Typography variant="h6" component="h1" sx={{ fontWeight: 'bold' }}>
                            Keranjang
                        </Typography>
                    </Stack>
                </Container>
            </Box>

            <Container maxWidth="sm" sx={{ mt: 3 }}>
                {isLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress />
                    </Box>
                ) : cartItems.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                        <Box sx={{ mb: 3, width: 120, height: 120, mx: 'auto', position: 'relative' }}>
                            <Image
                                src="/images/cart/empty-cart.png" // Pastikan path ini benar
                                alt="Empty cart"
                                fill
                                style={{ objectFit: 'contain' }}
                            />
                        </Box>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                            Keranjang Kosong
                        </Typography>
                        <Button
                            variant="contained"
                            onClick={() => router.push('/')}
                            sx={{
                                mt: 2,
                                bgcolor: '#bc5a3c',
                                '&:hover': {
                                    bgcolor: '#a04e34',
                                },
                                borderRadius: 3,
                                px: 3,
                                py: 1
                            }}
                        >
                            Belanja Sekarang
                        </Button>
                    </Box>
                ) : (
                    <>
                        <List sx={{ mb: 4 }}>
                            {cartItems.map((item) => (
                                // Berikan key yang unik jika ada item dengan ID sama tapi level berbeda
                                <Card key={`${item.id}-${item.spicyLevel || 'none'}-${item.iceLevel || 'none'}`} sx={{ mb: 2, borderRadius: 3, overflow: 'hidden' }}>
                                    <Box sx={{ display: 'flex', p: 2 }}>
                                        <Box sx={{ width: 80, height: 80, position: 'relative', borderRadius: 2, overflow: 'hidden' }}>
                                            <Image
                                                src={item.image || '/placeholder.jpg'} // Sediakan placeholder jika image tidak ada
                                                alt={item.name}
                                                fill
                                                style={{ objectFit: 'cover' }}
                                            />
                                        </Box>

                                        <Box sx={{ ml: 2, flexGrow: 1 }}>
                                            <Typography variant="subtitle1" fontWeight="bold">
                                                {item.name}
                                            </Typography>
                                            {/* Tampilkan level jika ada */}
                                            {(item.spicyLevel || item.iceLevel) && (
                                                <Typography variant="caption" color="text.secondary" component="div">
                                                    {item.spicyLevel && `Pedas: ${item.spicyLevel}`}
                                                    {item.iceLevel && `Es: ${item.iceLevel}`}
                                                </Typography>
                                            )}
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                {formatPrice(item.price)}
                                            </Typography>

                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleDecreaseQuantity(item)} // Gunakan fungsi baru
                                                    sx={{ border: '1px solid #eee', p: 0.5 }}
                                                >
                                                    {/* Ikon delete jika kuantitas akan menjadi 0 */}
                                                    {item.quantity === 1 ? <DeleteIcon fontSize="small" /> : <RemoveIcon fontSize="small" />}
                                                </IconButton>

                                                <Typography sx={{ mx: 2 }}>
                                                    {item.quantity}
                                                </Typography>

                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleIncreaseQuantity(item)} // Gunakan fungsi baru
                                                    sx={{ border: '1px solid #eee', p: 0.5 }}
                                                >
                                                    <AddIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        </Box>

                                        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                            <Typography variant="subtitle1" fontWeight="bold">
                                                {formatPrice(item.price * item.quantity)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Card>
                            ))}
                        </List>

                        {/* ... (Ringkasan Pembayaran tetap sama) ... */}
                        <Box sx={{ bgcolor: 'white', borderRadius: 3, p: 2, mb: 2 }}>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                                Ringkasan Pembayaran
                            </Typography>

                            {/* Detail Item Breakdown */}
                            <Box sx={{ mb: 2 }}>
                                {cartItems.map((item) => (
                                    <Box key={`summary-${item.id}-${item.spicyLevel || 'none'}-${item.iceLevel || 'none'}`} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            {item.name}
                                            {(item.spicyLevel || item.iceLevel) && (
                                                <Typography variant="caption" component="span" sx={{ ml: 0.5 }}>
                                                    ({item.spicyLevel && `Pedas: ${item.spicyLevel}`}
                                                    {item.iceLevel && `Es: ${item.iceLevel}`})
                                                </Typography>
                                            )}
                                            {' '} ({item.quantity} x {formatPrice(item.price)})
                                        </Typography>
                                        <Typography variant="body2">
                                            {formatPrice(item.price * item.quantity)}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>

                            <Divider sx={{ my: 1.5 }} />

                            {/* Subtotal */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography>Subtotal</Typography>
                                <Typography>{formatPrice(getSubtotal())}</Typography>
                            </Box>

                            {/* Tax/Service (optional) */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography color="text.secondary">Pajak (11%)</Typography>
                                <Typography color="text.secondary">{formatPrice(getTax())}</Typography>
                            </Box>

                            {/* Delivery Fee (if applicable) */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography color="text.secondary">Biaya layanan</Typography>
                                <Typography color="text.secondary">{formatPrice(getServiceFee())}</Typography>
                            </Box>

                            {/* Discount/Promo (if applicable) */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography color="success.main">Diskon</Typography>
                                <Typography color="success.main">-Rp0</Typography>
                            </Box>

                            <Divider sx={{ my: 1.5 }} />

                            {/* Grand Total */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography fontWeight="bold" variant="subtitle1">Total</Typography>
                                <Typography fontWeight="bold" color="primary" variant="subtitle1">
                                    {formatPrice(getGrandTotal())}
                                </Typography>
                            </Box>

                            {/* Estimated time */}
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'right', mt: 1 }}>
                                Estimasi waktu penyajian: 20-30 menit
                            </Typography>
                        </Box>

                        <Button
                            variant="contained"
                            fullWidth
                            onClick={handleCheckout}
                            sx={{
                                py: 1.5,
                                borderRadius: 3,
                                bgcolor: '#bc5a3c',
                                '&:hover': {
                                    bgcolor: '#a04e34',
                                }
                            }}
                        >
                            Checkout
                        </Button>
                    </>
                )}
            </Container>
        </Box>
    );
}