import { NextResponse } from 'next/server';
import midtransClient from 'midtrans-client';
import { createOrder } from '@/lib/firebase/orders'; // Kembali ke fungsi createOrder biasa

const snap = new midtransClient.Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    serverKey: process.env.MIDTRANS_SERVER_KEY || '',
});

export async function POST(request: Request) {
    try {
        const orderData = await request.json();
        console.log("Received orderData in API:", JSON.stringify(orderData, null, 2));

        const {
            items: cartItemsFromFrontend,
            customer: customerFromFrontend,
            notes,
            paymentMethod,
            totalAmount: frontendTotalAmount,
            tableNumber,
            languageUsed: languageFromFrontend
        } = orderData;

        if (!cartItemsFromFrontend || !Array.isArray(cartItemsFromFrontend) || cartItemsFromFrontend.length === 0 ||
            !customerFromFrontend || !paymentMethod || frontendTotalAmount === undefined) {
            console.error("Missing required fields in orderData:", orderData);
            return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
        }

        const orderId = 'ORD-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

        // Calculate totals
        let subtotal = 0;
        for (const item of cartItemsFromFrontend) {
            const price = Number(item.price);
            const quantity = Number(item.quantity);
            if (isNaN(price) || isNaN(quantity)) {
                console.error("Invalid price or quantity for item:", item);
                return NextResponse.json({ success: false, message: "Invalid item data (price/quantity)." }, { status: 400 });
            }
            subtotal += price * quantity;
        }

        const tax = Math.round(subtotal * 0.11);
        const serviceFee = 2000;
        const backendCalculatedGrossAmount = subtotal + tax + serviceFee;

        // Validate total amount
        if (Math.round(frontendTotalAmount) !== Math.round(backendCalculatedGrossAmount)) {
            console.error(
                `Total amount mismatch! Frontend total: ${frontendTotalAmount}, Backend calculated: ${backendCalculatedGrossAmount}.`
            );
            return NextResponse.json({
                success: false,
                message: `Total amount mismatch. Please refresh and try again.`
            }, { status: 400 });
        }

        // Format items for createOrder
        const itemsForFirestore = cartItemsFromFrontend.map((item: any) => ({
            menuItemId: String(item.id),
            name: String(item.name),
            price: Number(item.price),
            quantity: Number(item.quantity),
            subtotal: Number(item.price) * Number(item.quantity),
            spicyLevel: item.spicyLevel || null,
            iceLevel: item.iceLevel || null,
        }));

        // Format customer for createOrder
        const customerForFirestore = {
            name: customerFromFrontend.name || 'Customer',
            phone: customerFromFrontend.phone || '123456789',
            address: customerFromFrontend.address || 'Dine-in',
            tableNumber: tableNumber || 'unknown',
        };

        if (paymentMethod === 'cash') {
            console.log('Processing cash payment locally for orderId:', orderId);
            try {
                await createOrder(
                    orderId,
                    itemsForFirestore,
                    customerForFirestore,
                    notes,
                    paymentMethod,
                    null, // paymentToken untuk cash
                    backendCalculatedGrossAmount, // grandTotal
                    languageFromFrontend || 'id'
                );
                console.log("Cash order saved to Firestore successfully for orderId:", orderId);
                return NextResponse.json({
                    success: true,
                    orderId: orderId,
                    message: 'Cash payment recorded successfully',
                    tableNumber: customerForFirestore.tableNumber
                });
            } catch (error: any) {
                console.error(`Failed to save cash order ${orderId} to Firestore:`, error);
                return NextResponse.json({
                    success: false,
                    message: 'Failed to record order',
                    error: error.message
                }, { status: 500 });
            }
        }

        // For online payments with Midtrans
        const itemDetailsForMidtrans = [
            ...cartItemsFromFrontend.map((item: any) => ({
                id: String(item.id),
                name: String(item.name),
                price: Number(item.price),
                quantity: Number(item.quantity)
            })),
            { id: 'TAX-11', name: 'Tax (11%)', price: tax, quantity: 1 },
            { id: 'SERVICE-FEE', name: 'Service Fee', price: serviceFee, quantity: 1 }
        ];

        const transactionParams = {
            transaction_details: {
                order_id: orderId,
                gross_amount: backendCalculatedGrossAmount
            },
            customer_details: {
                first_name: customerFromFrontend.name?.split(' ')[0] || 'Customer',
                last_name: customerFromFrontend.name?.split(' ').slice(1).join(' ') || '',
                email: customerFromFrontend.email || `customer-${Date.now()}@example.com`,
                phone: customerFromFrontend.phone,
            },
            item_details: itemDetailsForMidtrans,
            enabled_payments: getEnabledPayments(paymentMethod),
            custom_field1: customerForFirestore.tableNumber || 'no-table',
            // Tambahkan konfigurasi yang tepat untuk popup mode
            callbacks: {
                finish: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment-finish?order_id=${orderId}`,
                error: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment-error?order_id=${orderId}`,
                pending: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment-pending?order_id=${orderId}`
            },
            // Pastikan menggunakan popup mode
            credit_card: {
                secure: true
            }
        };

        console.log("Midtrans transactionParams:", JSON.stringify(transactionParams, null, 2));

        const transaction = await snap.createTransaction(transactionParams);
        console.log("Midtrans transaction response:", transaction);

        await createOrder(
            orderId,
            itemsForFirestore,
            customerForFirestore,
            notes,
            paymentMethod,
            transaction.token,
            backendCalculatedGrossAmount, // grandTotal
            languageFromFrontend || 'id'
        );
        console.log(`Order ${orderId} with Midtrans token saved to Firestore.`);

        return NextResponse.json({
            success: true,
            token: transaction.token,
            orderId: orderId,
            redirectUrl: transaction.redirect_url,
            tableNumber: customerForFirestore.tableNumber
        });

    } catch (error: any) {
        console.error('Error in /api/create-payment POST:', error);
        let errorMessage = 'Failed to create payment';
        let errorDetails = error.toString();

        if (error.ApiResponse) {
            console.error('Midtrans API Response Error:', error.ApiResponse);
            errorMessage = error.ApiResponse.error_messages ? error.ApiResponse.error_messages.join(', ') : 'Midtrans API error';
            errorDetails = JSON.stringify(error.ApiResponse);
        } else if (error.message) {
            errorMessage = error.message;
        }

        return NextResponse.json(
            { success: false, message: errorMessage, errorDetails: errorDetails },
            { status: error.httpStatusCode || 500 }
        );
    }
}

function getEnabledPayments(paymentMethod: string): string[] {
    switch (paymentMethod) {
        case 'bca_va':
        case 'bca':
            return ['bca_va'];
        case 'bni_va':
        case 'bni':
            return ['bni_va'];
        case 'bri_va':
        case 'bri':
            return ['bri_va'];
        case 'mandiri_va':
        case 'mandiri':
            return ['echannel'];
        case 'cimb_va':
        case 'cimb':
            return ['cimb_va'];
        case 'permata_va':
        case 'permata':
            return ['permata_va'];
        case 'gopay':
            return ['gopay'];
        case 'qris':
            return ['qris', 'gopay'];
        case 'shopeepay':
            return ['shopeepay'];
        default:
            console.warn(`Unknown payment method for Midtrans: ${paymentMethod}, falling back to gopay, qris`);
            return ['gopay', 'qris'];
    }
}