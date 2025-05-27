import {
    collection,
    addDoc,
    updateDoc,
    doc,
    getDocs,
    getDoc,
    query,
    where,
    orderBy,
    serverTimestamp, // Pastikan serverTimestamp diimpor jika digunakan, atau Timestamp.now()
    Timestamp,
    DocumentReference,
    limit,
    setDoc
} from 'firebase/firestore';
import { db } from './config';
import { Order /*, OrderItem as SchemaOrderItem */ } from './schema'; // Jika OrderItem di schema berbeda, beri alias

/**
 * Create a new order in Firestore with detailed customer and payment information
 */
export async function createOrderWithDetails(
    orderId: string,
    items: OrderItem[], // Gunakan OrderItem dari bawah
    customer: { name: string; phone: string; address: string },
    notes: string,
    paymentToken?: string
) {
    try {
        console.log('Saving order data:', { orderId, items, customer, notes });

        // Calculate subtotal
        const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);

        // Calculate tax (11%)
        const tax = Math.round(subtotal * 0.11);
        const serviceFee = 2000; // Asumsi service fee

        // Calculate total amount
        const totalAmount = subtotal + tax + serviceFee; // Tambahkan serviceFee

        // Determine order type based on address
        const orderType = customer.address === 'Dine-in' ? 'Makan di Tempat' : 'Bawa Pulang';

        // Prepare order data
        const orderData = {
            orderId: orderId,
            items: items.map(item => ({ // Pastikan ini sesuai dengan struktur yang diinginkan
                menuItemId: item.menuItemId, // Sesuaikan dengan OrderItem
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                subtotal: item.subtotal,
                spicyLevel: item.spicyLevel || null,
                iceLevel: item.iceLevel || null,
            })),
            customer: {
                name: customer.name,
                phone: customer.phone,
                address: customer.address
            },
            notes: notes,
            orderType: orderType,
            orderTime: Timestamp.now(), // Gunakan Timestamp.now()
            status: 'pending',
            paymentStatus: paymentToken ? 'processing' : 'unpaid',
            paymentToken: paymentToken || '',
            tableNumber: customer.address === 'Dine-in' ? (typeof localStorage !== 'undefined' ? localStorage.getItem('tableNumber') : null) || 'unknown' : 'takeaway',
            subtotal: subtotal,
            tax: tax,
            serviceFee: serviceFee, // Simpan serviceFee
            totalAmount: totalAmount
        };

        // Save to Firestore
        // Jika Anda ingin menggunakan orderId sebagai ID dokumen:
        const orderRef = doc(db, 'orders', orderId);
        await setDoc(orderRef, orderData);
        console.log('Order created with ID:', orderId);
        return orderId;
        // Jika ingin Firestore generate ID:
        // const docRef = await addDoc(collection(db, 'orders'), orderData);
        // console.log('Order created with Firestore ID:', docRef.id);
        // return docRef.id;
    } catch (error) {
        console.error('Failed to create order in Firestore:', error);
        throw error;
    }
}

/**
 * Get an order by ID, including its order items
 */
export const getOrderById = async (orderId: string): Promise<Order & { items: OrderItem[] }> => {
    try {
        // Get the order document
        const orderDocRef = doc(db, 'orders', orderId); // Gunakan orderId yang diberikan
        const orderDoc = await getDoc(orderDocRef);

        if (!orderDoc.exists()) {
            throw new Error(`Order with ID ${orderId} not found`);
        }

        const orderData = { id: orderDoc.id, ...orderDoc.data() } as Order;

        // Jika item disimpan sebagai array di dalam dokumen order (seperti di createOrder baru)
        // maka tidak perlu query subcollection 'orderItems' kecuali jika itu memang struktur Anda.
        // Asumsi createOrder yang baru menyimpan items sebagai array di dokumen utama.
        const itemsFromOrderData = orderDoc.data()?.items as OrderItem[] || [];

        return {
            ...orderData,
            items: itemsFromOrderData
        };
    } catch (error) {
        console.error('Error getting order:', error);
        throw error;
    }
};

/**
 * Update an order's status
 */
export const updateOrderStatus = async (
    orderId: string,
    status: Order['status']
): Promise<void> => {
    try {
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, {
            status,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        throw error;
    }
};

/**
 * Mark an order as paid
 */
export const markOrderAsPaid = async (
    orderId: string,
    paymentMethod: Order['paymentMethod']
): Promise<void> => {
    try {
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, {
            paymentStatus: 'paid',
            paymentMethod,
            paymentTime: serverTimestamp()
        });
    } catch (error) {
        console.error('Error marking order as paid:', error);
        throw error;
    }
};

