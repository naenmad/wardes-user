import { Timestamp } from 'firebase/firestore';

// Order schema
export interface Order {
    id?: string;           // Auto-generated Firestore ID
    tableNumber: string;   // From QR code
    customerName?: string; // Optional customer information
    orderTime: Timestamp;  // When order was placed
    status: 'pending' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
    totalAmount: number;   // Total order amount
    paymentStatus: 'unpaid' | 'paid';
    paymentMethod?: 'cash' | 'credit_card' | 'debit' | 'qris';
    paymentTime?: Timestamp;
    notes?: string;        // Special instructions for the entire order
    staffId?: string;      // Which staff processed the order
    languageUsed: string;  // Which language the customer used (id/en)
}

// Order Item schema (for subcollection)
export interface OrderItem {
    id?: string;           // Auto-generated Firestore ID
    menuItemId: string;    // Reference to menu item
    name: string;          // Item name (for historical record)
    price: number;         // Individual item price
    quantity: number;      // How many ordered
    subtotal: number;      // price * quantity
    specialInstructions?: string;  // Special requests for this item
    options?: {            // Selected options/customizations
        [key: string]: string | boolean | number;
    };
}