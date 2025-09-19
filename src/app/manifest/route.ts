import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

export async function GET() {
  const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');
  const manifestContent = await fs.readFile(manifestPath, 'utf8');
  
  return new NextResponse(manifestContent, {
    headers: {
      'Content-Type': 'application/manifest+json',
    },
  });
}