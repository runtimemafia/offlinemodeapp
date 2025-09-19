import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ invoiceid: string }> }) {
  try {
    // Resolve the params promise
    const { invoiceid } = await params;
    
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Generate a random string
    const randomString = Math.random().toString(36).substring(2, 15) + 
                         Math.random().toString(36).substring(2, 15);
    
    // Return the invoice data
    return NextResponse.json({
      id: invoiceid,
      data: randomString,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to fetch invoice',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}