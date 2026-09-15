const API_PREFIX = '/api';

async function parseResponse(response) {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || 'Não foi possível concluir a operação.');
  }

  return response.json();
}

export async function listDocuments() {
  const response = await fetch(`${API_PREFIX}/documents`);
  const body = await parseResponse(response);
  return body.documents;
}

export async function uploadDocument(file, owner) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('owner', owner);

  const response = await fetch(`${API_PREFIX}/upload`, { method: 'POST', body: formData });
  return parseResponse(response);
}

export async function downloadDocument(documentId) {
  const response = await fetch(`${API_PREFIX}/documents/${encodeURIComponent(documentId)}/download`);

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || 'Não foi possível baixar o documento.');
  }

  return response.blob();
}