/**
 * Get all orders for a specific table
 */
export const getOrdersByTable = async (tableNumber: string): Promise<Order[]> => {
    try {
        const q = query(
            collection(db, 'orders'),
            where('tableNumber', '==', tableNumber),
            orderBy('orderTime', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Order[];
    } catch (error) {
        console.error('Error getting orders by table:', error);
        throw error;
    }
};

/**
 * Get orders by status (for admin dashboard)
 */
export const getOrdersByStatus = async (status: Order['status']): Promise<Order[]> => {
    try {
        const q = query(
            collection(db, 'orders'),
            where('status', '==', status),
            orderBy('orderTime', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Order[];
    } catch (error) {
        console.error('Error getting orders by status:', error);
        throw error;
    }
};

/**
 * Get orders by date range (for reporting)
 */
export const getOrdersByDateRange = async (
    startDate: Date,
    endDate: Date
): Promise<Order[]> => {
    try {
        const startTimestamp = Timestamp.fromDate(startDate);
        const endTimestamp = Timestamp.fromDate(endDate);

        const q = query(
            collection(db, 'orders'),
            where('orderTime', '>=', startTimestamp),
            where('orderTime', '<=', endTimestamp),
            orderBy('orderTime', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Order[];
    } catch (error) {
        console.error('Error getting orders by date range:', error);
        throw error;
    }
};

/**
 * Get today's orders (for admin dashboard)
 */
export const getTodaysOrders = async (): Promise<Order[]> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return getOrdersByDateRange(today, tomorrow);
};

/**
 * Get all orders
 */
export const getOrders = async () => {
    try {
        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef, orderBy('orderDate', 'desc'));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting orders:', error);
        throw error;
    }
};

/**
 * Get revenue data for dashboard
 */
export const getRevenueData = async () => {
    try {
        // Get current date
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Create Firestore timestamp
        const startTimestamp = Timestamp.fromDate(startOfMonth);

        // Query orders from this month
        const ordersRef = collection(db, 'orders');
        const q = query(
            ordersRef,
            where('orderDate', '>=', startTimestamp),
            orderBy('orderDate', 'desc')
        );

        const snapshot = await getDocs(q);
        const orders = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Calculate revenue
        const revenue = orders.reduce((total: number, order: any) => {
            return total + (order.totalAmount || 0);
        }, 0);

        return {
            total: revenue,
            orders: orders.length,
            // More data processing can be done here
        };
    } catch (error) {
        console.error('Error getting revenue data:', error);
        throw error;
    }
};

/**
 * Get popular menu items
 */
export const getPopularItems = async () => {
    try {
        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef, orderBy('orderDate', 'desc'), limit(100));
        const snapshot = await getDocs(q);

        const orders = snapshot.docs.map(doc => doc.data());

        // Count item occurrences
        const itemCounts: Record<string, { count: number, name: string, price: number }> = {};

        orders.forEach((order: any) => {
            if (order.items && Array.isArray(order.items)) {
                order.items.forEach((item: any) => {
                    if (!itemCounts[item.id]) {
                        itemCounts[item.id] = {
                            count: 0,
                            name: item.name,
                            price: item.price
                        };
                    }
                    itemCounts[item.id].count += item.quantity || 1;
                });
            }
        });

        // Convert to array and sort
        const popularItems = Object.keys(itemCounts).map(id => ({
            id,
            name: itemCounts[id].name,
            price: itemCounts[id].price,
            count: itemCounts[id].count
        }));

        // Sort by count in descending order
        popularItems.sort((a, b) => b.count - a.count);

        return popularItems.slice(0, 10); // Return top 10
    } catch (error) {
        console.error('Error getting popular items:', error);
        throw error;
    }
};

export interface OrderItem {
    menuItemId: string; // Sebelumnya mungkin 'id' di beberapa tempat, pastikan konsisten
    name: string;
    price: number;
    quantity: number;
    subtotal: number; // subtotal per item
    spicyLevel?: string;
    iceLevel?: string;
}

export interface CustomerInfo {
    name?: string; // Jadikan opsional jika createOrder mengizinkannya
    phone?: string; // Jadikan opsional jika createOrder mengizinkannya
    address?: string;
    tableNumber?: string; // Jadikan opsional jika tidak selalu ada
}

export async function createOrder(
    orderId: string,
    items: OrderItem[], // Array item yang diterima dari API route
    customer: CustomerInfo,
    notes: string,
    paymentMethod: string,
    paymentToken?: string | null,
    grandTotal?: number,
    languageUsedParam?: string | null // Tambahkan parameter ini jika Anda menggunakannya di API
) {
    // Validasi input dasar
    if (!orderId || !items || !Array.isArray(items) || items.length === 0 || !customer || !paymentMethod) {
        console.error("Missing or invalid required fields for createOrder:", {
            orderId,
            itemsCount: items ? items.length : 'undefined/not_array',
            customerExists: !!customer,
            paymentMethod
        });
        throw new Error("Missing or invalid required fields to create order (orderId, items array, customer, paymentMethod).");
    }

    const orderRef = doc(db, 'orders', orderId);

    // Validasi dan proses ulang items untuk memastikan semua field numerik adalah angka
    // dan subtotal per item dihitung dengan benar di sini.
    let calculatedSubtotalFromItems = 0;
    const validatedItemsForFirestore = items.map(itemInput => {
        const price = typeof itemInput.price === 'number' && !isNaN(itemInput.price) ? itemInput.price : 0;
        const quantity = typeof itemInput.quantity === 'number' && !isNaN(itemInput.quantity) ? itemInput.quantity : 0;
        const itemSubtotal = price * quantity; // Hitung ulang subtotal di sini untuk kepastian

        calculatedSubtotalFromItems += itemSubtotal; // Akumulasi subtotal keseluruhan

        return {
            menuItemId: String(itemInput.menuItemId || 'UNKNOWN_ITEM_ID'),
            name: String(itemInput.name || 'Unknown Item'),
            price: price,
            quantity: quantity,
            subtotal: itemSubtotal, // Gunakan subtotal yang baru dihitung
            spicyLevel: itemInput.spicyLevel || null,
            iceLevel: itemInput.iceLevel || null,
        };
    });

    // Pastikan calculatedSubtotalFromItems adalah angka yang valid
    if (isNaN(calculatedSubtotalFromItems)) {
        console.error("calculatedSubtotalFromItems is NaN. Check item prices and quantities.", items);
        calculatedSubtotalFromItems = 0; // Fallback
    }

    const tax = Math.round(calculatedSubtotalFromItems * 0.11);
    const serviceFee = 2000; // Pastikan ini angka

    // Pastikan grandTotal yang diterima (jika ada) atau yang dihitung adalah angka
    let finalGrandTotal: number;
    if (typeof grandTotal === 'number' && !isNaN(grandTotal)) {
        finalGrandTotal = grandTotal;
    } else {
        finalGrandTotal = calculatedSubtotalFromItems + tax + serviceFee;
    }
    if (isNaN(finalGrandTotal)) {
        console.error("finalGrandTotal is NaN. Check calculations.", { calculatedSubtotalFromItems, tax, serviceFee, grandTotalParam: grandTotal });
        finalGrandTotal = 0; // Fallback
    }


    const orderData = {
        items: validatedItemsForFirestore,
        customerDetails: {
            name: customer.name || null,
            phone: customer.phone || null,
            address: customer.address || null,
            tableNumber: customer.tableNumber || null,
        },
        notes: notes || '',
        paymentMethod: paymentMethod,
        paymentToken: paymentToken || null,
        status: paymentMethod === 'cash' ? 'confirmed' : 'pending_payment',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        subtotal: calculatedSubtotalFromItems, // Gunakan subtotal yang dihitung dari item yang divalidasi
        tax: tax,
        serviceFee: serviceFee,
        grandTotal: finalGrandTotal, // Gunakan grand total yang sudah divalidasi
        languageUsed: languageUsedParam || 'id',
        userId: null, // Placeholder, sesuaikan jika Anda memiliki sistem pengguna
        // Pastikan tidak ada field lain yang bisa menjadi undefined
    };

    console.log(`Attempting to save order ${orderId} with data (createOrder v2):`, JSON.stringify(orderData, null, 2));

    try {
        await setDoc(orderRef, orderData);
        console.log(`Order ${orderId} created successfully.`);
        return orderId;
    } catch (error: any) {
        console.error(`Error creating order ${orderId} in Firestore:`, error);
        if (error.message && error.message.includes("invalid data")) {
            console.error("Data that caused Firestore error (createOrder v2):", JSON.stringify(orderData, null, 2));
        }
        throw error;
    }
}

// PASTIKAN HANYA ADA SATU FUNGSI createOrder INI DI FILE ANDA.
// HAPUS createOrderWithDetails JIKA TIDAK DIGUNAKAN OLEH API /api/create-payment.
// ... (sisa fungsi lainnya seperti getOrderById, dll.)