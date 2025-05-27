import { Metadata } from 'next';
import ClientLayout from './client-layout';
import { CartProvider } from '../contexts/CartContext';

export const metadata: Metadata = {
    title: 'Warung Desa',
    description: 'Warung Desa App - Makanan & Minuman',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>
                <CartProvider>
                    <ClientLayout>{children}</ClientLayout>
                </CartProvider>
            </body>
        </html>
    );
}