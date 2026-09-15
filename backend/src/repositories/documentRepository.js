const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

const storageDirectory = path.resolve(
  process.env.STORAGE_DIR || path.join(__dirname, '../../storage'),
);
const documents = new Map();

async function ensureStorageDirectory() {
  await fs.mkdir(storageDirectory, { recursive: true });
}

function createDocument(file, owner) {
  const document = {
    id: crypto.randomUUID(),
    originalName: file.originalname,
    storedName: file.filename,
    storagePath: path.resolve(file.path),
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
    mimeType: file.mimetype,
  };

  if (!document.storagePath.startsWith(`${storageDirectory}${path.sep}`)) {
    throw new Error('Caminho de armazenamento inválido.');
  }

  documents.set(document.id, document);
  return document;
}

function findById(id) {
  return documents.get(id);
}

function list() {
  return [...documents.values()].sort((first, second) => (
    second.uploadedAt.localeCompare(first.uploadedAt)
  ));
}

async function remove(document) {
  documents.delete(document.id);
  await fs.rm(document.storagePath, { force: true });
}

function toPublicDocument(document) {
  const { storedName, storagePath, ...publicDocument } = document;
  return publicDocument;
}

module.exports = {
  ensureStorageDirectory,
  createDocument,
  findById,
  list,
  remove,
  storageDirectory,
  toPublicDocument,
};