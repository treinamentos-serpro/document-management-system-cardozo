import { useEffect, useState } from 'react';
import './App.css';
import DocumentList from './components/DocumentList';
import UploadComponent from './components/UploadComponent';
import { listDocuments } from './services/documentService';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadDocuments() {
    setIsLoading(true);
    setError('');
    try {
      setDocuments(await listDocuments());
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadDocuments();
  }, []);

  return (
    <main>
      <div className="shell">
        <span className="eyebrow">Arquivo local · DMS</span>
        <h1>Seus documentos, no lugar certo.</h1>
        <p className="intro">Envie, organize e baixe arquivos com uma visão clara do que está guardado na aplicação.</p>
        <section className="workspace">
          <div className="panel">
            <h2>Novo documento</h2>
            <UploadComponent onUploaded={loadDocuments} />
          </div>
          <div className="panel">
            <h2>Documentos enviados</h2>
            <DocumentList documents={documents} isLoading={isLoading} error={error} onRetry={loadDocuments} />
          </div>
        </section>
      </div>
    </main>
  );
}
