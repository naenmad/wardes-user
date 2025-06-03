import { NextResponse } from 'next/server';
import { createOrder } from '@/lib/firebase/orders';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { tableNumber, items, notes, customerName, languageUsed } = body;

        // Generate order ID
        const orderId = 'ORD-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

        // Format customer details
        const customerDetails = {
            name: customerName || 'Customer',
            phone: '123456789', // Default phone
            address: 'Dine-in',
            tableNumber: tableNumber || 'unknown'
        };

        // Calculate totals
        const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
        const tax = Math.round(subtotal * 0.11);
        const serviceFee = 2000;
        const grandTotal = subtotal + tax + serviceFee;

        // Format items for createOrder
        const formattedItems = items.map((item: any) => ({
            menuItemId: item.id || item.menuItemId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            subtotal: item.price * item.quantity,
            spicyLevel: item.spicyLevel || null,
            iceLevel: item.iceLevel || null,
        }));

        // Call createOrder with all required parameters
        await createOrder(
            orderId,                    // orderId
            formattedItems,            // items
            customerDetails,           // customerDetails
            notes || '',               // notes
            'cash',                    // paymentMethod (default to cash for this API)
            null,                      // paymentToken
            grandTotal,                // grandTotal
            languageUsed || 'id',      // languageUsed
            'pending'                  // status
        );

        return NextResponse.json({
            success: true,
            orderId: orderId,
            message: 'Order created successfully'
        });

    } catch (error: any) {
        console.error('Error creating order:', error);
        return NextResponse.json({
            success: false,
            message: 'Failed to create order',
            error: error.message
        }, { status: 500 });
    }
}