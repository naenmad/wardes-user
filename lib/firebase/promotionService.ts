'use client';

import { collection, getDocs, query, where, orderBy, doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from './config';

// Promotion interface
export interface PromotionTranslation {
    title: string;
    description: string;
}

export interface Promotion {
    id: string; // Firestore document ID
    actionLink: string;
    active: boolean;
    createdAt: Timestamp;
    image: string;
    order: number;
    translations: {
        [key: string]: PromotionTranslation;
    };
    updatedAt: Timestamp;
    title?: string;
    description?: string;
    menuItemIds?: string[]; // Pastikan ini ada
}

// Get active promotions
export async function getActivePromotions(language: string = 'id'): Promise<Promotion[]> {
    try {
        const promotionsRef = collection(db, 'promotions');
        const q = query(
            promotionsRef,
            where('active', '==', true),
            orderBy('order', 'asc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            // Mengambil translasi berdasarkan bahasa, fallback ke 'id', lalu ke objek kosong
            const currentTranslation = data.translations?.[language] || data.translations?.id || {};

            return {
                id: doc.id,
                actionLink: data.actionLink,
                active: data.active,
                createdAt: data.createdAt,
                image: data.image,
                order: data.order,
                translations: data.translations, // Simpan semua translasi jika diperlukan
                updatedAt: data.updatedAt,
                title: currentTranslation.title || "Promotion Title", // Fallback title
                description: currentTranslation.description || "Promotion description." // Fallback description
            } as Promotion;
        });
    } catch (error) {
        console.error('Error fetching active promotions:', error);
        return [];
    }
}

// Get a single promotion by Firestore document ID (nama diubah)
export async function getPromotionById(id: string, language: string = 'id'): Promise<Promotion | null> {
    try {
        const docRef = doc(db, 'promotions', id);
        const snapshot = await getDoc(docRef);

        if (!snapshot.exists()) {
            console.log(`No promotion found with ID: ${id}`);
            return null;
        }

        const data = snapshot.data();
        const currentTranslation = data.translations?.[language] || data.translations?.id || {};

        return {
            id: snapshot.id,
            actionLink: data.actionLink,
            active: data.active,
            createdAt: data.createdAt,
            image: data.image,
            order: data.order,
            translations: data.translations,
            updatedAt: data.updatedAt,
            title: currentTranslation.title || "Promotion Title",
            description: currentTranslation.description || "Promotion description."
        } as Promotion;
    } catch (error) {
        console.error('Error fetching promotion by ID:', error);
        return null;
    }
}

// Get a single promotion by slug (dari actionLink)
export async function getPromotion(slug: string, language: string): Promise<Promotion | null> {
    if (!slug) {
        console.error("Slug is undefined or empty in getPromotion");
        return null;
    }

    const promotionsCol = collection(db, 'promotions');
    const targetActionLink = `/promos/${slug}`;
    const q = query(promotionsCol, where("actionLink", "==", targetActionLink));

    try {
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const docSnap = querySnapshot.docs[0];
            const data = docSnap.data();
            const currentTranslation = data.translations?.[language] || data.translations?.id || {};

            return {
                id: docSnap.id,
                actionLink: data.actionLink,
                active: data.active,
                createdAt: data.createdAt,
                image: data.image,
                order: data.order,
                translations: data.translations,
                updatedAt: data.updatedAt,
                title: currentTranslation.title || "Promotion Title",
                description: currentTranslation.description || "Promotion description."
            } as Promotion;
        } else {
            console.log(`No promotion found with actionLink: ${targetActionLink}`);
            return null;
        }
    } catch (error) {
        console.error("Error fetching promotion by actionLink: ", error);
        return null;
    }
}