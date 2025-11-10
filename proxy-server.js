const express = require('express');
const https = require('https');
const zlib = require('zlib');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Helper function to set CORS headers
function setCorsHeaders(req, res) {
  const origin = req.get('origin');
  console.log(`Setting CORS headers. Origin header: ${origin}`);
  
  if (origin) {
    // Use exact origin from request
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    // Fallback to * if no origin header
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
}

// Serve static files from Angular build
const distPath = path.join(__dirname, 'dist', 'microburbs-sandbox');
app.use(express.static(distPath));

// Handle OPTIONS requests (CORS preflight)
app.options('/api/*', (req, res) => {
  setCorsHeaders(req, res);
  res.status(204).end();
});

// Manual proxy route to have full control
app.use('/api', async (req, res) => {
  // req.path already has /api removed by Express, so we need to add it back
  // Original URL: /api/cma?id=... -> Target: /report_generator/api/cma?id=...
  const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
  const targetPath = `/report_generator/api${req.path}`;
  const targetUrl = `https://www.microburbs.com.au${targetPath}${queryString}`;
  
  console.log(`\n=== PROXY REQUEST ===`);
  console.log(`Original: ${req.method} ${req.originalUrl || req.url}`);
  console.log(`Path: ${req.path}`);
  console.log(`Target: ${req.method} ${targetUrl}`);
  console.log(`====================\n`);
  
  const options = {
    hostname: 'www.microburbs.com.au',
    port: 443,
    path: `${targetPath}${queryString}`,
    method: req.method,
    headers: {
      'Authorization': 'Bearer test',
      'Content-Type': 'application/json',
      'User-Agent': req.get('user-agent') || 'Proxy-Server'
    }
  };
  
  const proxyReq = https.request(options, (proxyRes) => {
    console.log(`Response: ${proxyRes.statusCode} for ${targetUrl}`);
    console.log(`Content-Length: ${proxyRes.headers['content-length'] || 'unknown'}`);
    console.log(`Content-Encoding: ${proxyRes.headers['content-encoding'] || 'none'}`);
    
    // Set CORS headers FIRST, before any other headers
    setCorsHeaders(req, res);
    
    // Copy status code
    res.statusCode = proxyRes.statusCode;
    
    // Handle content encoding - decompress if needed
    const contentEncoding = proxyRes.headers['content-encoding'];
    let responseStream = proxyRes;
    
    if (contentEncoding === 'gzip') {
      responseStream = proxyRes.pipe(zlib.createGunzip());
      delete proxyRes.headers['content-encoding'];
      delete proxyRes.headers['content-length'];
    } else if (contentEncoding === 'deflate') {
      responseStream = proxyRes.pipe(zlib.createInflate());
      delete proxyRes.headers['content-encoding'];
      delete proxyRes.headers['content-length'];
    } else if (contentEncoding === 'br') {
      responseStream = proxyRes.pipe(zlib.createBrotliDecompress());
      delete proxyRes.headers['content-encoding'];
      delete proxyRes.headers['content-length'];
    }
    
    // Copy headers (excluding encoding headers and CORS headers we handle ourselves)
    Object.keys(proxyRes.headers).forEach(key => {
      const lowerKey = key.toLowerCase();
      // Skip headers we handle manually
      if (
        lowerKey !== 'transfer-encoding' && 
        lowerKey !== 'content-encoding' &&
        lowerKey !== 'content-length' &&
        !lowerKey.startsWith('access-control-') &&
        proxyRes.headers[key] !== undefined
      ) {
        res.setHeader(key, proxyRes.headers[key]);
      }
    });
    
    // Set content type explicitly
    if (proxyRes.headers['content-type']) {
      res.setHeader('Content-Type', proxyRes.headers['content-type']);
    }
    
    // Disable caching to ensure fresh data
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Collect all chunks before sending to ensure complete response
    const chunks = [];
    let totalLength = 0;
    
    responseStream.on('data', (chunk) => {
      chunks.push(chunk);
      totalLength += chunk.length;
    });
    
    responseStream.on('end', () => {
      console.log(`Response completed for ${targetUrl}, total size: ${totalLength} bytes`);
      const buffer = Buffer.concat(chunks);
      res.send(buffer);
    });
    
    responseStream.on('error', (err) => {
      console.error('Response stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Response processing error', message: err.message });
      } else {
        res.end();
      }
    });
    
    // Handle errors on the response object
    res.on('error', (err) => {
      console.error('Response error:', err);
      responseStream.destroy();
    });
  });
  
  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Proxy error', message: err.message });
  });
  
  // Pipe request body if present
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    req.pipe(proxyReq);
  } else {
    proxyReq.end();
  }
});

// Fallback to index.html for Angular routes (SPA)
app.get('*', (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
  console.log(`Proxying /api/* to https://www.microburbs.com.au/report_generator/api/*`);
  console.log(`Serving Angular app from ${distPath}`);
});

