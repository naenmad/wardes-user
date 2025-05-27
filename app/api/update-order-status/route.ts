import { NextResponse } from 'next/server';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export async function POST(request: Request) {
    try {
        const { orderId, status } = await request.json();

        if (!orderId || !status) {
            return NextResponse.json({ error: 'Order ID and status required' }, { status: 400 });
        }

        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, {
            status: status,
            updatedAt: serverTimestamp()
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error updating order status:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}