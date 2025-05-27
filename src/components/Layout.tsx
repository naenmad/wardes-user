import React, { ReactNode } from 'react';
import Head from 'next/head';
import {
    AppBar,
    Box,
    Container,
    Toolbar,
    Typography,
    CssBaseline,
    useTheme,
    ThemeProvider,
    createTheme,
    IconButton,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import InfoIcon from '@mui/icons-material/Info';
import Link from 'next/link';
import NextLink from 'next/link';

const theme = createTheme({
    palette: {
        primary: {
            main: '#556cd6',
        },
        secondary: {
            main: '#19857b',
        },
    },
    typography: {
        fontFamily: [
            'Inter',
            '-apple-system',
            'BlinkMacSystemFont',
            '"Segoe UI"',
            'Roboto',
            '"Helvetica Neue"',
            'Arial',
            'sans-serif',
        ].join(','),
    },
});

interface LayoutProps {
    children: ReactNode;
    title?: string;
}

export default function Layout({ children, title = 'Warung Desa' }: LayoutProps) {
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const drawerWidth = 240;

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const drawer = (
        <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ my: 2 }}>
                Warung Desa
            </Typography>
            <Divider />
            <List>
                <Link href="/" passHref legacyBehavior>
                    <ListItem disablePadding>
                        <ListItemButton component="a">
                            <ListItemIcon>
                                <HomeIcon />
                            </ListItemIcon>
                            <ListItemText primary="Home" />
                        </ListItemButton>
                    </ListItem>
                </Link>

                <Link href="/about" passHref legacyBehavior>
                    <ListItem disablePadding>
                        <ListItemButton component="a">
                            <ListItemIcon>
                                <InfoIcon />
                            </ListItemIcon>
                            <ListItemText primary="About" />
                        </ListItemButton>
                    </ListItem>
                </Link>
            </List>
        </Box>
    );

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Head>
                <title>{title}</title>
                <meta charSet="utf-8" />
                <meta name="viewport" content="initial-scale=1.0, width=device-width" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                <AppBar position="static" component="nav">
                    <Toolbar>
                        <IconButton
                            color="inherit"
                            aria-label="open drawer"
                            edge="start"
                            onClick={handleDrawerToggle}
                            sx={{ mr: 2, display: { sm: 'none' } }}
                        >
                            <MenuIcon />
                        </IconButton>
                        <Typography
                            variant="h6"
                            component={NextLink}
                            href="/"
                            sx={{
                                flexGrow: 1,
                                color: 'inherit',
                                textDecoration: 'none',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            Warung Desa
                        </Typography>
                        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                            <NextLink href="/" passHref>
                                <Typography
                                    component="a"
                                    sx={{ color: 'white', mx: 2, textDecoration: 'none' }}
                                >
                                    Home
                                </Typography>
                            </NextLink>
                            <NextLink href="/about" passHref>
                                <Typography
                                    component="a"
                                    sx={{ color: 'white', mx: 2, textDecoration: 'none' }}
                                >
                                    About
                                </Typography>
                            </NextLink>
                        </Box>
                    </Toolbar>
                </AppBar>

                <Box component="nav">
                    <Drawer
                        variant="temporary"
                        open={mobileOpen}
                        onClose={handleDrawerToggle}
                        ModalProps={{
                            keepMounted: true, // Better open performance on mobile
                        }}
                        sx={{
                            display: { xs: 'block', sm: 'none' },
                            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                        }}
                    >
                        {drawer}
                    </Drawer>
                </Box>

                <Container component="main" sx={{ flexGrow: 1, py: 4 }}>
                    {children}
                </Container>

                <Box
                    component="footer"
                    sx={{
                        py: 3,
                        px: 2,
                        mt: 'auto',
                        backgroundColor: (theme) =>
                            theme.palette.mode === 'light' ? theme.palette.grey[200] : theme.palette.grey[800],
                    }}
                >
                    <Container maxWidth="sm">
                        <Typography variant="body2" color="text.secondary" align="center">
                            © {new Date().getFullYear()} Warung Desa. All rights reserved.
                        </Typography>
                    </Container>
                </Box>
            </Box>
        </ThemeProvider>
    );
}