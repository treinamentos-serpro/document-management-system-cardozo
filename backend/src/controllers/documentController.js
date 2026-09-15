const documentService = require('../services/documentService');

async function upload(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'O arquivo é obrigatório.' });

    const owner = typeof req.body.owner === 'string' ? req.body.owner.trim() : '';
    if (!owner || owner.length > 100) {
      await documentService.discardUploadedFile(req.file.path);
      return res.status(400).json({ error: 'O proprietário é obrigatório e deve ter no máximo 100 caracteres.' });
    }

    const document = await documentService.createDocument(req.file, owner);
    return res.status(201).json(document);
  } catch (error) {
    return next(error);
  }
}

function list(req, res, next) {
  try {
    return res.json({ documents: documentService.listDocuments() });
  } catch (error) {
    return next(error);
  }
}

async function download(req, res, next) {
  try {
    const document = documentService.getDocumentForDownload(req.params.id);
    await documentService.ensureDocumentFile(document);
    return res.download(document.storagePath, document.originalName, {
      headers: {
        'Content-Type': document.mimeType,
        'X-Content-Type-Options': 'nosniff',
      },
    }, (error) => {
      if (error && !res.headersSent) next(error);
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { download, list, upload };
