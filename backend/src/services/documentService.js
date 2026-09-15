const documentRepository = require('../repositories/documentRepository');

async function createDocument(file, owner) {
  try {
    await documentRepository.ensureStorageDirectory();
    return documentRepository.toPublicDocument(
      documentRepository.createDocument(file, owner),
    );
  } catch (error) {
    await documentRepository.removeFile(file.path).catch(() => {});
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
  await documentRepository.assertDocumentFile(document.storagePath);
}

async function discardUploadedFile(filePath) {
  await documentRepository.removeFile(filePath);
}

module.exports = {
  createDocument,
  discardUploadedFile,
  ensureDocumentFile,
  getDocumentForDownload,
  listDocuments,
};
