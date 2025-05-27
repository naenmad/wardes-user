import { NextResponse } from 'next/server';
import { createOrder } from '../../../lib/firebase/orders';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { tableNumber, items, notes, customerName, languageUsed } = body;

        const orderId = await createOrder(
            tableNumber,
            items,
            notes,
            customerName,
            languageUsed
        );

        return NextResponse.json({
            success: true,
            orderId
        });
    } catch (error) {
        console.error('Error creating order:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to create order' },
            { status: 500 }
        );
    }
}