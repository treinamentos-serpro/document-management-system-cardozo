import { useState } from 'react';
import { uploadDocument } from '../services/documentService';

export default function UploadComponent({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [owner, setOwner] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isUploading, setIsUploading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file || !owner.trim()) {
      setStatus({ type: 'error', message: 'Informe o proprietário e selecione um arquivo.' });
      return;
    }

    setIsUploading(true);
    setStatus({ type: '', message: '' });
    try {
      await uploadDocument(file, owner.trim());
      setFile(null);
      event.target.reset();
      setStatus({ type: 'success', message: 'Documento enviado com sucesso.' });
      onUploaded();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <label htmlFor="owner">Proprietário</label>
      <input id="owner" value={owner} onChange={(event) => setOwner(event.target.value)} placeholder="Ex.: user-123" />
      <label htmlFor="file">Documento</label>
      <input id="file" type="file" onChange={(event) => setFile(event.target.files[0] || null)} />
      <button type="submit" disabled={isUploading}>{isUploading ? 'Enviando...' : 'Enviar documento'}</button>
      {status.message && <p className={`status ${status.type}`}>{status.message}</p>}
    </form>
  );
}