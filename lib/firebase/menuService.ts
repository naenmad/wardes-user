import { collection, doc, getDoc, getDocs, query, where, documentId, Timestamp } from 'firebase/firestore';
import { db } from './config';
import { useEffect, useState } from 'react';

// Asumsi interface MenuItem sudah ada di sini atau diimpor
export interface MenuItem {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    category: string;
    available: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    translations: {
        [key: string]: {
            name: string;
            description: string;
        }
    };
    rating: number; // Apakah field ini ada di Firestore dan di interface menuService.ts?
    reviews: number; // Apakah field ini ada di Firestore dan di interface menuService.ts?
    // tambahkan field lain jika ada
}

// Move the interface outside the function for reuse
interface MenuItemData {
    name?: string;
    description?: string;
    translations?: {
        [key: string]: {
            name?: string;
            description?: string;
        };
    };
    price?: number;
    category?: string;
    available?: boolean;
    image?: string;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
    rating?: number;
    reviews?: number;
    ingredients?: string[];
}

// Fungsi untuk mengambil semua item menu (mungkin sudah ada)
export async function getMenuItems(category: string = 'semua', language: string = 'id'): Promise<MenuItem[]> {
    const menuRef = collection(db, 'menu'); // <--- UBAH KE 'menu'
    let q;
    if (category !== 'semua') {
        // Jika Anda ingin tetap filter berdasarkan available, pastikan field itu ada di Firestore
        // Untuk sekarang, kita coba tanpa filter available jika field itu belum ada
        q = query(menuRef, where('category', '==', category)/*, where('available', '==', true)*/);
    } else {
        // Untuk sekarang, kita coba tanpa filter available jika field itu belum ada
        q = query(menuRef /*, where('available', '==', true)*/);
    }

    try {
        console.log(`Querying menu with category: ${category}, language: ${language}`);
        const snapshot = await getDocs(q);

        // Then use it in your mapping:
        return snapshot.docs.map(doc => {
            const data = doc.data() as MenuItemData;
            console.log("Mapping document:", doc.id, data);
            const currentTranslation = data.translations?.[language] || data.translations?.id || {};

            return {
                id: doc.id,
                name: currentTranslation.name || data.name || "Menu Item",
                description: currentTranslation.description || data.description || "Menu description",
                price: data.price || 0,
                image: data.image || "",
                category: data.category || "",
                available: data.available !== undefined ? data.available : true,
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
                translations: data.translations || {},
                rating: data.rating !== undefined ? data.rating : 0,
                reviews: data.reviews !== undefined ? data.reviews : 0,
            } as MenuItem;
        });
    } catch (error) {
        console.error("Firestore error in getMenuItems:", error);
        throw error;
    }
}


// Fungsi BARU untuk mengambil item menu berdasarkan array ID
export async function getMenuItemsByIds(itemIds: string[], language: string = 'id'): Promise<MenuItem[]> {
    if (!itemIds || itemIds.length === 0) {
        return [];
    }

    const menuItemsRef = collection(db, 'menuItems');
    // Firestore 'in' query memiliki batasan 10 item dalam array per query.
    // Jika Anda memiliki lebih dari 10, Anda perlu membaginya menjadi beberapa query.
    // Untuk kesederhanaan, contoh ini mengasumsikan kurang dari atau sama dengan 30 (batas baru Firestore untuk 'in').
    // Jika lebih dari 30, Anda perlu memecah itemIds menjadi chunk @30.

    const fetchedItems: MenuItem[] = [];
    const chunkSize = 30; // Batas untuk 'in' query di Firestore

    for (let i = 0; i < itemIds.length; i += chunkSize) {
        const chunk = itemIds.slice(i, i + chunkSize);
        if (chunk.length === 0) continue;

        const q = query(menuItemsRef, where(documentId(), 'in', chunk));
        try {
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data() as MenuItemData; // Add type assertion
                    const currentTranslation = data.translations?.[language] || data.translations?.id || {};
                    fetchedItems.push({
                        id: docSnap.id,
                        name: currentTranslation.name || data.name || "Menu Item",
                        description: currentTranslation.description || data.description || "Menu description",
                        price: data.price || 0,
                        image: data.image || "",
                        category: data.category || "",
                        available: data.available !== undefined ? data.available : true,
                        createdAt: data.createdAt,
                        updatedAt: data.updatedAt,
                        translations: data.translations || {},
                        rating: data.rating !== undefined ? data.rating : 0,
                        reviews: data.reviews !== undefined ? data.reviews : 0,
                    } as MenuItem);
                }
            });
        } catch (error) {
            console.error("Error fetching menu items by IDs chunk: ", error);
            // Anda bisa memutuskan untuk melempar error atau melanjutkan dengan item yang berhasil diambil
        }
    }
    return fetchedItems;
}

// UBAH NAMA FUNGSI INI (atau buat baru jika belum ada)
export async function getMenuItem(itemId: string, language: string = 'id'): Promise<MenuItem | null> { // <--- Pastikan namanya 'getMenuItem'
    if (!itemId) {
        console.error("getMenuItem: itemId is required");
        return null;
    }

    const menuItemRef = doc(db, 'menu', itemId); // Pastikan koleksi adalah 'menu'

    try {
        const docSnap = await getDoc(menuItemRef);

        if (docSnap.exists()) {
            const data = docSnap.data() as MenuItemData; // Add type assertion
            const currentTranslation = data.translations?.[language] || data.translations?.id || {};
            return {
                id: docSnap.id,
                name: currentTranslation.name || data.name || "Menu Item",
                description: currentTranslation.description || data.description || "Menu description",
                price: data.price || 0,
                image: data.image || "",
                category: data.category || "",
                available: data.available !== undefined ? data.available : true,
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
                translations: data.translations || {},
                rating: data.rating !== undefined ? data.rating : 0,
                reviews: data.reviews !== undefined ? data.reviews : 0,
                ingredients: data.ingredients || [],
            } as MenuItem;
        } else {
            console.log(`No menu item found with ID: ${itemId}`);
            return null;
        }
    } catch (error) {
        console.error("Error fetching menu item by ID:", error);
        throw error;
    }
}

// Perbaiki fungsi ini:
export async function getMenuItemById(id: string): Promise<MenuItem | null> {
    try {
        const docRef = doc(db, 'menu', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data() as MenuItemData; // Add type assertion
            return {
                id: docSnap.id,
                name: data.name || "Menu Item",
                description: data.description || "Menu description",
                price: data.price || 0,
                image: data.image || "",
                category: data.category || "",
                available: data.available !== undefined ? data.available : true,
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
                translations: data.translations || {},
                rating: data.rating !== undefined ? data.rating : 0,
                reviews: data.reviews !== undefined ? data.reviews : 0,
            } as MenuItem;
        } else {
            console.error(`Menu item with ID ${id} not found`);
            return null;
        }
    } catch (error) {
        console.error('Error fetching menu item by ID:', error);
        return null;
    }
}

// Contoh penggunaan useEffect untuk mengambil menu
export function MenuComponent({ category, language }) {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        const fetchMenu = async () => {
            setLoading(true);
            try {
                const items = await getMenuItems(category, language);
                setMenuItems(items);
            } catch (error) {
                console.error('Error fetching menu items in Home page:', error); // Ini akan menangkap error dari getMenuItems
            } finally {
                setLoading(false);
            }
        };

        fetchMenu();
    }, [category, language]);

    // ... render menu items ...
}