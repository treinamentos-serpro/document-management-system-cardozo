const express = require('express');
const documentRoutes = require('./routes/documentRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(documentRoutes);

app.use((error, req, res, next) => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'O arquivo excede o tamanho permitido.' });
  }

  if (error.name === 'MulterError') {
    return res.status(400).json({ error: 'Não foi possível processar o upload.' });
  }

  if (!error.statusCode) {
    console.error(error);
  }
  return res.status(error.statusCode || 500).json({
    error: error.statusCode ? error.message : 'Erro interno do servidor.',
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

module.exports = app;
