'use client'

import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Container,
    Paper,
    TextField,
    Button,
    IconButton,
    Stack,
    Divider,
    FormControl,
    FormControlLabel,
    RadioGroup,
    Radio,
    CircularProgress,
    InputAdornment,
    Snackbar,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { createOrder } from '../../lib/firebase/orders';
import PaymentIcon from '@mui/icons-material/Payment';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import SendIcon from '@mui/icons-material/Send';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonIcon from '@mui/icons-material/Person';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { useCart } from '../../contexts/CartContext';

// Define cart item interface
interface CartItem {
    id: string;
    name: string;
    description: string;
    price: number;
    quantity: number;
    image: string;
    spicyLevel?: string;
    specialInstructions?: string; // Add this property
}

// Add this at the top of your file
declare global {
    interface Window {
        snap?: {
            pay: (token: string, options: any) => void;
        }
    }
}

// Define checkout form interface - simplified
interface CheckoutForm {
    name: string; // Keep these for API compatibility
    phone: string;
    address: string;
    notes: string;
    paymentMethod: string;
}

export default function Checkout() {
    const router = useRouter();
    const { cartItems, isLoading, clearCart } = useCart(); // Tambahkan clearCart di sini
    const [submitting, setSubmitting] = useState(false);
    const [language, setLanguage] = useState('id');
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
    const [openDialog, setOpenDialog] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(false);
    const [orderId, setOrderId] = useState('');
    const [midtransLoaded, setMidtransLoaded] = useState(false);
    const [midtransToken, setMidtransToken] = useState('');
    const [tableNumber, setTableNumber] = useState(''); // Added table number state

    // Update the form state to remove personal information fields
    const [form, setForm] = useState<CheckoutForm>({
        name: 'Customer', // Default name
        phone: '123456789', // Default phone
        address: 'Dine-in', // Default address
        notes: '',
        paymentMethod: 'cash'
    });

    // Remove error validation for personal information
    const [errors, setErrors] = useState({});

    // Load language from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedLanguage = localStorage.getItem('preferredLanguage') || 'id';
            setLanguage(savedLanguage);
        }
    }, []);

    // Add this effect after your other useEffects
    useEffect(() => {
        if (typeof window !== 'undefined') {
            // Get table number from localStorage
            const savedTable = localStorage.getItem('tableNumber');
            if (savedTable) {
                setTableNumber(savedTable);
            }
        }
    }, []);

    const handleGoBack = () => {
        router.back();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm({
            ...form,
            [name]: value
        });
    };

    // Update the validateForm function
    const validateForm = (): boolean => {
        // No validation needed for personal info
        return true;
    };

    const handleSubmit = () => {
        if (!validateForm()) {
            setSnackbarSeverity('error');
            setSnackbarMessage(t.formError);
            setOpenSnackbar(true);
            return;
        }

        setOpenDialog(true);
    };

    const handleConfirmOrder = async () => {
        try {
            setSubmitting(true);
            setOpenDialog(false); // Close dialog immediately to show processing

            // Validasi cart items
            if (!cartItems || cartItems.length === 0) {
                throw new Error('Cart is empty');
            }

            // Get table number from localStorage
            const tableNumber = localStorage.getItem('tableNumber') || 'unknown';

            // Validasi data yang akan dikirim
            const requestData = {
                items: cartItems.map(item => {
                    // Validasi setiap item
                    if (!item.id || !item.name || typeof item.price !== 'number' || typeof item.quantity !== 'number') {
                        console.error('Invalid item data:', item);
                        throw new Error(`Invalid item data for: ${item.name || 'Unknown item'}`);
                    }

                    return {
                        id: item.id,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity,
                        spicyLevel: item.spicyLevel || null,
                        iceLevel: item.iceLevel || null
                    };
                }),
                customer: {
                    name: form.name,
                    phone: form.phone,
                    address: form.address
                },
                notes: form.notes,
                paymentMethod: form.paymentMethod,
                totalAmount: getGrandTotal(),
                tableNumber: tableNumber,
                languageUsed: language || 'id'
            };

            console.log('Sending request data:', requestData);

            const response = await fetch('/api/create-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);

            // Get response text first for debugging
            const responseText = await response.text();
            console.log('Response text:', responseText);

            if (!response.ok) {
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

                // Try to parse error message from response
                try {
                    const errorData = JSON.parse(responseText);
                    errorMessage = errorData.message || errorData.error || errorMessage;
                } catch (parseError) {
                    console.error('Could not parse error response:', parseError);
                }

                throw new Error(errorMessage);
            }

            // Parse successful response
            const data = JSON.parse(responseText);
            console.log('Success response data:', data);

            if (data.success) {
                // Store the order ID for reference
                setOrderId(data.orderId);

                // For cash payments, we're done - mark order as complete
                if (form.paymentMethod === 'cash') {
                    setOrderPlaced(true);
                    clearCart();
                }
                // For non-cash payments, handle Midtrans
                else if (data.token) {
                    setMidtransToken(data.token);

                    // If Midtrans is loaded, open the payment window
                    if (midtransLoaded && window.snap) {
                        window.snap.pay(data.token, {
                            // Konfigurasi untuk memastikan popup mode
                            skipOrderSummary: false,

                            onSuccess: function (result: any) {
                                console.log('Payment success:', result);
                                setOrderPlaced(true);
                                clearCart();

                                // Update status di background
                                setTimeout(() => {
                                    updateOrderStatus(data.orderId, 'confirmed');
                                }, 1000);
                            },
                            onPending: function (result: any) {
                                console.log('Payment pending:', result);
                                setSnackbarSeverity('info');
                                setSnackbarMessage('Payment is being processed...');
                                setOpenSnackbar(true);

                                // Check status secara berkala untuk pending payment
                                const checkInterval = setInterval(async () => {
                                    try {
                                        const statusData = await checkPaymentStatus(data.orderId);
                                        if (statusData && statusData.status === 'confirmed') {
                                            setOrderPlaced(true);
                                            clearCart();
                                            clearInterval(checkInterval);
                                        }
                                    } catch (error) {
                                        console.error('Error checking status:', error);
                                    }
                                }, 5000);

                                // Stop checking after 5 minutes
                                setTimeout(() => {
                                    clearInterval(checkInterval);
                                }, 300000);
                            },
                            onError: function (result: any) {
                                console.log('Payment error:', result);
                                setSnackbarSeverity('error');
                                setSnackbarMessage('Payment failed. Please try again.');
                                setOpenSnackbar(true);

                                updateOrderStatus(data.orderId, 'cancelled');
                            },
                            onClose: function () {
                                console.log('Payment popup closed');
                                setSnackbarSeverity('warning');
                                setSnackbarMessage('Payment was cancelled.');
                                setOpenSnackbar(true);
                            }
                        });
                    } else {
                        // Fallback jika Snap tidak load - redirect manual
                        if (data.redirectUrl) {
                            // Buka di tab yang sama, bukan tab baru
                            window.location.href = data.redirectUrl;
                        } else {
                            throw new Error('Payment gateway not available');
                        }
                    }
                } else {
                    throw new Error('Invalid payment response - no token received');
                }
            } else {
                throw new Error(data.message || 'Payment failed');
            }
        } catch (error: any) {
            console.error('Error processing payment:', error);
            setSnackbarSeverity('error');
            setSnackbarMessage(error.message || 'Failed to process payment. Please try again.');
            setOpenSnackbar(true);
        } finally {
            setSubmitting(false);
        }
    };

    const checkPaymentStatus = async (orderId: string) => {
        try {
            const response = await fetch('/api/check-payment-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ orderId }),
            });

            const data = await response.json();

            if (data.success && data.status === 'confirmed') {
                setOrderPlaced(true);
                clearCart();
            }
        } catch (error) {
            console.error('Error checking payment status:', error);
        }
    };

    const handleCloseSnackbar = () => {
        setOpenSnackbar(false);
    };

    const handleCancelOrder = () => {
        setOpenDialog(false);
    };

    const handleNavigateToHome = () => {
        router.push('/');
    };

    // Format price same as cart page
    const formatPrice = (price: number) => {
        if (price === undefined || price === null) {
            return 'Rp0';
        }
        return `Rp${price.toLocaleString('id-ID')}`;
    };

    // Use same calculation methods as cart page
    const getSubtotal = () => {
        return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const getTax = () => {
        return getSubtotal() * 0.11; // 11% tax - match cart page
    };

    const getServiceFee = () => {
        return 2000; // Rp2.000 flat fee - match cart page
    };

    const getGrandTotal = () => {
        return getSubtotal() + getTax() + getServiceFee();
    };

    const translations = {
        id: {
            checkout: "Checkout",
            orderSummary: "Ringkasan Pesanan",
            items: "Barang",
            subtotal: "Subtotal",
            tax: "Pajak (11%)", // Updated to 11%
            serviceFee: "Biaya layanan", // Added service fee
            discount: "Diskon", // Added discount text
            total: "Total",
            personalInfo: "Informasi Pribadi",
            name: "Nama Lengkap",
            phone: "Nomor Telepon",
            address: "Alamat Pengiriman",
            notes: "Catatan Tambahan",
            paymentMethod: "Metode Pembayaran",
            cash: "Tunai",
            creditCard: "Kartu Kredit",
            eWallet: "E-Wallet",
            placeOrder: "Pesan Sekarang",
            loading: "Memuat...",
            orderConfirmation: "Konfirmasi Pesanan",
            confirmOrderMessage: "Konfirmasi pesanan Anda dengan total",
            cancel: "Batal",
            confirm: "Konfirmasi",
            orderSuccess: "Pesanan Berhasil!",
            orderSuccessMessage: "Pesanan Anda telah berhasil ditempatkan.",
            orderNumber: "Nomor Pesanan",
            backToHome: "Kembali ke Beranda",
            formError: "Harap lengkapi semua bidang yang diperlukan",
            orderError: "Terjadi kesalahan saat memproses pesanan Anda",
            nameError: "Nama lengkap diperlukan",
            phoneError: "Nomor telepon tidak valid",
            addressError: "Alamat pengiriman diperlukan",
            noItems: "Tidak ada barang di keranjang",
            goToCart: "Pergi ke Keranjang",
            processingOrder: "Memproses Pesanan...",
            bankTransfer: "Transfer Bank",
            eWallets: "E-Wallet",
            scanQr: "Scan kode QR untuk pembayaran",
            processingPayment: "Memproses Pembayaran...",
            redirecting: "Mengalihkan ke halaman pembayaran...",
            paymentInstructions: "Ikuti instruksi pembayaran",
            bca: "Bank BCA",
            mandiri: "Bank Mandiri",
            bni: "Bank BNI",
            bri: "Bank BRI",
            cimb: "CIMB Niaga",
            permata: "Permata Bank",
            gopay: "GoPay",
            qris: "QRIS",
            orderType: "Tipe Pesanan",
            dineIn: "Makan di Tempat",
            takeAway: "Bawa Pulang",
            estimatedTime: "Estimasi waktu penyajian: 20-30 menit" // Added time estimation
        },
        en: {
            checkout: "Checkout",
            orderSummary: "Order Summary",
            items: "Items",
            subtotal: "Subtotal",
            tax: "Tax (11%)", // Updated to 11%
            serviceFee: "Service Fee", // Added service fee
            discount: "Discount", // Added discount text
            total: "Total",
            personalInfo: "Personal Information",
            name: "Full Name",
            phone: "Phone Number",
            address: "Delivery Address",
            notes: "Additional Notes",
            namePlaceholder: "Enter your full name",
            phonePlaceholder: "Enter your phone number",
            addressPlaceholder: "Enter your delivery address",
            notesPlaceholder: "Additional notes for your order",
            paymentMethod: "Payment Method",
            cash: "Cash",
            creditCard: "Credit Card",
            eWallet: "E-Wallet",
            placeOrder: "Place Order",
            loading: "Loading...",
            orderConfirmation: "Order Confirmation",
            confirmOrderMessage: "Confirm your order with a total of",
            cancel: "Cancel",
            confirm: "Confirm",
            orderSuccess: "Order Successful!",
            orderSuccessMessage: "Your order has been successfully placed.",
            orderNumber: "Order Number",
            backToHome: "Back to Home",
            formError: "Please complete all required fields",
            orderError: "An error occurred while processing your order",
            nameError: "Full name is required",
            phoneError: "Valid phone number is required",
            addressError: "Delivery address is required",
            noItems: "No items in cart",
            goToCart: "Go to Cart",
            processingOrder: "Processing Order...",
            bankTransfer: "Bank Transfer",
            eWallets: "E-Wallets",
            scanQr: "Scan QR code for payment",
            processingPayment: "Processing Payment...",
            redirecting: "Redirecting to payment page...",
            paymentInstructions: "Follow payment instructions",
            bca: "BCA Bank",
            mandiri: "Mandiri Bank",
            bni: "BNI Bank",
            bri: "BRI Bank",
            cimb: "CIMB Niaga",
            permata: "Permata Bank",
            gopay: "GoPay",
            qris: "QRIS",
            orderType: "Order Type",
            dineIn: "Dine-in",
            takeAway: "Take-away",
            estimatedTime: "Estimated serving time: 20-30 minutes" // Added time estimation
        }
    };

    const t = translations[language as keyof typeof translations] || translations.id;

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>{t.loading}</Typography>
            </Box>
        );
    }

    if (cartItems.length === 0 && !orderPlaced) {
        return (
            <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh' }}>
                {/* Header */}
                <Box sx={{ bgcolor: 'white', p: 2, position: 'sticky', top: 0, zIndex: 10 }}>
                    <Container maxWidth="sm">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <IconButton onClick={handleGoBack} sx={{ mr: 2 }}>
                                <ArrowBackIcon />
                            </IconButton>
                            <Typography variant="h6" fontWeight="bold">
                                {t.checkout}
                            </Typography>
                        </Box>
                    </Container>
                </Box>

                <Container maxWidth="sm" sx={{ py: 4 }}>
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                        <Box sx={{ mb: 3, width: 120, height: 120, mx: 'auto', position: 'relative' }}>
                            <Image
                                src="/images/cart/empty-cart.png"
                                alt="Empty cart"
                                fill
                                style={{ objectFit: 'contain' }}
                            />
                        </Box>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                            {t.noItems}
                        </Typography>
                        <Button
                            variant="contained"
                            onClick={() => router.push('/cart')}
                            sx={{
                                mt: 2,
                                bgcolor: '#bc5a3c', // Match cart page styling
                                '&:hover': {
                                    bgcolor: '#a04e34', // Match cart page styling
                                },
                                borderRadius: 3, // Match cart page styling
                                px: 3,
                                py: 1
                            }}
                        >
                            {t.goToCart}
                        </Button>
                    </Box>
                </Container>
            </Box>
        );
    }

    if (orderPlaced) {
        return (
            <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh' }}>
                <Container maxWidth="sm" sx={{ py: 6 }}>
                    <Paper
                        elevation={0}
                        sx={{
                            borderRadius: 3, // Match cart page styling
                            overflow: 'hidden',
                            p: 4,
                            textAlign: 'center',
                        }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                            <CheckCircleOutlineIcon sx={{ fontSize: 80, color: '#4CAF50' }} />
                        </Box>
                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                            {t.orderSuccess}
                        </Typography>
                        <Typography variant="body1" color="text.secondary" gutterBottom>
                            {t.orderSuccessMessage}
                        </Typography>

                        <Box sx={{ my: 4, p: 3, bgcolor: '#f8f8f8', borderRadius: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                {t.orderNumber}
                            </Typography>
                            <Typography variant="h6" fontWeight="bold">
                                {orderId}
                            </Typography>
                        </Box>

                        <Button
                            variant="contained"
                            fullWidth
                            onClick={handleNavigateToHome}
                            sx={{
                                mt: 2,
                                bgcolor: '#bc5a3c', // Match cart page styling
                                '&:hover': {
                                    bgcolor: '#a04e34', // Match cart page styling
                                },
                                borderRadius: 3, // Match cart page styling
                                py: 1.5
                            }}
                        >
                            {t.backToHome}
                        </Button>
                    </Paper>
                </Container>
            </Box>
        );
    }

    // Add this component inside your Checkout function
    const PaymentMethodOption = ({
        value,
        selected,
        icon,
        label,
        subtitle
    }: {
        value: string,
        selected: string,
        icon: string,
        label: string,
        subtitle?: string
    }) => (
        <Paper
            elevation={0}
            sx={{
                mb: 2,
                borderRadius: 3, // Match cart page styling
                border: '1px solid',
                borderColor: selected === value ? '#bc5a3c' : '#e0e0e0', // Match cart page styling
                bgcolor: selected === value ? '#FFF8F6' : 'white',
            }}
        >
            <FormControlLabel
                value={value}
                control={
                    <Radio
                        sx={{
                            '&.Mui-checked': {
                                color: '#bc5a3c', // Match cart page styling
                            },
                        }}
                    />
                }
                label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ width: 40, height: 24, position: 'relative', mr: 2 }}>
                            <Image
                                src={icon}
                                alt={label}
                                fill
                                style={{ objectFit: 'contain' }}
                            />
                        </Box>
                        <Box>
                            <Typography>{label}</Typography>
                            {subtitle && (
                                <Typography variant="caption" color="text.secondary">
                                    {subtitle}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                }
                sx={{ py: 1.5, px: 1, width: '100%' }}
            />
        </Paper>
    );

    const updateOrderStatus = async (orderId: string, status: string) => {
        try {
            const response = await fetch('/api/update-order-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ orderId, status }),
            });

            if (!response.ok) {
                throw new Error('Failed to update status');
            }

            console.log(`Order ${orderId} status updated to ${status}`);
        } catch (error) {
            console.error('Error updating order status:', error);
        }
    };

    return (
        <>
            <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', pb: 20, overflow: 'auto' }}>
                {/* Header */}
                <Box sx={{ bgcolor: 'white', p: 2, position: 'sticky', top: 0, zIndex: 10 }}>
                    <Container maxWidth="sm">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <IconButton onClick={handleGoBack} sx={{ mr: 2 }}>
                                <ArrowBackIcon />
                            </IconButton>
                            <Typography variant="h6" fontWeight="bold">
                                {t.checkout}
                            </Typography>
                        </Box>
                    </Container>
                </Box>

                <Container maxWidth="sm" sx={{ py: 2 }}>
                    <Stack spacing={3}>
                        {/* Order Summary */}
                        <Paper
                            elevation={0}
                            sx={{
                                borderRadius: 3, // Match cart page styling
                                overflow: 'hidden',
                                p: 3,
                            }}
                        >
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                {t.orderSummary}
                            </Typography>

                            <Box sx={{ my: 2 }}>
                                <Typography color="text.secondary" gutterBottom>
                                    {cartItems.length} {t.items}
                                </Typography>

                                {/* List of items in cart (collapsed version) */}
                                <Box
                                    sx={{
                                        bgcolor: '#f8f8f8',
                                        borderRadius: 2,
                                        p: 2,
                                        mb: 2
                                    }}
                                >
                                    {cartItems.map((item, index) => (
                                        <Box
                                            key={`${item.id}-${index}`}
                                            sx={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                mb: 1
                                            }}
                                        >
                                            <Typography variant="body2">
                                                {item.quantity} x {item.name}
                                                {item.spicyLevel ? ` (${item.spicyLevel})` : ''}
                                            </Typography>
                                            <Typography variant="body2" fontWeight="medium">
                                                {formatPrice(item.price * item.quantity)}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 1 }}>
                                    <Typography color="text.secondary">{t.subtotal}</Typography>
                                    <Typography>{formatPrice(getSubtotal())}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 1 }}>
                                    <Typography color="text.secondary">{t.tax}</Typography>
                                    <Typography>{formatPrice(getTax())}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 1 }}>
                                    <Typography color="text.secondary">{t.serviceFee}</Typography>
                                    <Typography>{formatPrice(getServiceFee())}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 1 }}>
                                    <Typography color="success.main">{t.discount}</Typography>
                                    <Typography color="success.main">-Rp0</Typography>
                                </Box>
                                <Divider sx={{ my: 2 }} />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 1 }}>
                                    <Typography fontWeight="bold">{t.total}</Typography>
                                    <Typography fontWeight="bold">{formatPrice(getGrandTotal())}</Typography>
                                </Box>
                                {/* Add estimated time */}
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'right', mt: 1 }}>
                                    {t.estimatedTime}
                                </Typography>
                            </Box>
                        </Paper>

                        {/* Order Type */}
                        <Paper
                            elevation={0}
                            sx={{
                                borderRadius: 3, // Match cart page styling
                                overflow: 'hidden',
                                p: 3,
                            }}
                        >
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                {t.orderType}
                            </Typography>

                            <FormControl component="fieldset" sx={{ width: '100%', mt: 2 }}>
                                <RadioGroup
                                    name="orderType"
                                    value={form.address}
                                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                                >
                                    <FormControlLabel
                                        value="Dine-in"
                                        control={<Radio sx={{ '&.Mui-checked': { color: '#bc5a3c' } }} />}
                                        label={t.dineIn}
                                    />

                                    <FormControlLabel
                                        value="Take-away"
                                        control={<Radio sx={{ '&.Mui-checked': { color: '#bc5a3c' } }} />}
                                        label={t.takeAway}
                                    />
                                </RadioGroup>
                            </FormControl>

                            {/* Notes field */}
                            <Box sx={{ mt: 2 }}>
                                <TextField
                                    fullWidth
                                    label={t.notes}
                                    name="notes"
                                    variant="outlined"
                                    margin="normal"
                                    value={form.notes}
                                    onChange={handleChange}
                                    placeholder={t.notesPlaceholder}
                                    multiline
                                    rows={2}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <RestaurantIcon color="action" />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Box>
                        </Paper>

                        {/* Payment Method */}
                        <Paper
                            elevation={0}
                            sx={{
                                borderRadius: 3, // Match cart page styling
                                overflow: 'hidden',
                                p: 3,
                            }}
                        >
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                {t.paymentMethod}
                            </Typography>

                            <FormControl component="fieldset" sx={{ width: '100%', mt: 2 }}>
                                <RadioGroup
                                    name="paymentMethod"
                                    value={form.paymentMethod}
                                    onChange={handleChange}
                                >
                                    {/* Cash Option */}
                                    <PaymentMethodOption
                                        value="cash"
                                        selected={form.paymentMethod}
                                        icon="/images/payment/cash.png"
                                        label={t.cash}
                                    />

                                    {/* Bank Transfer Options */}
                                    <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1, mb: 1.5 }}>
                                        {t.bankTransfer}
                                    </Typography>

                                    {/* BNI */}
                                    <PaymentMethodOption
                                        value="bni"
                                        selected={form.paymentMethod}
                                        icon="/images/payment/bni.png"
                                        label={t.bni}
                                    />

                                    {/* BRI */}
                                    <PaymentMethodOption
                                        value="bri"
                                        selected={form.paymentMethod}
                                        icon="/images/payment/bri.png"
                                        label={t.bri}
                                    />

                                    {/* Mandiri */}
                                    <PaymentMethodOption
                                        value="mandiri"
                                        selected={form.paymentMethod}
                                        icon="/images/payment/mandiri.png"
                                        label={t.mandiri}
                                    />

                                    {/* CIMB Niaga */}
                                    <PaymentMethodOption
                                        value="cimb"
                                        selected={form.paymentMethod}
                                        icon="/images/payment/cimb.png"
                                        label={t.cimb}
                                    />

                                    {/* Permata Bank */}
                                    <PaymentMethodOption
                                        value="permata"
                                        selected={form.paymentMethod}
                                        icon="/images/payment/permata.png"
                                        label={t.permata}
                                    />

                                    {/* E-Wallet Options */}
                                    <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 3, mb: 1.5 }}>
                                        {t.eWallets}
                                    </Typography>

                                    {/* GoPay */}
                                    <PaymentMethodOption
                                        value="gopay"
                                        selected={form.paymentMethod}
                                        icon="/images/payment/gopay.png"
                                        label={t.gopay}
                                    />

                                    {/* QRIS */}
                                    <PaymentMethodOption
                                        value="qris"
                                        selected={form.paymentMethod}
                                        icon="/images/payment/qris.png"
                                        label={t.qris}
                                        subtitle={t.scanQr}
                                    />
                                </RadioGroup>
                            </FormControl>
                        </Paper>
                    </Stack>
                </Container>

                {/* Fixed Checkout Button */}
                <Box sx={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    bgcolor: 'white',
                    p: 2,
                    boxShadow: '0px -2px 10px rgba(0,0,0,0.1)',
                    zIndex: 10 // Tambahkan zIndex
                }}>
                    <Container maxWidth="sm">
                        <Button
                            fullWidth
                            variant="contained"
                            startIcon={<ShoppingBagOutlinedIcon />}
                            onClick={handleSubmit}
                            sx={{
                                py: 1.5,
                                bgcolor: '#bc5a3c', // Match cart page styling
                                '&:hover': {
                                    bgcolor: '#a04e34', // Match cart page styling
                                },
                                borderRadius: 3, // Match cart page styling
                            }}
                        >
                            {t.placeOrder} • {formatPrice(getGrandTotal())}
                        </Button>
                    </Container>
                </Box>

                {/* Order Confirmation Dialog */}
                <Dialog
                    open={openDialog}
                    onClose={handleCancelOrder}
                    PaperProps={{
                        sx: { borderRadius: 3 } // Match cart page styling
                    }}
                >
                    <DialogTitle>{t.orderConfirmation}</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            {t.confirmOrderMessage} {formatPrice(getGrandTotal())}?
                        </DialogContentText>

                        {submitting && (
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                                <CircularProgress size={24} sx={{ mr: 2 }} />
                                <Typography>{t.processingOrder}</Typography>
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button
                            onClick={handleCancelOrder}
                            disabled={submitting}
                            sx={{ color: 'text.secondary' }}
                        >
                            {t.cancel}
                        </Button>
                        <Button
                            onClick={handleConfirmOrder}
                            disabled={submitting}
                            variant="contained"
                            sx={{
                                bgcolor: '#bc5a3c', // Match cart page styling
                                '&:hover': {
                                    bgcolor: '#a04e34', // Match cart page styling
                                },
                            }}
                        >
                            {t.confirm}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Snackbar */}
                <Snackbar
                    open={openSnackbar}
                    autoHideDuration={6000}
                    onClose={handleCloseSnackbar}
                >
                    <Alert
                        onClose={handleCloseSnackbar}
                        severity={snackbarSeverity}
                        sx={{ width: '100%' }}
                    >
                        {snackbarMessage}
                    </Alert>
                </Snackbar>
            </Box>

            {/* Midtrans Snap Script */}
            <Script
                src="https://app.sandbox.midtrans.com/snap/snap.js"
                data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
                onLoad={() => {
                    console.log('Midtrans Snap loaded successfully');
                    setMidtransLoaded(true);
                }}
                onError={() => {
                    console.error('Failed to load Midtrans Snap');
                }}
            />
        </>
    );
}