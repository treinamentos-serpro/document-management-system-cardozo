const crypto = require('node:crypto');
const path = require('node:path');
const fileStorage = require('../storage/fileStorage');

const documents = new Map();

function createDocument(file, owner) {
  const storagePath = fileStorage.isInsideStorage(file.path)
    ? path.resolve(file.path)
    : null;
  if (!storagePath) throw new Error('Caminho de armazenamento inválido.');

  const originalName = String(file.originalname || '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .slice(0, 255);
  if (!originalName) throw new Error('Nome de arquivo inválido.');

  const document = {
    id: crypto.randomUUID(),
    originalName,
    storedName: file.filename,
    storagePath,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
    mimeType: file.mimetype || 'application/octet-stream',
  };

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

function remove(document) {
  documents.delete(document.id);
  return fileStorage.removeFile(document.storagePath);
}

function toPublicDocument(document) {
  const { storedName, storagePath, ...publicDocument } = document;
  return publicDocument;
}

module.exports = {
  assertDocumentFile: fileStorage.assertRegularFile,
  createDocument,
  ensureStorageDirectory: fileStorage.ensureStorageDirectory,
  findById,
  list,
  remove,
  removeFile: fileStorage.removeFile,
  storageDirectory: fileStorage.storageDirectory,
  toPublicDocument,
};
