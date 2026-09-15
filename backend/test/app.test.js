const { test, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const fs = require('node:fs/promises');
const app = require('../src/app');
const documentRepository = require('../src/repositories/documentRepository');

let server;
let baseUrl;

before(async () => {
  await fs.rm(documentRepository.storageDirectory, { recursive: true, force: true });
  await documentRepository.ensureStorageDirectory();
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await fs.rm(documentRepository.storageDirectory, { recursive: true, force: true });
});

async function request(pathname, options) {
  const response = await fetch(`${baseUrl}${pathname}`, options);
  return { response, body: await response.arrayBuffer() };
}

test('o app expõe health check e fluxo de documento', async () => {
  assert.strictEqual((await request('/health')).response.status, 200);

  const form = new FormData();
  form.append('owner', 'user-123');
  form.append('file', new Blob(['conteudo'], { type: 'text/plain' }), 'nota.txt');
  const upload = await request('/upload', { method: 'POST', body: form });
  assert.strictEqual(upload.response.status, 201);
  const document = JSON.parse(Buffer.from(upload.body).toString());
  assert.strictEqual(document.originalName, 'nota.txt');
  assert.strictEqual(document.owner, 'user-123');
  assert.ok(!('storagePath' in document));

  const list = await request('/documents');
  assert.strictEqual(list.response.status, 200);
  assert.strictEqual(JSON.parse(Buffer.from(list.body).toString()).documents.length, 1);

  const download = await request(`/documents/${document.id}/download`);
  assert.strictEqual(download.response.status, 200);
  assert.strictEqual(download.response.headers.get('content-type'), 'text/plain');
  assert.strictEqual(Buffer.from(download.body).toString(), 'conteudo');
});

test('rejeita proprietário ausente ou maior que o limite', async () => {
  const form = new FormData();
  form.append('file', new Blob(['x']), 'x.txt');
  const missingOwner = await request('/upload', { method: 'POST', body: form });
  assert.strictEqual(missingOwner.response.status, 400);

  const oversizedOwner = new FormData();
  oversizedOwner.append('owner', 'x'.repeat(101));
  oversizedOwner.append('file', new Blob(['x']), 'x.txt');
  const result = await request('/upload', { method: 'POST', body: oversizedOwner });
  assert.strictEqual(result.response.status, 400);
});

test('retorna 404 para documento inexistente ou arquivo ausente', async () => {
  assert.strictEqual((await request('/documents/not-found/download')).response.status, 404);
});
