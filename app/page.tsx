'use client'

import { useState, useEffect } from 'react';
import { getMenuItems } from './lib/firebase/menuService';
import { getActivePromotions, type Promotion } from './lib/firebase/promotionService';
import {
    Box,
    Typography,
    Button,
    InputBase,
    Paper,
    Tabs,
    Tab,
    Card,
    CardMedia,
    CardContent,
    IconButton,
    Badge,
    Container,
    Stack,
    Chip,
    Divider,
    Rating,
    AppBar,
    Toolbar,
    Menu,
    MenuItem,
    Grid,
    CircularProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import TuneIcon from '@mui/icons-material/Tune';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import ClearIcon from '@mui/icons-material/Clear';
import Image from 'next/image';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Head from 'next/head';
import Layout from "../src/components/Layout";
import OnboardingFlow from '../src/components/onboardingflow/onBoardingFlow';
import { useCart } from '../contexts/CartContext';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

// Add this translation object near the top of your component
const translations = {
    id: {
        searchPlaceholder: "Cari hidangan favorit kamu",
        viewAll: "Lihat Semua",
        menu: "Menu",
        all: "Semua",
        food: "Makanan",
        drinks: "Minuman",
        orderNow: "Pesan Sekarang",
        openCart: "Buka Keranjang",
        tableNumber: "Nomor ",
        table: "Meja",
        limitedEdition: "Edisi terbatas Bulan Ramadhan 2025",
        breakfastPackage: "Paket Berbuka",
        tableNumberPrefix: "Nomor",
        noTableDetected: "Tidak ada meja terdeteksi",
        promotions: "Promosi",
    },
    en: {
        searchPlaceholder: "Search your favorite dish",
        viewAll: "View All",
        menu: "Menu",
        all: "All",
        food: "Food",
        drinks: "Beverages",
        orderNow: "Order Now",
        openCart: "Open Cart",
        tableNumber: "Number ",
        table: "Table",
        limitedEdition: "Limited edition for Ramadan 2025",
        breakfastPackage: "Breakfast Package",
        tableNumberPrefix: "Number",
        noTableDetected: "No table detected",
        promotions: "Promotions",
    }
};

// Menu item interface
interface MenuItem {
    id: string;
    name: string;
    description: string;
    image: string;
    price: number;
    rating: number;
    reviews: number;
    category: string;
    // Tambahkan field lain jika diperlukan
}

const CartButton = () => {
    const { cartItems } = useCart();

    // Perbaikan: hitung total quantity, bukan jumlah jenis item
    const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

    return (
        <Badge badgeContent={cartItemCount} color="error">
            <ShoppingCartIcon />
        </Badge>
    );
};

export default function Checkout() {
    const { cartItems, addToCart } = useCart();

    // Semua state declarations
    const [category, setCategory] = useState('semua');
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [language, setLanguage] = useState<string>('id');
    const [searchQuery, setSearchQuery] = useState('');
    const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [promotionsLoading, setPromotionsLoading] = useState(true);
    const [tableNumber, setTableNumber] = useState<string | null>(null);
    const router = useRouter();

    // Semua translations
    const t = translations[language as keyof typeof translations] || translations.id;

    // Semua useEffect
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const hasCompletedOnboarding = localStorage.getItem('onboardingCompleted');
            setOnboardingCompleted(hasCompletedOnboarding === 'true');
        }
    }, []);

    // Add this useEffect to capture table from URL and store in localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            // Get table from URL if present
            const params = new URLSearchParams(window.location.search);
            const tableParam = params.get('table');

            if (tableParam) {
                // Store in localStorage for persistence
                localStorage.setItem('tableNumber', tableParam);
                setTableNumber(tableParam);
            } else {
                // Try to get from localStorage if not in URL
                const savedTable = localStorage.getItem('tableNumber');
                setTableNumber(savedTable);
            }
        }
    }, []);

    // Semua useEffect lainnya harus tetap di sini
    useEffect(() => {
        // Check if we're in the browser before using localStorage
        if (typeof window !== 'undefined') {
            const savedLanguage = localStorage.getItem('preferredLanguage');
            if (savedLanguage) {
                setLanguage(savedLanguage);
            }
        }
    }, []);

    useEffect(() => {
        AOS.init({
            duration: 800,
            once: true,
        });
    }, []);

    // Fetch menu items when component mounts or category/language changes
    useEffect(() => {
        const fetchMenu = async () => {
            setLoading(true);
            try {
                const items = await getMenuItems(category, language);
                setMenuItems(items);
            } catch (error) {
                console.error('Error fetching menu items:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMenu();
    }, [category, language]);

    // Fetch promotions on component mount
    useEffect(() => {
        const fetchPromotions = async () => {
            setPromotionsLoading(true);
            try {
                const promos = await getActivePromotions(language);
                console.log('Promotions fetched:', promos); // Tambahkan ini
                setPromotions(promos);
            } catch (error) {
                console.error('Error fetching promotions:', error);
            } finally {
                setPromotionsLoading(false);
            }
        };

        fetchPromotions();
    }, [language]);

    // Semua handler functions
    const handleOnboardingComplete = () => {
        localStorage.setItem('onboardingCompleted', 'true');
        setOnboardingCompleted(true);
    };

    const handleCategoryChange = (event: React.SyntheticEvent, newValue: string) => {
        setCategory(newValue);
    };

    const handleLanguageMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleCloseLanguageMenu = () => {
        setAnchorEl(null);
    };

    // Update handleLanguageChange to also save to localStorage
    const handleLanguageChange = (lang: string) => {
        setLanguage(lang);
        localStorage.setItem('preferredLanguage', lang);
        handleCloseLanguageMenu();
    };

    const handleAddToCart = async (menuItem: MenuItem) => {
        console.log('Adding item to cart:', menuItem); // Debug log
        try {
            await addToCart(menuItem.id, {
                name: menuItem.name,
                price: menuItem.price,
                image: menuItem.image,
                description: menuItem.description,
            });
            console.log('Successfully added to cart');
        } catch (error) {
            console.error('Error adding to cart:', error);
        }
    };

    const handleOpenCart = () => {
        router.push('/cart');
    };

    const formatPrice = (price: number) => {
        return `Rp${price.toLocaleString('id-ID')}`;
    };

    // Add search handler
    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(event.target.value);
    };

    // Handler for promo clicks
    const handlePromoClick = (actionLink: string) => {
        router.push(actionLink);
    };

    // Filter menu items based on search query
    const filteredItems = menuItems.filter(item => {
        if (!searchQuery.trim()) return true; // Return all items if search is empty

        // Search in name and description (case insensitive)
        const query = searchQuery.toLowerCase();
        return (
            item.name.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query)
        );
    });

    // RENDERNYA DISINILAH:
    // PENTING: Return with conditional rendering, BUKAN early return
    return (
        <>
            {onboardingCompleted === null ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                    <CircularProgress />
                </Box>
            ) : !onboardingCompleted ? (
                <OnboardingFlow
                    onComplete={handleOnboardingComplete}
                    tableNumber={tableNumber} // Pass table number to onboarding
                />
            ) : (
                // Main content - semuanya dibungkus dalam conditional rendering
                <>
                    <Head>
                        <title>Warung Desa</title>
                        <meta name="description" content="Warung Desa - Makanan & Minuman" />
                    </Head>

                    <Box sx={{ pb: 8, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
                        {/* Custom App Bar */}
                        <AppBar position="static" color="default" elevation={0} sx={{ bgcolor: 'white', px: 2, py: 1 }}>
                            <Stack spacing={1}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body2" color="text.secondary">
                                        {t.table}
                                    </Typography>
                                    <Box
                                        onClick={handleLanguageMenu}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            cursor: 'pointer',
                                            bgcolor: '#f8f8f8',
                                            px: 2,
                                            py: 0.5,
                                            borderRadius: 2
                                        }}
                                    >
                                        <Typography variant="body2">
                                            {language === 'id' ? 'Indonesia' : 'English'}
                                        </Typography>
                                        <KeyboardArrowDownIcon fontSize="small" />
                                    </Box>
                                    <Menu
                                        anchorEl={anchorEl}
                                        open={Boolean(anchorEl)}
                                        onClose={handleCloseLanguageMenu}
                                    >
                                        <MenuItem onClick={() => handleLanguageChange('id')}>Indonesia</MenuItem>
                                        <MenuItem onClick={() => handleLanguageChange('en')}>English</MenuItem>
                                    </Menu>
                                </Box>

                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <LocationOnIcon color="error" />
                                    <Typography variant="h6" component="div" sx={{ fontWeight: 'bold', ml: 0.5 }}>
                                        {tableNumber ?
                                            language === 'id' ?
                                                `Nomor ${tableNumber}` :
                                                `Number ${tableNumber}`
                                            :
                                            t.tableNumber // Fallback to default if no table detected
                                        }
                                    </Typography>
                                </Box>

                                {/* Search Bar */}
                                <Paper
                                    component="form"
                                    sx={{
                                        p: '2px 8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        borderRadius: 3,
                                        bgcolor: '#f8f8f8',
                                        my: 1
                                    }}
                                    elevation={0}
                                    data-aos="fade-up"
                                    onSubmit={(e) => e.preventDefault()} // Prevent form submission
                                >
                                    <SearchIcon sx={{ color: 'text.secondary' }} />
                                    <InputBase
                                        sx={{ ml: 1, flex: 1 }}
                                        placeholder={t.searchPlaceholder}
                                        inputProps={{ 'aria-label': 'search' }}
                                        value={searchQuery}
                                        onChange={handleSearchChange}
                                    />
                                    {searchQuery && (
                                        <IconButton
                                            size="small"
                                            onClick={() => setSearchQuery('')}
                                            aria-label="clear search"
                                        >
                                            <ClearIcon fontSize="small" />
                                        </IconButton>
                                    )}
                                    <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
                                    <IconButton type="button" aria-label="filter">
                                        <TuneIcon />
                                        {/* Ini harus ditambahkan logika tune searchnya */}
                                    </IconButton>
                                </Paper>
                            </Stack>
                        </AppBar>

                        {/* Add this component somewhere visible if needed */}
                        {!tableNumber && (
                            <Paper
                                elevation={3}
                                sx={{
                                    p: 2,
                                    mb: 2,
                                    bgcolor: '#fff9c4',
                                    borderRadius: 2
                                }}
                            >
                                <Typography color="warning.dark">
                                    {language === 'id' ?
                                        'Meja tidak terdeteksi. Silakan scan QR code meja Anda.' :
                                        'Table not detected. Please scan your table QR code.'}
                                </Typography>
                            </Paper>
                        )}

                        {/* Main Content Area */}
                        <Container maxWidth="sm" sx={{ pt: 2 }}>
                            {/* Promo Banners */}
                            {promotionsLoading ? (
                                // Show loading skeleton for promo
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2,
                                        borderRadius: 4,
                                        bgcolor: '#f8f8f8',
                                        height: 180,
                                        mb: 3,
                                        display: 'flex'
                                    }}
                                    data-aos="fade-up"
                                >
                                    <Box sx={{ width: '60%' }}>
                                        <Box sx={{ bgcolor: '#eaeaea', height: 32, width: '80%', mb: 1, borderRadius: 1 }} />
                                        <Box sx={{ bgcolor: '#eaeaea', height: 16, width: '90%', mb: 2, borderRadius: 1 }} />
                                        <Box sx={{ bgcolor: '#eaeaea', height: 40, width: 120, borderRadius: 5 }} />
                                    </Box>
                                </Paper>
                            ) : promotions.length > 0 ? (
                                // Show the first promotion banner
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 3,
                                        borderRadius: 4,
                                        overflow: 'hidden',
                                        position: 'relative',
                                        mb: 3,
                                        backgroundImage: 'linear-gradient(to right, rgba(250,250,250,0.95), rgba(250,250,250,0.85))',
                                        display: 'flex',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        height: 180, // Fixed height for consistency
                                    }}
                                    onClick={() => handlePromoClick(promotions[0].actionLink)}
                                    data-aos="fade-up"
                                >
                                    <Box sx={{ zIndex: 1, width: '55%', pr: 2 }}>
                                        <Typography variant="h5" component="h2" fontWeight="bold" color="text.primary">
                                            {promotions[0].translations?.[language]?.title || promotions[0].translations?.id?.title || "Promo Special"}
                                        </Typography>
                                        <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
                                            {promotions[0].translations?.[language]?.description || promotions[0].translations?.id?.description || "Limited time offer"}
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handlePromoClick(promotions[0].actionLink);
                                            }}
                                            sx={{
                                                borderRadius: 5,
                                                bgcolor: '#bc5a3c',
                                                '&:hover': {
                                                    bgcolor: '#a04e34',
                                                },
                                            }}
                                        >
                                            {t.orderNow}
                                        </Button>
                                    </Box>
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            right: -10,
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            width: '45%',
                                            height: 160,
                                            borderRadius: 4,
                                        }}
                                    >
                                        <Image
                                            src={promotions[0].image || '/fallback-promo-image.jpg'}
                                            alt={promotions[0].translations?.[language]?.title || 'Promotion'}
                                            fill
                                            style={{
                                                objectFit: 'contain',
                                                objectPosition: 'right center'
                                            }}
                                            priority
                                        />
                                    </Box>
                                </Paper>
                            ) : null}

                            {/* Category Header 
                            <Button color="primary" size="small">
                                    {t.viewAll}
                                </Button>
                                */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="h6" component="h2" fontWeight="bold">
                                    {t.menu}
                                </Typography>
                            </Box>

                            {/* Category Tabs */}
                            <Box sx={{ mb: 3 }} data-aos="fade-up">
                                <Tabs
                                    value={category}
                                    onChange={handleCategoryChange}
                                    variant="fullWidth"
                                    sx={{
                                        '.MuiTabs-indicator': {
                                            backgroundColor: '#bc5a3c',
                                        },
                                        '.Mui-selected': {
                                            color: '#bc5a3c !important',
                                            fontWeight: 'bold',
                                        },
                                    }}
                                >
                                    <Tab
                                        label={t.all}
                                        value="semua"
                                        sx={{
                                            textTransform: 'none',
                                            bgcolor: category === 'semua' ? '#f8e4de' : 'transparent',
                                            borderRadius: 4,
                                            mr: 1,
                                        }}
                                    />
                                    <Tab
                                        label={t.food}
                                        value="makanan"
                                        sx={{
                                            textTransform: 'none',
                                            bgcolor: category === 'makanan' ? '#f8e4de' : 'transparent',
                                            borderRadius: 4,
                                            mx: 1,
                                        }}
                                    />
                                    <Tab
                                        label={t.drinks}
                                        value="minuman"
                                        sx={{
                                            textTransform: 'none',
                                            bgcolor: category === 'minuman' ? '#f8e4de' : 'transparent',
                                            borderRadius: 4,
                                            ml: 1,
                                        }}
                                    />
                                </Tabs>
                            </Box>

                            {/* Menu Items */}
                            <Stack spacing={2}>
                                {loading ? (
                                    // Show loading skeleton
                                    Array.from(new Array(4)).map((_, index) => (
                                        <Card
                                            key={`skeleton-${index}`}
                                            elevation={0}
                                            sx={{
                                                borderRadius: 4,
                                                display: 'flex',
                                                overflow: 'hidden',
                                                bgcolor: 'white',
                                                height: 120,
                                            }}
                                        >
                                            <Box sx={{ width: 120, bgcolor: '#f0f0f0' }} />
                                            <Box sx={{ p: 2, width: '100%' }}>
                                                <Box sx={{ bgcolor: '#f0f0f0', height: 24, width: '70%', mb: 1, borderRadius: 1 }} />
                                                <Box sx={{ bgcolor: '#f0f0f0', height: 16, width: '90%', mb: 1, borderRadius: 1 }} />
                                                <Box sx={{ bgcolor: '#f0f0f0', height: 16, width: '40%', borderRadius: 1 }} />
                                            </Box>
                                        </Card>
                                    ))
                                ) : filteredItems.length > 0 ? (
                                    filteredItems.map((item, index) => (
                                        <Card
                                            key={item.id}
                                            elevation={0}
                                            sx={{
                                                borderRadius: 4,
                                                display: 'flex',
                                                overflow: 'hidden',
                                                bgcolor: 'white',
                                                position: 'relative',
                                                height: 120,
                                            }}
                                            data-aos="fade-up"
                                            data-aos-delay={index * 100}
                                            onClick={() => router.push(`/menu/${item.id}`)}
                                        >
                                            {/* Container gambar dengan border radius yang benar */}
                                            <Box sx={{
                                                width: 120,
                                                minWidth: 120,
                                                height: 120,
                                                flexShrink: 0,
                                                position: 'relative',
                                                borderTopLeftRadius: 16, // Tambahan: border radius di kiri atas
                                                borderBottomLeftRadius: 16, // Tambahan: border radius di kiri bawah
                                                overflow: 'hidden' // Tambahan: memastikan gambar mengikuti radius
                                            }}>
                                                <Image
                                                    src={item.image}
                                                    alt={item.name}
                                                    fill
                                                    style={{
                                                        objectFit: 'cover'
                                                    }}
                                                />
                                            </Box>

                                            {/* Box untuk konten - tidak perlu diubah */}
                                            <Box sx={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                flexGrow: 1,
                                                width: 'calc(100% - 120px)',
                                                p: 2,
                                                overflow: 'hidden',
                                            }}>
                                                <Typography variant="subtitle1" component="h3" fontWeight="bold" noWrap>
                                                    {item.name}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }} noWrap>
                                                    {item.description}
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <Rating
                                                        value={item.rating}
                                                        precision={0.1}
                                                        readOnly
                                                        size="small"
                                                    />
                                                    <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                                                        ({item.reviews})
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 'auto' }}>
                                                    <Typography variant="subtitle1" fontWeight="bold">
                                                        {formatPrice(item.price)}
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            <IconButton
                                                sx={{
                                                    position: 'absolute',
                                                    bottom: 12,
                                                    right: 12,
                                                    bgcolor: '#000',
                                                    color: '#fff',
                                                    '&:hover': {
                                                        bgcolor: '#333',
                                                    },
                                                    width: 28,
                                                    height: 28,
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleAddToCart(item); // Kirim item lengkap, bukan hanya ID
                                                }}
                                            >
                                                <AddIcon fontSize="small" />
                                            </IconButton>
                                        </Card>
                                    ))
                                ) : (
                                    // No results message
                                    <Box sx={{ textAlign: 'center', py: 4 }}>
                                        <Typography variant="body1" color="text.secondary">
                                            {language === 'id' ? 'Menu tidak ditemukan' : 'No menu items found'}
                                        </Typography>
                                        <Button
                                            variant="text"
                                            color="primary"
                                            onClick={() => setSearchQuery('')}
                                            sx={{ mt: 1 }}
                                        >
                                            {language === 'id' ? 'Hapus pencarian' : 'Clear search'}
                                        </Button>
                                    </Box>
                                )}
                            </Stack>
                        </Container>

                        {/* Fixed Cart Button */}
                        <Paper
                            sx={{
                                position: 'fixed',
                                bottom: 16,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: 'calc(100% - 32px)',
                                maxWidth: 'sm',
                                borderRadius: 10,
                                overflow: 'hidden',
                                zIndex: 5,
                            }}
                            elevation={3}
                        >
                            <Button
                                fullWidth
                                variant="contained"
                                startIcon={<ShoppingBagOutlinedIcon />}
                                onClick={handleOpenCart}
                                sx={{
                                    py: 1.5,
                                    bgcolor: '#bc5a3c',
                                    '&:hover': {
                                        bgcolor: '#a04e34',
                                    },
                                    borderRadius: 10,
                                }}
                            >
                                {t.openCart}
                                {cartItems.length > 0 && (
                                    <Badge
                                        color="error"
                                        badgeContent={cartItems.reduce((total, item) => total + item.quantity, 0)} // PERBAIKAN
                                        sx={{ ml: 2 }}
                                    />
                                )}
                            </Button>
                        </Paper>
                    </Box>
                </>
            )}
        </>
    );
}