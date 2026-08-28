/**
 * GitHub Push Script — uploads ConnectServe to GitHub via REST API
 * Usage: node pushToGithub.js <github_token> <owner/repo>
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const TOKEN = process.argv[2];
const REPO = process.argv[3]; // e.g. ritvikk-codes/ConnectServe

if (!TOKEN || !REPO) {
  console.error('Usage: node pushToGithub.js <github_personal_access_token> <owner/repo>');
  process.exit(1);
}

const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.system_generated', 'scratch', '__pycache__']);
const IGNORE_FILES = new Set(['.env', 'testMongoAtlas.js', 'testCloudinary.js', 'testApi.js']);
const IGNORE_EXT = new Set(['.exe', '.dll', '.zip', '.tar', '.gz', '.bin', '.jpg.tmp']);
const ROOT = path.resolve(__dirname);

const apiRequest = (method, endpoint, body) => {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: 'api.github.com',
      path: endpoint,
      method,
      headers: {
        'Authorization': `token ${TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'ConnectServe-Pusher/1.0',
        'Accept': 'application/vnd.github.v3+json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
};

const getAllFiles = (dir, baseDir = dir) => {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    if (IGNORE_FILES.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      results.push(...getAllFiles(fullPath, baseDir));
    } else {
      const ext = path.extname(entry.name);
      if (IGNORE_EXT.has(ext)) continue;
      results.push({ fullPath, relPath });
    }
  }
  return results;
};

const pushFile = async (relPath, fullPath) => {
  const content = fs.readFileSync(fullPath);
  const base64Content = content.toString('base64');

  // Check if file already exists to get its SHA
  const existing = await apiRequest('GET', `/repos/${REPO}/contents/${relPath}`);
  const sha = existing.status === 200 ? existing.data.sha : undefined;

  const payload = {
    message: `feat: add ${relPath}`,
    content: base64Content,
    ...(sha ? { sha } : {}),
  };

  const res = await apiRequest('PUT', `/repos/${REPO}/contents/${relPath}`, payload);
  if (res.status === 201 || res.status === 200) {
    console.log(`  ✓ ${relPath}`);
    return true;
  } else {
    console.warn(`  ✗ ${relPath} [${res.status}] ${res.data?.message || ''}`);
    return false;
  }
};

const main = async () => {
  console.log(`\n📦 Pushing ConnectServe to https://github.com/${REPO}\n`);

  // Verify token works
  const me = await apiRequest('GET', '/user');
  if (me.status !== 200) {
    console.error('❌ Invalid GitHub token. Please create a Personal Access Token with repo scope.');
    process.exit(1);
  }
  console.log(`✓ Authenticated as: ${me.data.login}`);

  const files = getAllFiles(ROOT);
  console.log(`\n📁 Found ${files.length} files to push...\n`);

  let success = 0;
  let failed = 0;
  for (const file of files) {
    const ok = await pushFile(file.relPath, file.fullPath);
    if (ok) success++;
    else failed++;
  }

  console.log(`\n✅ Upload complete! ${success} files uploaded, ${failed} failed.`);
  console.log(`\n🔗 GitHub Repository: https://github.com/${REPO}\n`);
};

main().catch(err => {
  console.error('[Fatal Error]', err.message);
  process.exit(1);
});
