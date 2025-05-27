import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        hasServerKey: !!process.env.MIDTRANS_SERVER_KEY,
        serverKeyPrefix: process.env.MIDTRANS_SERVER_KEY?.substring(0, 10) + '...',
        isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true'
    });
}