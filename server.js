const http = require('http');
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

let serviceAccount = null;
try {
  serviceAccount = require('./serviceAccountKey.json');
} catch (_) {
  serviceAccount = null;
}

function ensureAdminInitialized() {
  if (admin.apps.length) return;
  const options = {};
  if (serviceAccount) {
    console.log('Using serviceAccount for Firebase Admin, project:', serviceAccount.project_id);
    options.credential = admin.credential.cert(serviceAccount);
    if (serviceAccount.project_id) options.projectId = serviceAccount.project_id;
  } else {
    console.log('Using applicationDefault credentials for Firebase Admin');
    options.credential = admin.credential.applicationDefault();
    options.projectId = 'nw-checkin-all';
  }
  admin.initializeApp(options);
}

function sendRedirect(res, targetUrl) {
  res.writeHead(302, {
    Location: targetUrl,
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
    'Surrogate-Control': 'no-store'
  });
  res.end();
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'POST' && url.pathname === '/api/reset-password-default') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) req.connection.destroy();
    });
    req.on('end', async () => {
      try {
        const parsed = body ? JSON.parse(body) : {};
        const email = (parsed.email || '').toString().trim();
        if (!email) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '缺少 email' }));
          return;
        }
        try {
          ensureAdminInitialized();
        } catch (initError) {
          console.error('初始化 Firebase Admin 失敗:', initError);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '伺服器尚未設定管理憑證，無法重設密碼。' }));
          return;
        }
        try {
          const userRecord = await admin.auth().getUserByEmail(email);
          await admin.auth().updateUser(userRecord.uid, { password: '123456' });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } catch (err) {
          console.error('重設密碼失敗:', err);
          const msg = err && err.code === 'auth/user-not-found'
            ? '找不到對應的帳號。'
            : '重設密碼失敗，請稍後再試。';
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: msg }));
        }
      } catch (err) {
        console.error('解析請求失敗:', err);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '無效的請求格式' }));
      }
    });
    return;
  }

  // Pretty URL rewrites
  // /community -> /index.html?mode=community
  // /community/:id -> /index.html?mode=community&communityId=:id
  if (url.pathname === '/community' || url.pathname.startsWith('/community/')) {
    const parts = url.pathname.split('/').filter(Boolean); // [ 'community', ':id' ]
    const id = parts[1] ? decodeURIComponent(parts[1]) : null;
    const params = new URLSearchParams(url.search);
    params.set('mode', 'community');
    if (id) params.set('communityId', id);
    // 移除舊版強制導覽的參數，改為儀表板預設
    params.delete('goto');
    params.delete('sub');
    return sendRedirect(res, '/index.html?' + params.toString());
  }

  let filePath = '.' + url.pathname + (url.search || '');
  if (url.pathname === '/' || url.pathname === '') {
    return sendRedirect(res, '/index.html' + (url.search || ''));
  }

  // Strip query for filesystem read and for extension detection
  const cleanFilePath = filePath.split('?')[0];
  const extname = String(path.extname(cleanFilePath)).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
  };

  const contentType = mimeTypes[extname] || 'application/octet-stream';
  fs.readFile(cleanFilePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        // SPA fallback: serve index.html for unknown paths
        fs.readFile('./index.html', (err2, indexContent) => {
          if (err2) {
            res.writeHead(404);
            res.end('File not found');
          } else {
            res.writeHead(200, {
              'Content-Type': 'text/html',
              'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
              'Surrogate-Control': 'no-store'
            });
            res.end(indexContent, 'utf-8');
          }
        });
      } else {
        res.writeHead(500);
        res.end('Server error: ' + error.code);
      }
    } else {
      // Disable caching to ensure latest files are served
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      });
      res.end(content, 'utf-8');
    }
  });
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
