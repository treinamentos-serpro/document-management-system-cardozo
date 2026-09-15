const express = require('express');
const multer = require('multer');
const crypto = require('node:crypto');
const path = require('node:path');
const fs = require('node:fs');
const documentController = require('../controllers/documentController');
const documentRepository = require('../repositories/documentRepository');

fs.mkdirSync(documentRepository.storageDirectory, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, callback) => {
      fs.mkdir(documentRepository.storageDirectory, { recursive: true }, (error) => {
        callback(error, documentRepository.storageDirectory);
      });
    },
    filename: (req, file, callback) => {
      callback(null, `${crypto.randomUUID()}${path.extname(file.originalname)}`);
    },
  }),
  limits: {
    fileSize: Number(process.env.MAX_FILE_SIZE || 10 * 1024 * 1024),
  },
});

const router = express.Router();

router.post('/upload', upload.single('file'), documentController.upload);
router.get('/documents', documentController.list);
router.get('/documents/:id/download', documentController.download);

module.exports = router;