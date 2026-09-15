const fs = require('node:fs/promises');
const path = require('node:path');

const storageDirectory = path.resolve(
  process.env.STORAGE_DIR || path.join(__dirname, '../../storage'),
);

function getMaxFileSize() {
  const configuredSize = Number(process.env.MAX_FILE_SIZE || 10 * 1024 * 1024);
  if (!Number.isSafeInteger(configuredSize) || configuredSize <= 0) {
    throw new Error('MAX_FILE_SIZE deve ser um inteiro positivo.');
  }
  return configuredSize;
}

function isInsideStorage(filePath) {
  const relativePath = path.relative(storageDirectory, path.resolve(filePath));
  return relativePath && !relativePath.startsWith(`..${path.sep}`) && !path.isAbsolute(relativePath);
}

async function ensureStorageDirectory() {
  await fs.mkdir(storageDirectory, { recursive: true });
}

async function removeFile(filePath) {
  if (!isInsideStorage(filePath)) {
    throw new Error('Caminho de armazenamento inválido.');
  }
  await fs.rm(filePath, { force: true });
}

async function assertRegularFile(filePath) {
  try {
    const stats = await fs.stat(filePath);
    if (!stats.isFile()) throw new Error('O caminho não aponta para um arquivo.');
  } catch (error) {
    if (error.code === 'ENOENT' || error.message === 'O caminho não aponta para um arquivo.') {
      const notFoundError = new Error('Arquivo do documento não encontrado.');
      notFoundError.statusCode = 404;
      throw notFoundError;
    }
    throw error;
  }
}

module.exports = {
  assertRegularFile,
  ensureStorageDirectory,
  getMaxFileSize,
  isInsideStorage,
  removeFile,
  storageDirectory,
};
