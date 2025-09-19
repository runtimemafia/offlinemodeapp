import { promises as fs } from 'fs';
import { join } from 'path';

// This script generates a list of all Next.js build assets to cache for offline use
async function generateAssetList() {
  const assetList = [
    '/',
    '/offline',
    '/docs',
    '/favicon.ico',
    '/manifest',
    '/next.svg',
    '/vercel.svg',
    '/file.svg',
    '/window.svg',
    '/globe.svg',
  ];

  try {
    // Read the .next/static directory to find all build assets
    const staticDir = join(process.cwd(), '.next', 'static');
    
    // Function to recursively find all files in a directory
    async function getFiles(dir) {
      const dirents = await fs.readdir(dir, { withFileTypes: true });
      const files = await Promise.all(dirents.map((dirent) => {
        const res = join(dir, dirent.name);
        return dirent.isDirectory() ? getFiles(res) : res;
      }));
      return Array.prototype.concat(...files);
    }

    // Get all files in the static directory
    const files = await getFiles(staticDir);
    
    // Add relevant files to asset list
    files.forEach(file => {
      // Only include specific file types
      if (file.endsWith('.js') || file.endsWith('.css') || file.endsWith('.woff2')) {
        // Convert absolute path to relative path
        const relativePath = file.replace(join(process.cwd(), '.next'), '/_next');
        assetList.push(relativePath);
      }
    });

    // Write the asset list to a file for the service worker to use
    const outputPath = join(process.cwd(), 'public', 'asset-list.js');
    const content = `// Auto-generated asset list for offline caching
const ASSET_LIST = ${JSON.stringify(assetList, null, 2)};
`;
    
    await fs.writeFile(outputPath, content);
    console.log('Asset list generated successfully!');
    console.log(`Found ${assetList.length} assets to cache`);
  } catch (error) {
    console.error('Error generating asset list:', error);
  }
}

generateAssetList();