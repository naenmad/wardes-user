'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
    description?: string;
    spicyLevel?: string;
    iceLevel?: string;
}

interface CartContextType {
    cartItems: CartItem[];
    addToCart: (itemOrId: CartItem | string, itemData?: Partial<CartItem>) => Promise<void>;
    removeFromCart: (id: string, options?: { spicyLevel?: string; iceLevel?: string }) => void;
    updateQuantity: (id: string, quantity: number, options?: { spicyLevel?: string; iceLevel?: string }) => void;
    clearCart: () => void;
    getCartTotal: () => number;
    isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load cart from localStorage on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedCart = localStorage.getItem('cart');
            if (savedCart) {
                try {
                    const parsedCart = JSON.parse(savedCart);
                    if (Array.isArray(parsedCart)) {
                        setCartItems(parsedCart);
                    }
                } catch (error) {
                    console.error('Error parsing cart from localStorage:', error);
                    localStorage.removeItem('cart'); // Clear corrupted data
                }
            }
            setIsLoading(false);
        }
    }, []);

    // Save cart to localStorage whenever cartItems changes
    useEffect(() => {
        if (typeof window !== 'undefined' && !isLoading) {
            localStorage.setItem('cart', JSON.stringify(cartItems));
        }
    }, [cartItems, isLoading]);

    const addToCart = async (itemOrId: CartItem | string, itemData?: Partial<CartItem>) => {
        try {
            let itemToAdd: CartItem;

            if (typeof itemOrId === 'string') {
                // Validasi itemData lebih ketat
                if (itemData &&
                    itemData.name &&
                    typeof itemData.price === 'number' &&
                    !isNaN(itemData.price) &&
                    itemData.image) {

                    itemToAdd = {
                        id: itemOrId,
                        name: itemData.name,
                        price: itemData.price,
                        image: itemData.image,
                        description: itemData.description || '',
                        quantity: 1,
                        spicyLevel: itemData.spicyLevel,
                        iceLevel: itemData.iceLevel,
                    };
                } else {
                    // Fallback: fetch dari API jika data tidak lengkap
                    console.warn('Incomplete item data provided, attempting to fetch from API...', itemData);
                    const { getMenuItemById } = await import('../lib/firebase/menuService');
                    const fetchedItem = await getMenuItemById(itemOrId);

                    if (!fetchedItem) {
                        throw new Error(`Menu item with ID ${itemOrId} not found`);
                    }

                    itemToAdd = {
                        id: fetchedItem.id,
                        name: fetchedItem.name,
                        price: fetchedItem.price,
                        image: fetchedItem.image,
                        description: fetchedItem.description || '',
                        quantity: 1,
                        spicyLevel: itemData?.spicyLevel,
                        iceLevel: itemData?.iceLevel,
                    };
                }
            } else {
                // Jika item lengkap sudah diberikan
                itemToAdd = {
                    ...itemOrId,
                    quantity: itemOrId.quantity || 1,
                    description: itemOrId.description || '',
                };
            }

            console.log('Item to add to cart:', itemToAdd);

            setCartItems(prevItems => {
                const existingItemIndex = prevItems.findIndex(item =>
                    item.id === itemToAdd.id &&
                    item.spicyLevel === itemToAdd.spicyLevel &&
                    item.iceLevel === itemToAdd.iceLevel
                );

                if (existingItemIndex >= 0) {
                    // Jika item sudah ada dengan level yang sama, tambah quantity
                    const updatedItems = [...prevItems];
                    updatedItems[existingItemIndex] = {
                        ...updatedItems[existingItemIndex],
                        quantity: updatedItems[existingItemIndex].quantity + 1
                    };
                    console.log('Updated existing item quantity:', updatedItems[existingItemIndex]);
                    return updatedItems;
                } else {
                    // Jika item baru atau level berbeda, tambahkan sebagai item baru
                    console.log('Adding new item to cart:', itemToAdd);
                    return [...prevItems, itemToAdd];
                }
            });

        } catch (error) {
            console.error('Error adding item to cart:', error);
            throw error;
        }
    };

    const removeFromCart = (id: string, options?: { spicyLevel?: string; iceLevel?: string }) => {
        setCartItems(prevItems =>
            prevItems.filter(item =>
                !(item.id === id &&
                    item.spicyLevel === options?.spicyLevel &&
                    item.iceLevel === options?.iceLevel)
            )
        );
    };

    const updateQuantity = (id: string, quantity: number, options?: { spicyLevel?: string; iceLevel?: string }) => {
        if (quantity <= 0) {
            removeFromCart(id, options);
            return;
        }

        setCartItems(prevItems =>
            prevItems.map(item =>
                (item.id === id &&
                    item.spicyLevel === options?.spicyLevel &&
                    item.iceLevel === options?.iceLevel)
                    ? { ...item, quantity }
                    : item
            )
        );
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const getCartTotal = () => {
        return cartItems.reduce((total, item) => {
            const price = typeof item.price === 'number' ? item.price : 0;
            const quantity = typeof item.quantity === 'number' ? item.quantity : 0;
            return total + (price * quantity);
        }, 0);
    };

    return (
        <CartContext.Provider value={{
            cartItems,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            getCartTotal,
            isLoading,
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

// Export CartItemDetail untuk kompatibilitas dengan cart page
export interface CartItemDetail extends CartItem { }