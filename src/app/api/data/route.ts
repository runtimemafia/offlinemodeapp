import { NextResponse } from 'next/server';

// In-memory storage for demo purposes
const storedData = [
  { id: 1, title: 'First Item', description: 'This is the first item in our offline capable app' },
  { id: 2, title: 'Second Item', description: 'This is the second item in our offline capable app' },
];

export async function GET() {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return NextResponse.json({
    data: storedData,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  const newItem = await request.json();
  
  // Add new item with incremented ID
  const item = {
    id: storedData.length + 1,
    ...newItem
  };
  
  storedData.push(item);
  
  return NextResponse.json({
    success: true,
    data: item
  });
}