import { Metadata } from 'next';

export async function generateMetadata({ params }): Promise<Metadata> {
    // Anda bisa mengambil data promo untuk title yang dinamis
    // Untuk sementara gunakan nilai statis
    return {
        title: 'Promo Detail | Warung Desa',
    };
}

export default function PromoLayout({ children }) {
    return children;
}