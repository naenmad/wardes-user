import { NextResponse } from 'next/server';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export async function POST(request: Request) {
    try {
        const { orderId, status } = await request.json();

        if (!orderId || !status) {
            return NextResponse.json({ error: 'Order ID and status required' }, { status: 400 });
        }

        console.log(`Updating order ${orderId} status to: ${status}`);

        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, {
            status: status,
            updatedAt: serverTimestamp()
        });

        console.log(`Order ${orderId} status successfully updated to: ${status}`);

        return NextResponse.json({
            success: true,
            orderId: orderId,
            newStatus: status
        });
    } catch (error: any) {
        console.error('Error updating order status:', error);
        return NextResponse.json({
            error: error.message || 'Failed to update order status'
        }, { status: 500 });
    }
}