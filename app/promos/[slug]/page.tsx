'use client'

import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Container,
    Card,
    CardContent,
    Button,
    IconButton,
    Stack,
    CircularProgress,
    Grid
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { getMenuItemsByIds, MenuItem } from '../../../lib/firebase/menuService';
import { getPromotion, Promotion } from '../../../lib/firebase/promotionService';

export default function PromoDetail() {
    const params = useParams();
    const slug = params.slug as string;
    const [promo, setPromo] = useState<Promotion | null>(null);
    const [promoItems, setPromoItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [language, setLanguage] = useState<string>('id');
    const router = useRouter();

    useEffect(() => {
        // Get language from localStorage
        if (typeof window !== 'undefined') {
            const savedLanguage = localStorage.getItem('preferredLanguage');
            if (savedLanguage) {
                setLanguage(savedLanguage);
            }
        }
    }, []);

    useEffect(() => {
        const fetchPromoData = async () => {
            if (!slug) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                // Fetch the promotion details
                const promoData = await getPromotion(slug, language);
                setPromo(promoData);

                if (promoData && promoData.menuItemIds && promoData.menuItemIds.length > 0) {
                    // Get specific menu items by menuItemIds from the promotion
                    const items = await getMenuItemsByIds(promoData.menuItemIds, language);
                    setPromoItems(items);
                } else {
                    setPromoItems([]);
                }
            } catch (error) {
                console.error('Error fetching promo data:', error);
                setPromo(null);
                setPromoItems([]);
            } finally {
                setLoading(false);
            }
        };

        if (language) {
            fetchPromoData();
        }
    }, [slug, language]);

    const handleGoBack = () => {
        router.back();
    };

    const translations = {
        id: {
            back: "Kembali",
            loading: "Memuat...",
            notFound: "Promo tidak ditemukan",
            promoItems: "Menu Dalam Promo Ini"
        },
        en: {
            back: "Back",
            loading: "Loading...",
            notFound: "Promotion not found",
            promoItems: "Menu Items In This Promo"
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

    if (!promo) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Typography>{t.notFound}</Typography>
            </Box>
        );
    }

    return (
        <>
            <Box sx={{ bgcolor: 'background.paper', minHeight: '100vh', pb: 4 }}>
                {/* Header */}
                <Box sx={{ bgcolor: 'white', py: 2, position: 'sticky', top: 0, zIndex: 10 }}>
                    <Container maxWidth="sm">
                        <Stack direction="row" alignItems="center" spacing={2}>
                            <IconButton onClick={handleGoBack} edge="start">
                                <ArrowBackIcon />
                            </IconButton>
                            <Typography variant="h6" component="h1" sx={{ fontWeight: 'bold' }}>
                                {promo.translations?.[language]?.title || promo.translations?.id?.title || "Detail Promosi"}
                            </Typography>
                        </Stack>
                    </Container>
                </Box>

                <Container maxWidth="sm" sx={{ mt: 3 }}>
                    {/* Promo Image */}
                    <Box sx={{ position: 'relative', height: 200, mb: 3, borderRadius: 3, overflow: 'hidden' }}>
                        <Image
                            src={promo.image || "/placeholder-image.png"}
                            alt={promo.translations?.[language]?.title || promo.translations?.id?.title || "Gambar Promosi"}
                            fill
                            style={{ objectFit: 'cover' }}
                            priority
                        />
                    </Box>

                    {/* Promo Description */}
                    <Typography variant="h5" component="h1" fontWeight="bold" sx={{ mb: 1 }}>
                        {promo.translations?.[language]?.title || promo.translations?.id?.title}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 4 }}>
                        {promo.translations?.[language]?.description || promo.translations?.id?.description}
                    </Typography>

                    {/* Promo Menu Items */}
                    {promoItems.length > 0 && (
                        <>
                            <Typography variant="h6" component="h2" fontWeight="bold" sx={{ mb: 2 }}>
                                {t.promoItems}
                            </Typography>
                            <Grid container spacing={2}>
                                {promoItems.map((item) => (
                                    <Grid item xs={6} sm={4} md={3} key={item.id}>
                                        <Card sx={{ borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                                            <Box sx={{ position: 'relative', width: '100%', paddingTop: '75%' }}>
                                                <Image
                                                    src={item.image || "/placeholder-menu.png"}
                                                    alt={item.name}
                                                    fill
                                                    style={{ objectFit: 'cover', borderTopLeftRadius: 'inherit', borderTopRightRadius: 'inherit' }}
                                                />
                                            </Box>
                                            <CardContent sx={{ flexGrow: 1, p: 1.5 }}>
                                                <Typography variant="subtitle1" fontWeight="bold" gutterBottom noWrap>
                                                    {item.name}
                                                </Typography>
                                                <Typography variant="subtitle2" fontWeight="bold" color="primary">
                                                    Rp{item.price.toLocaleString('id-ID')}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        </>
                    )}
                </Container>
            </Box>
        </>
    );
}