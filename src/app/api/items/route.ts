import { NextResponse } from 'next/server';

// Mock data that would normally come from a database
const mockData = [
  { id: 1, title: 'Item 1', description: 'This is the first item' },
  { id: 2, title: 'Item 2', description: 'This is the second item' },
  { id: 3, title: 'Item 3', description: 'This is the third item' },
  { id: 4, title: 'Item 4', description: 'This is the fourth item' },
  { id: 5, title: 'Item 5', description: 'This is the fifth item' },
];

export async function GET() {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return mock data
  return NextResponse.json({
    data: mockData,
    timestamp: new Date().toISOString(),
  });
}