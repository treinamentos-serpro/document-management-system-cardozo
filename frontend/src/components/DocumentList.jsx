import DownloadButton from './DownloadButton';

function formatSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentList({ documents, isLoading, error, onRetry }) {
  if (isLoading) return <p className="empty-state">Carregando documentos...</p>;
  if (error) return <div className="empty-state"><p>{error}</p><button type="button" onClick={onRetry}>Tentar novamente</button></div>;
  if (!documents.length) return <p className="empty-state">Nenhum documento enviado ainda.</p>;

  return (
    <div className="document-list">
      {documents.map((document) => (
        <article className="document-row" key={document.id}>
          <div>
            <strong>{document.originalName}</strong>
            <span>{document.owner} · {formatSize(document.size)}</span>
          </div>
          <DownloadButton documentId={document.id} fileName={document.originalName} />
        </article>
      ))}
    </div>
  );
}