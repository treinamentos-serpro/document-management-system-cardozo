const express = require('express');
const multer = require('multer');
const crypto = require('node:crypto');
const path = require('node:path');
const documentController = require('../controllers/documentController');
const fileStorage = require('../storage/fileStorage');

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, callback) => {
      fileStorage.ensureStorageDirectory()
        .then(() => callback(null, fileStorage.storageDirectory))
        .catch(callback);
    },
    filename: (req, file, callback) => {
      const extension = path.extname(file.originalname).slice(0, 20).replace(/[^a-zA-Z0-9.]/g, '');
      callback(null, `${crypto.randomUUID()}${extension}`);
    },
  }),
  limits: {
    fileSize: fileStorage.getMaxFileSize(),
    fields: 2,
    fieldSize: 100,
    files: 1,
  },
});

const router = express.Router();

router.post('/upload', upload.single('file'), documentController.upload);
router.get('/documents', documentController.list);
router.get('/documents/:id/download', documentController.download);

module.exports = router;
