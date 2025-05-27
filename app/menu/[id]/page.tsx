'use client'

import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Container,
    IconButton,
    Button,
    CircularProgress,
    RadioGroup,
    FormControlLabel,
    Radio,
    Divider,
    Rating,
    Snackbar,
    Alert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { getMenuItem } from '../../../lib/firebase/menuService';
import { useCart } from '../../../contexts/CartContext'; // Impor useCart

export default function MenuDetail() {
    const router = useRouter();
    const params = useParams();
    const menuId = params.id as string;
    const { addToCart: addItemToCartContext } = useCart(); // Dapatkan fungsi addToCart dari context

    const [loading, setLoading] = useState(true);
    const [menuItem, setMenuItem] = useState<any>(null); // Pertimbangkan untuk menggunakan tipe MenuItem yang lebih spesifik
    const [quantity, setQuantity] = useState(1);
    const [language, setLanguage] = useState('id');
    const [spicyLevel, setSpicyLevel] = useState('not-spicy'); // Default untuk makanan
    const [iceLevel, setIceLevel] = useState('normal');     // Default untuk minuman
    const [showFullDescription, setShowFullDescription] = useState(false);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');


    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedLanguage = localStorage.getItem('preferredLanguage') || 'id';
            setLanguage(savedLanguage);
        }
    }, []);

    useEffect(() => {
        const fetchMenuItem = async () => {
            setLoading(true);
            try {
                const item = await getMenuItem(menuId, language);
                console.log("Fetched menu item:", item);
                setMenuItem(item);
            } catch (error) {
                console.error('Error fetching menu item:', error);
            } finally {
                setLoading(false);
            }
        };

        if (menuId) {
            fetchMenuItem();
        }
    }, [menuId, language]);


    const handleGoBack = () => {
        router.back();
    };

    const handleQuantityChange = (newQuantity: number) => {
        if (newQuantity >= 1) {
            setQuantity(newQuantity);
        }
    };

    const handleAddToCart = () => {
        if (!menuItem) return;

        const categoryString = menuItem.category?.toLowerCase();
        const isDrink = categoryString?.includes('drink') || categoryString?.includes('minuman');
        const isFood = !isDrink;

        const itemToAdd = {
            id: menuItem.id,
            name: menuItem.translations?.[language]?.name || menuItem.translations?.id?.name || menuItem.name,
            price: menuItem.price,
            image: menuItem.image,
            quantity: quantity,
            ...(isFood && { spicyLevel: spicyLevel }), // Tambahkan spicyLevel jika makanan
            ...(isDrink && { iceLevel: iceLevel }),   // Tambahkan iceLevel jika minuman
        };

        addItemToCartContext(itemToAdd)
            .then(() => {
                setSnackbarMessage(t.addedToCart);
                setOpenSnackbar(true);
                setQuantity(1); // Reset kuantitas setelah berhasil ditambahkan
            })
            .catch(error => {
                console.error("Failed to add item to cart via context", error);
                setSnackbarMessage("Gagal menambahkan item ke keranjang."); // Pesan error generik
                setOpenSnackbar(true);
            });
    };

    const handleCloseSnackbar = () => {
        setOpenSnackbar(false);
    };

    const translations = {
        id: {
            ingredients: "Bahan-bahan",
            spicyLevel: "Level Pedas",
            iceLevel: "Level Es",
            notSpicy: "Tidak Pedas",
            medium: "Sedang",
            spicy: "Pedas",
            lessIce: "Sedikit Es",
            normalIce: "Normal",
            extraIce: "Ekstra Es",
            totalPrice: "Total Harga",
            addToCart: "Tambah ke Keranjang",
            seeMore: "Lihat Selengkapnya",
            seeLess: "Lihat Lebih Sedikit",
            loading: "Memuat...",
            addedToCart: "Berhasil ditambahkan ke keranjang"
        },
        en: {
            ingredients: "Ingredients",
            spicyLevel: "Spicy Level",
            iceLevel: "Ice Level",
            notSpicy: "Not Spicy",
            medium: "Medium",
            spicy: "Spicy",
            lessIce: "Less Ice",
            normalIce: "Normal",
            extraIce: "Extra Ice",
            totalPrice: "Total Price",
            addToCart: "Add To Cart",
            seeMore: "See More",
            seeLess: "See Less",
            loading: "Loading...",
            addedToCart: "Successfully added to cart"
        }
    };

    const t = translations[language as keyof typeof translations] || translations.id;

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>{t.loading}</Typography>
            </Box>
        );
    }

    if (!menuItem) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Typography>Menu tidak ditemukan.</Typography> {/* Pesan lebih baik */}
            </Box>
        );
    }

    const totalPrice = menuItem.price * quantity;
    const categoryStringForRender = menuItem.category?.toLowerCase();
    const isDrinkForRender = categoryStringForRender?.includes('drink') || categoryStringForRender?.includes('minuman');
    const isFoodForRender = !isDrinkForRender;

    return (
        <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', pb: 10 }}>
            <Box sx={{ position: 'relative', width: '100%', height: 300 }}>
                <IconButton
                    sx={{
                        position: 'absolute',
                        top: 16,
                        left: 16,
                        bgcolor: 'white',
                        zIndex: 2,
                        boxShadow: 1
                    }}
                    onClick={handleGoBack}
                >
                    <ArrowBackIcon />
                </IconButton>
                <Image
                    src={menuItem.image}
                    alt={menuItem.name}
                    fill
                    style={{ objectFit: 'cover' }}
                    priority
                />

                <Box sx={{
                    position: 'absolute',
                    bottom: 16,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    bgcolor: 'rgba(186, 104, 78, 0.9)',
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    px: 2,
                    py: 1,
                    color: 'white'
                }}>
                    <IconButton
                        size="small"
                        onClick={() => handleQuantityChange(quantity - 1)}
                        sx={{ color: 'white' }}
                    >
                        <RemoveIcon />
                    </IconButton>
                    <Typography sx={{ mx: 3, fontWeight: 'bold', width: 30, textAlign: 'center' }}>
                        {quantity.toString().padStart(2, '0')}
                    </Typography>
                    <IconButton
                        size="small"
                        onClick={() => handleQuantityChange(quantity + 1)}
                        sx={{ color: 'white' }}
                    >
                        <AddIcon />
                    </IconButton>
                </Box>
            </Box>

            <Container maxWidth="sm" sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h4" component="h1" fontWeight="bold">
                        {menuItem.translations?.[language]?.name || menuItem.translations?.id?.name || 'Menu Item'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ mr: 0.5 }}>
                            {menuItem.rating?.toFixed(1) || '5.0'}
                        </Typography>
                        <Rating
                            value={1}
                            max={1}
                            readOnly
                            size="small"
                        />
                        {menuItem.reviews && (
                            <Typography variant="body2" sx={{ ml: 0.5, color: 'text.secondary' }}>
                                ({menuItem.reviews})
                            </Typography>
                        )}
                    </Box>
                </Box>

                <Box sx={{ my: 2 }}>
                    <Typography color="text.secondary">
                        {showFullDescription
                            ? (menuItem.translations?.[language]?.description || menuItem.translations?.id?.description || 'No description available')
                            : `${(menuItem.translations?.[language]?.description || menuItem.translations?.id?.description || 'No description available').substring(0, 100)}${(menuItem.translations?.[language]?.description || '').length > 100 ? '...' : ''}`}
                        {(menuItem.translations?.[language]?.description || '').length > 100 && (
                            <Button
                                sx={{ ml: 1, p: 0, minWidth: 'auto', textTransform: 'none', color: '#BA684E' }}
                                onClick={() => setShowFullDescription(!showFullDescription)}
                            >
                                {showFullDescription ? t.seeLess : t.seeMore}
                            </Button>
                        )}
                    </Typography>
                </Box>

                {/* Conditional rendering berdasarkan isFood yang sudah diperbaiki */}
                {isFoodForRender && (
                    <Box sx={{ my: 4 }}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                            {t.spicyLevel}
                        </Typography>
                        <RadioGroup
                            value={spicyLevel}
                            onChange={(e) => setSpicyLevel(e.target.value)}
                            row
                        >
                            <FormControlLabel
                                value="not-spicy"
                                control={<Radio sx={{
                                    color: '#BA684E',
                                    '&.Mui-checked': {
                                        color: '#BA684E',
                                    },
                                }} />}
                                label={t.notSpicy}
                            />
                            <FormControlLabel
                                value="medium"
                                control={<Radio sx={{
                                    color: '#BA684E',
                                    '&.Mui-checked': {
                                        color: '#BA684E',
                                    },
                                }} />}
                                label={t.medium}
                            />
                            <FormControlLabel
                                value="spicy"
                                control={<Radio sx={{
                                    color: '#BA684E',
                                    '&.Mui-checked': {
                                        color: '#BA684E',
                                    },
                                }} />}
                                label={t.spicy}
                            />
                        </RadioGroup>
                    </Box>
                )}

                {/* Jika bukan makanan (artinya minuman), tampilkan level es */}
                {!isFoodForRender && (
                    <Box sx={{ my: 4 }}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                            {t.iceLevel}
                        </Typography>
                        <RadioGroup
                            value={iceLevel}
                            onChange={(e) => setIceLevel(e.target.value)}
                            row
                        >
                            <FormControlLabel
                                value="less"
                                control={<Radio sx={{
                                    color: '#BA684E',
                                    '&.Mui-checked': {
                                        color: '#BA684E',
                                    },
                                }} />}
                                label={t.lessIce}
                            />
                            <FormControlLabel
                                value="normal"
                                control={<Radio sx={{
                                    color: '#BA684E',
                                    '&.Mui-checked': {
                                        color: '#BA684E',
                                    },
                                }} />}
                                label={t.normalIce}
                            />
                            <FormControlLabel
                                value="extra"
                                control={<Radio sx={{
                                    color: '#BA684E',
                                    '&.Mui-checked': {
                                        color: '#BA684E',
                                    },
                                }} />}
                                label={t.extraIce}
                            />
                        </RadioGroup>
                    </Box>
                )}

                <Box sx={{ my: 4 }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                        {t.ingredients}
                    </Typography>
                    <Typography color="text.secondary">
                        {menuItem.ingredients?.join(', ') || 'Nasi, Ayam, Selada, Tomat, Timun, Saus'}
                    </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    bgcolor: 'white',
                    p: 2,
                    boxShadow: '0px -2px 10px rgba(0,0,0,0.1)'
                }}>
                    <Container maxWidth="sm">
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    {t.totalPrice}
                                </Typography>
                                <Typography variant="h5" fontWeight="bold">
                                    Rp{totalPrice.toLocaleString('id-ID')}
                                </Typography>
                            </Box>
                            <Button
                                variant="contained"
                                startIcon={<ShoppingBagOutlinedIcon />}
                                onClick={handleAddToCart}
                                sx={{
                                    bgcolor: '#BA684E',
                                    '&:hover': {
                                        bgcolor: '#9D5841',
                                    },
                                    borderRadius: 10,
                                    px: 3,
                                    py: 1.5
                                }}
                            >
                                {t.addToCart}
                            </Button>
                        </Box>
                    </Container>
                </Box>
            </Container>

            <Snackbar
                open={openSnackbar}
                autoHideDuration={2000} // Durasi bisa disesuaikan
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbarMessage === t.addedToCart ? "success" : "error"} // Dinamis berdasarkan pesan
                    variant="filled"
                    sx={{
                        width: '100%',
                        bgcolor: snackbarMessage === t.addedToCart ? '#BA684E' : undefined, // Warna success atau default error
                        color: 'white', // Pastikan kontras baik jika error
                        '& .MuiAlert-icon': {
                            color: 'white' // Pastikan kontras baik jika error
                        }
                    }}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
}