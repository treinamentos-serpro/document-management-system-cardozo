const fs = require('node:fs/promises');
const documentRepository = require('../repositories/documentRepository');

async function createDocument(file, owner) {
  await documentRepository.ensureStorageDirectory();

  try {
    return documentRepository.toPublicDocument(
      documentRepository.createDocument(file, owner),
    );
  } catch (error) {
    await documentRepository.remove({ id: '', storagePath: file.path });
    throw error;
  }
}

function listDocuments() {
  return documentRepository.list().map(documentRepository.toPublicDocument);
}

function getDocumentForDownload(id) {
  const document = documentRepository.findById(id);

  if (!document) {
    const error = new Error('Documento não encontrado.');
    error.statusCode = 404;
    throw error;
  }

  return document;
}

async function ensureDocumentFile(document) {
  try {
    await fs.access(document.storagePath);
  } catch (error) {
    const notFoundError = new Error('Arquivo do documento não encontrado.');
    notFoundError.statusCode = 404;
    throw notFoundError;
  }
}

async function discardUploadedFile(filePath) {
  await fs.rm(filePath, { force: true });
}

module.exports = {
  createDocument,
  listDocuments,
  getDocumentForDownload,
  ensureDocumentFile,
  discardUploadedFile,
};