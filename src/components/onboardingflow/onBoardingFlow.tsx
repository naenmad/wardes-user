import { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Container,
    ButtonGroup,
    useTheme,
    Paper,
    Stack,
    Fade,
    Slide,
    Grow,
    useMediaQuery
} from '@mui/material';
import Image from 'next/image';
import { useSwipeable } from 'react-swipeable';
import { useRouter } from 'next/navigation';

interface OnboardingStep {
    title: string;
    subtitle: string;
    image: string;
    buttonText: string;
}

interface OnboardingFlowProps {
    onComplete?: () => void;
    tableNumber?: string | null;
}

export default function OnboardingFlow({ onComplete, tableNumber }: OnboardingFlowProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [selectedLanguage, setSelectedLanguage] = useState<'id' | 'en'>('id');
    const [animationComplete, setAnimationComplete] = useState(false);
    const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
    const [onboardingCompleted, setOnboardingCompleted] = useState(false);
    const [tableNumberState, setTableNumber] = useState<string | null>(tableNumber || null);
    const router = useRouter();
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
    const isVerySmallScreen = useMediaQuery('(max-height: 600px)');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            // Get table from URL if present - BEFORE the onboarding check
            const params = new URLSearchParams(window.location.search);
            const tableParam = params.get('table');
            
            if (tableParam) {
                console.log("Found table in URL:", tableParam);
                localStorage.setItem('tableNumber', tableParam);
                setTableNumber(tableParam);
            } else {
                const savedTable = localStorage.getItem('tableNumber');
                console.log("Retrieved table from storage:", savedTable);
                setTableNumber(savedTable);
            }
        }
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const hasCompletedOnboarding = localStorage.getItem('onboardingCompleted');
            setOnboardingCompleted(hasCompletedOnboarding === 'true');
        }
    }, []);

    // Add this useEffect to debug tableNumber
    useEffect(() => {
        console.log("OnboardingFlow received tableNumber:", tableNumberState);

        // If tableNumber is null, try getting it from localStorage
        if (!tableNumberState && typeof window !== 'undefined') {
            const savedTable = localStorage.getItem('tableNumber');
            console.log("Retrieved from localStorage:", savedTable);

            // You could potentially add state to track the table number locally
            // or inform the parent component
        }
    }, [tableNumberState]);

    useEffect(() => {
        setAnimationComplete(false);
        setSwipeDirection(null);

        const timer = setTimeout(() => {
            setAnimationComplete(true);
        }, 100);

        return () => clearTimeout(timer);
    }, [currentStep]);

    const steps: OnboardingStep[] = [
        {
            title: selectedLanguage === 'id' ? "Selamat Datang!" : "Welcome!",
            subtitle: selectedLanguage === 'id' ? "Pilih Bahasa lalu klik Selanjutnya!" : "Choose a Language and click Next!",
            image: "/images/onboardingflow/wardes-restaurant.png",
            buttonText: "Continue",
        },
        {
            title: selectedLanguage === 'id'
                ? `Kamu Berada di Meja ${tableNumberState || '?'}`
                : `You Are at Table ${tableNumberState || '?'}`,
            subtitle: selectedLanguage === 'id'
                ? "Jelajahi berbagai pilihan makanan lezat"
                : "Explore a variety of delicious food options",
            image: "/images/onboardingflow/table.png",
            buttonText: selectedLanguage === 'id' ? "Lanjutkan" : "Continue",
        },
        {
            title: selectedLanguage === 'id' ? "Pesan & Nikmati" : "Order & Enjoy",
            subtitle: selectedLanguage === 'id'
                ? "Pesan dengan mudah dan nikmati makanan lezat"
                : "Order easily and enjoy delicious food",
            image: "/images/onboardingflow/order.png",
            buttonText: selectedLanguage === 'id' ? "Mulai" : "Get Started",
        }
    ];

    const handlePrev = () => {
        if (currentStep > 0) {
            setSwipeDirection('right');
            setTimeout(() => {
                setCurrentStep(currentStep - 1);
            }, 50);
        }
    };

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setSwipeDirection('left');
            setTimeout(() => {
                setCurrentStep(currentStep + 1);
            }, 50);
        } else {
            // Save language preference to localStorage when completing onboarding
            localStorage.setItem('preferredLanguage', selectedLanguage);

            if (onComplete) {
                onComplete();
            } else {
                router.push('/');  // Changed to navigate to the home page
            }
        }
    };

    const handleLanguageChange = (lang: 'id' | 'en') => {
        setSelectedLanguage(lang);
        localStorage.setItem('preferredLanguage', lang);
    };

    const swipeHandlers = useSwipeable({
        onSwipedLeft: () => {
            if (currentStep < steps.length - 1) {
                handleNext();
            }
        },
        onSwipedRight: () => {
            if (currentStep > 0) {
                handlePrev();
            }
        },
        trackMouse: false,
        preventScrollOnSwipe: true,
        delta: 50,
        swipeDuration: 500,
    });

    const currentStepData = steps[currentStep];

    return (
        <Box
            sx={{
                height: '100vh',
                width: '100vw',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'background.paper',
                overflow: 'hidden',
            }}
        >
            <Slide direction="down" in={true} timeout={600}>
                <Box
                    sx={{
                        pt: isSmallScreen ? 1.5 : 3,
                        pb: isSmallScreen ? 0.5 : 1,
                        px: isSmallScreen ? 2 : 4,
                        display: 'flex',
                        alignItems: 'center',
                        flexShrink: 0
                    }}
                >
                    <Box sx={{ position: 'relative', width: 32, height: 32, mr: 1 }}>
                        <Image
                            src="/images/logo.png"
                            alt="Wardes Logo"
                            fill
                            style={{ objectFit: 'contain' }}
                        />
                    </Box>
                    <Typography
                        variant={isSmallScreen ? "h6" : "h5"}
                        component="h1"
                        color="text.primary"
                        fontWeight="bold"
                    >
                        Wardes
                    </Typography>
                </Box>
            </Slide>

            <Box
                {...swipeHandlers}
                sx={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    position: 'relative',
                    touchAction: 'pan-y',
                }}
            >
                <Slide
                    direction={swipeDirection === 'left' ? 'right' : 'left'}
                    in={animationComplete}
                    timeout={300}
                    mountOnEnter
                    unmountOnExit
                >
                    <Container
                        maxWidth="sm"
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '100%',
                            py: isSmallScreen ? 2 : 4,
                            px: isSmallScreen ? 2 : 3,
                        }}
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                width: '100%',
                                mb: isVerySmallScreen ? 1 : 3,
                            }}
                        >
                            <Fade in={animationComplete} timeout={800}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        overflow: 'hidden',
                                        borderRadius: 4,
                                        width: '100%',
                                        position: 'relative',
                                        aspectRatio: '16/9',
                                        mb: isSmallScreen ? 2 : 3
                                    }}
                                >
                                    <Image
                                        src={currentStepData.image}
                                        alt="Wardes"
                                        fill
                                        style={{
                                            objectFit: 'contain',
                                            backgroundColor: '#f8f8f8'
                                        }}
                                        priority
                                    />
                                </Paper>
                            </Fade>

                            <Fade in={animationComplete} timeout={1000}>
                                <Typography
                                    variant={isSmallScreen ? "h5" : "h4"}
                                    component="h2"
                                    align="center"
                                    fontWeight="bold"
                                    sx={{ mb: 0.5 }}
                                >
                                    {currentStepData.title}
                                </Typography>
                            </Fade>

                            <Fade in={animationComplete} timeout={1200}>
                                <Typography
                                    variant="body1"
                                    align="center"
                                    color="text.secondary"
                                    sx={{ mb: isSmallScreen ? 1 : 2 }}
                                >
                                    {currentStepData.subtitle}
                                </Typography>
                            </Fade>

                            <Fade in={animationComplete} timeout={1400}>
                                <Stack
                                    direction="row"
                                    spacing={1}
                                    justifyContent="center"
                                    sx={{ mb: isSmallScreen ? 1 : 2 }}
                                >
                                    {steps.map((_, index) => (
                                        <Box
                                            key={index}
                                            sx={{
                                                width: isSmallScreen ? 8 : 10,
                                                height: isSmallScreen ? 8 : 10,
                                                borderRadius: '50%',
                                                bgcolor: index === currentStep ? theme.palette.primary.main : theme.palette.grey[300]
                                            }}
                                        />
                                    ))}
                                </Stack>
                            </Fade>
                        </Box>
                    </Container>
                </Slide>

                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: 16,
                        transform: 'translateY(-50%)',
                        display: currentStep > 0 ? 'flex' : 'none',
                        opacity: 0.3,
                        color: 'text.secondary',
                        fontSize: '1.5rem',
                        userSelect: 'none',
                    }}
                >
                    ‹
                </Box>
                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        right: 16,
                        transform: 'translateY(-50%)',
                        display: currentStep < steps.length - 1 ? 'flex' : 'none',
                        opacity: 0.3,
                        color: 'text.secondary',
                        fontSize: '1.5rem',
                        userSelect: 'none',
                    }}
                >
                    ›
                </Box>
            </Box>

            <Container
                maxWidth="sm"
                sx={{
                    flexShrink: 0,
                    px: isSmallScreen ? 2 : 3,
                    pb: 4,
                    pt: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    zIndex: 5,
                }}
            >
                {currentStep === 0 && (
                    <Fade in={animationComplete} timeout={1600}>
                        <Box sx={{
                            display: 'flex',
                            width: '100%',
                            gap: 2
                        }}>
                            <Button
                                variant="outlined"
                                fullWidth
                                sx={{
                                    py: isSmallScreen ? 1 : 1.5,
                                    borderRadius: '50px',
                                    borderColor: selectedLanguage === 'id' ? '#bc5a3c' : 'grey.300',
                                    color: selectedLanguage === 'id' ? '#bc5a3c' : 'text.secondary',
                                    fontWeight: selectedLanguage === 'id' ? 'bold' : 'normal',
                                    '&:hover': {
                                        borderColor: '#bc5a3c',
                                    }
                                }}
                                onClick={() => handleLanguageChange('id')}
                            >
                                Bahasa
                            </Button>
                            <Button
                                variant="outlined"
                                fullWidth
                                sx={{
                                    py: isSmallScreen ? 1 : 1.5,
                                    borderRadius: '50px',
                                    borderColor: selectedLanguage === 'en' ? '#bc5a3c' : 'grey.300',
                                    color: selectedLanguage === 'en' ? '#bc5a3c' : 'text.secondary',
                                    fontWeight: selectedLanguage === 'en' ? 'bold' : 'normal',
                                    '&:hover': {
                                        borderColor: '#bc5a3c',
                                    }
                                }}
                                onClick={() => handleLanguageChange('en')}
                            >
                                English
                            </Button>
                        </Box>
                    </Fade>
                )}

                <Grow in={animationComplete} timeout={1800}>
                    <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        fullWidth
                        onClick={handleNext}
                        sx={{
                            py: isSmallScreen ? 1 : 1.5,
                            borderRadius: '50px',
                            bgcolor: '#bc5a3c',
                            '&:hover': {
                                bgcolor: '#a04e34',
                            },
                            fontWeight: 'bold',
                            fontSize: isSmallScreen ? '1rem' : '1.1rem',
                        }}
                    >
                        {currentStepData.buttonText}
                    </Button>
                </Grow>
            </Container>
        </Box>
    );
}