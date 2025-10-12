import { handleAPIRequest } from "./api";
import { handleMockAPIRequest } from "./mock-api";

function getContentType(pathname: string): string {
  if (pathname.endsWith('.css')) return 'text/css';
  if (pathname.endsWith('.js')) return 'application/javascript';
  if (pathname.endsWith('.ico')) return 'image/x-icon';
  if (pathname.endsWith('.png')) return 'image/png';
  if (pathname.endsWith('.jpg') || pathname.endsWith('.jpeg')) return 'image/jpeg';
  if (pathname.endsWith('.svg')) return 'image/svg+xml';
  return 'application/octet-stream';
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle API routes
    if (url.pathname.startsWith('/api/')) {
      // Check if we have Cloudflare services available
      if (env && env.DUCKLYTICS_PROD && env.EVENT_STORAGE) {
        return handleAPIRequest(request, env.DUCKLYTICS_PROD, env.EVENT_STORAGE, env.JWT_SECRET);
      } else {
        // Use mock API for local development
        return handleMockAPIRequest(request);
      }
    }
    
    // Serve static assets from R2
    if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/build/')) {
      try {
        const key = url.pathname.startsWith('/build/') 
          ? url.pathname.substring(1) // Remove leading slash
          : `build/client${url.pathname}`;
        
        const object = await env.EVENT_STORAGE.get(key);
        if (object) {
          const contentType = getContentType(url.pathname);
          return new Response(object.body, {
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=31536000', // 1 year cache
            },
          });
        }
      } catch (error) {
        console.error('Error serving static asset:', error);
      }
      
      return new Response('Asset not found', { status: 404 });
    }
    
    // Serve the main React Router application
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Event Check-in System</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/build/client/assets/root-Bhh87Ypv.css">
</head>
<body>
    <div id="root"></div>
    <script type="module" src="/build/client/assets/entry.client-Cwmah2k6.js"></script>
</body>
</html>`;
    
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache',
      },
    });
  },
} satisfies ExportedHandler<Env>;

