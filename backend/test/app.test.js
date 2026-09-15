const { test, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const app = require('../src/app');
const documentRepository = require('../src/repositories/documentRepository');

let server;
let baseUrl;

before(async () => {
  await fs.rm(documentRepository.storageDirectory, { recursive: true, force: true });
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

// Teste de fumaça do seed: garante que o app Express foi exportado.
// Novos testes serão adicionados durante os Steps 2, 6 e 7 com auxílio do Copilot.
test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('faz upload, lista e baixa um documento', async () => {
  const form = new FormData();
  form.append('owner', 'user-123');
  form.append('file', new Blob(['conteudo do documento'], { type: 'text/plain' }), 'nota.txt');

  const uploadResult = await request('/upload', { method: 'POST', body: form });
  assert.strictEqual(uploadResult.response.status, 201);
  const document = JSON.parse(Buffer.from(uploadResult.body).toString());
  assert.strictEqual(document.originalName, 'nota.txt');
  assert.strictEqual(document.owner, 'user-123');

  const listResult = await request('/documents');
  assert.strictEqual(listResult.response.status, 200);
  assert.strictEqual(JSON.parse(Buffer.from(listResult.body).toString()).documents.length, 1);

  const downloadResult = await request(`/documents/${document.id}/download`);
  assert.strictEqual(downloadResult.response.status, 200);
  assert.strictEqual(Buffer.from(downloadResult.body).toString(), 'conteudo do documento');
});

test('rejeita upload sem arquivo ou proprietário', async () => {
  const form = new FormData();
  form.append('owner', 'user-123');
  const missingFile = await request('/upload', { method: 'POST', body: form });
  assert.strictEqual(missingFile.response.status, 400);

  const fileOnly = new FormData();
  fileOnly.append('file', new Blob(['x']), 'x.txt');
  const missingOwner = await request('/upload', { method: 'POST', body: fileOnly });
  assert.strictEqual(missingOwner.response.status, 400);
});

test('retorna 404 para documento inexistente', async () => {
  const result = await request('/documents/not-found/download');
  assert.strictEqual(result.response.status, 404);
});
