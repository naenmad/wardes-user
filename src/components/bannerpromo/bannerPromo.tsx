'use client'

import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Container,
    Card,
    CardContent,
    CardMedia,
    Button,
    Grid,
    IconButton,
    Stack,
    Skeleton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter } from 'next/navigation';
import { getActivePromotions, Promotion } from '../../firebase/promotionService'; // Fixed path

// Renamed component to match filename
export default function BannerPromo() {
    const [promotions, setPromotions] = useState<Promotion[]>([]);
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
        const fetchPromotions = async () => {
            setLoading(true);
            try {
                const promos = await getActivePromotions(language);
                setPromotions(promos);
            } catch (error) {
                console.error('Error fetching promotions:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPromotions();
    }, [language]);

    const handleGoBack = () => {
        router.back();
    };

    const handlePromoClick = (actionLink: string) => {
        router.push(actionLink);
    };

    const translations = {
        id: {
            title: "Promo Spesial",
            subtitle: "Nikmati berbagai penawaran spesial dari kami",
            empty: "Tidak ada promo saat ini",
            back: "Kembali"
        },
        en: {
            title: "Special Promotions",
            subtitle: "Enjoy our special offers",
            empty: "No promotions available",
            back: "Back"
        }
    };

    const t = translations[language as keyof typeof translations] || translations.id;

    return (
        <Box sx={{ bgcolor: 'background.paper', minHeight: '100vh', pb: 4 }}>
            {/* Header */}
            <Box sx={{ bgcolor: 'white', py: 2, position: 'sticky', top: 0, zIndex: 10 }}>
                <Container maxWidth="sm">
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <IconButton onClick={handleGoBack} edge="start">
                            <ArrowBackIcon />
                        </IconButton>
                        <Typography variant="h6" component="h1" sx={{ fontWeight: 'bold' }}>
                            {t.title}
                        </Typography>
                    </Stack>
                </Container>
            </Box>

            <Container maxWidth="sm" sx={{ mt: 3 }}>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    {t.subtitle}
                </Typography>

                {loading ? (
                    // Loading skeletons
                    <Grid container spacing={2}>
                        {[1, 2, 3].map((item) => (
                            <Grid item xs={12} key={item}>
                                <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
                                    <Skeleton variant="rectangular" height={180} />
                                    <CardContent>
                                        <Skeleton variant="text" width="80%" height={32} />
                                        <Skeleton variant="text" width="90%" />
                                        <Box sx={{ mt: 2 }}>
                                            <Skeleton variant="rectangular" width={120} height={36} sx={{ borderRadius: 5 }} />
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                ) : promotions.length > 0 ? (
                    <Grid container spacing={2}>
                        {promotions.map((promo) => (
                            <Grid item xs={12} key={promo.id}>
                                <Card
                                    sx={{
                                        borderRadius: 3,
                                        overflow: 'hidden',
                                        cursor: 'pointer',
                                        '&:hover': { boxShadow: 3 }
                                    }}
                                    onClick={() => handlePromoClick(promo.actionLink)}
                                >
                                    <CardMedia
                                        component="img"
                                        height="180"
                                        image={promo.image}
                                        alt={promo.title}
                                    />
                                    <CardContent>
                                        <Typography variant="h6" component="h2" fontWeight="bold">
                                            {promo.title}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            {promo.description}
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handlePromoClick(promo.actionLink);
                                            }}
                                            sx={{
                                                borderRadius: 5,
                                                bgcolor: '#bc5a3c',
                                                '&:hover': {
                                                    bgcolor: '#a04e34',
                                                },
                                            }}
                                        >
                                            {language === 'id' ? 'Lihat Menu' : 'View Menu'}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                ) : (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                        <Typography variant="body1" color="text.secondary">
                            {t.empty}
                        </Typography>
                    </Box>
                )}
            </Container>
        </Box>
    );
}