import { NextResponse } from 'next/server';
import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import midtransClient from 'midtrans-client';

const snap = new midtransClient.Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    serverKey: process.env.MIDTRANS_SERVER_KEY || '',
});

export async function POST(request: Request) {
    try {
        const { orderId } = await request.json();

        if (!orderId) {
            return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
        }

        // Check status dari Midtrans
        const statusResponse = await snap.transaction.status(orderId);
        console.log('Payment status from Midtrans:', statusResponse);

        const { transaction_status, fraud_status } = statusResponse;

        // Tentukan status order
        let orderStatus = 'pending_payment';

        if (transaction_status === 'capture' || transaction_status === 'settlement') {
            if (fraud_status === 'accept' || !fraud_status) {
                orderStatus = 'confirmed';
            }
        } else if (transaction_status === 'deny' || transaction_status === 'cancel' || transaction_status === 'expire') {
            orderStatus = 'cancelled';
        }

        // Update status di Firestore
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, {
            status: orderStatus,
            updatedAt: serverTimestamp(),
            midtransResponse: statusResponse
        });

        return NextResponse.json({
            success: true,
            status: orderStatus,
            transactionStatus: transaction_status
        });

    } catch (error: any) {
        console.error('Error checking payment status:', error);
        return NextResponse.json({
            error: error.message || 'Failed to check payment status'
        }, { status: 500 });
    }
}