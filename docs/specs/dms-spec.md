# Especificação do Document Management System

**Versão:** 1.0  
**Status:** pronta para orientar a implementação  
**Escopo desta entrega:** especificação; nenhum arquivo de back-end ou front-end é executado ou alterado por este plano.

## 1. Objetivo

Entregar uma aplicação web simples para que usuários enviem documentos, consultem os metadados dos arquivos enviados e baixem esses documentos posteriormente, usando armazenamento local e uma API HTTP organizada em uma Clean Architecture simples.

## 2. Escopo

### 2.1 Dentro do escopo

- Upload de um documento por requisição.
- Armazenamento do conteúdo do arquivo no filesystem local da aplicação.
- Registro dos metadados do documento em memória.
- Identificação do usuário proprietário informada no upload.
- Listagem dos documentos registrados.
- Download do conteúdo de um documento pelo identificador.
- Interface React para enviar documentos, visualizar a listagem e iniciar downloads.
- Tratamento de erros de entrada, upload, arquivo ausente e falhas internas.
- Endpoint de verificação de saúde da aplicação (`GET /health`).

### 2.2 Fora do escopo

- Armazenamento em nuvem, banco de dados, serviços externos ou provedores de upload.
- Persistência dos metadados após o processo ser reiniciado.
- Autenticação, sessão e autorização por usuário.
- Versionamento, edição, exclusão ou renomeação de documentos.
- Pastas, tags, busca textual, pré-visualização ou conversão de arquivos.
- Compartilhamento e links públicos com expiração.
- Upload de múltiplos arquivos em uma única requisição.

## 3. Usuários e premissas

- O usuário acessa a aplicação por um navegador moderno.
- O identificador do proprietário é informado como texto no formulário de upload.
- Nesta fase, `owner` é apenas um metadado; não é uma credencial e não deve ser usado como mecanismo de autorização.
- A aplicação é executada em um ambiente com permissão de leitura e escrita no diretório de armazenamento.
- O backend e o frontend são executados separadamente em desenvolvimento, com o frontend encaminhando chamadas `/api` para o backend conforme a configuração do Vite.

## 4. Requisitos funcionais

| ID | Requisito | Critério de aceite |
| --- | --- | --- |
| RF-01 | O usuário deve informar um arquivo e um proprietário para realizar o upload. | Uma requisição válida cria um documento e retorna HTTP `201`. |
| RF-02 | O upload deve aceitar exatamente um arquivo no campo multipart `file`. | O conteúdo é gravado em arquivo local e o metadado é registrado. |
| RF-03 | O sistema deve gerar um identificador único para cada documento. | Dois uploads não podem compartilhar o mesmo `id`. |
| RF-04 | O sistema deve preservar o nome original, o tamanho, o tipo MIME, o proprietário e a data do upload nos metadados. | Esses campos são retornados na criação e na listagem. |
| RF-05 | O sistema deve remover o arquivo gravado quando o upload não puder ser associado a metadados válidos. | Não ficam arquivos órfãos após falha de validação ou persistência em memória. |
| RF-06 | O usuário deve poder listar os documentos registrados. | `GET /documents` retorna HTTP `200` e uma coleção ordenada do mais recente para o mais antigo. |
| RF-07 | O usuário deve poder baixar um documento pelo `id`. | Para um `id` válido e arquivo existente, a resposta contém o binário com nome original. |
| RF-08 | O sistema deve informar documento inexistente ou arquivo ausente. | O download retorna HTTP `404` com mensagem JSON quando o registro ou o arquivo não existir. |
| RF-09 | O frontend deve atualizar a listagem após upload bem-sucedido. | O documento recém-criado aparece sem exigir recarga manual da página. |
| RF-10 | O frontend deve apresentar estados de carregamento, sucesso e erro nas operações de upload e listagem. | O usuário recebe feedback e não pode iniciar ações incompatíveis enquanto uma operação estiver pendente. |
| RF-11 | O sistema deve disponibilizar uma verificação de saúde. | `GET /health` retorna `{ "status": "ok" }` com HTTP `200`. |

## 5. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | O conteúdo dos arquivos deve ser salvo exclusivamente no filesystem local, usando `multer` com `diskStorage`. |
| RNF-02 | O diretório padrão de armazenamento deve ser `backend/storage`, podendo ser sobrescrito por `STORAGE_DIR`. |
| RNF-03 | Os metadados devem permanecer em memória nesta fase; reiniciar o backend pode eliminar a coleção de metadados. |
| RNF-04 | O limite padrão de um arquivo deve ser 10 MiB e deve ser configurável por `MAX_FILE_SIZE`, em bytes. |
| RNF-05 | A porta do backend deve ser configurável por `PORT`, com valor padrão `3000`. |
| RNF-06 | A API deve usar JSON para metadados e erros, e o download deve usar resposta binária. |
| RNF-07 | O backend deve seguir o fluxo `routes -> controllers -> services -> repositories`. Cada camada deve conhecer apenas a responsabilidade necessária da camada seguinte. |
| RNF-08 | Entradas externas devem ser validadas nas bordas do sistema; erros de filesystem não devem expor caminhos internos ao cliente. |
| RNF-09 | Nomes de arquivo armazenados devem ser gerados pelo sistema, sem confiar no nome enviado pelo cliente para definir o caminho físico. |
| RNF-10 | A aplicação deve impedir que um caminho de armazenamento resolvido saia do diretório configurado. |
| RNF-11 | O frontend deve usar componentes funcionais React e `fetch` por meio do prefixo `/api`. |
| RNF-12 | Mensagens exibidas ao usuário e comentários do código devem estar em português; símbolos e nomes de código devem estar em inglês. |

## 6. Modelo de dados

### 6.1 Entidade `Document`

O registro completo mantido pelo repositório contém os campos abaixo. Os campos internos de armazenamento não são expostos pela API.

| Campo | Tipo | Obrigatório | Exposto na API | Descrição |
| --- | --- | --- | --- | --- |
| `id` | string | sim | sim | Identificador único, gerado pelo servidor, preferencialmente UUID. |
| `originalName` | string | sim | sim | Nome original enviado pelo cliente, usado no nome do download. |
| `size` | number | sim | sim | Tamanho do conteúdo em bytes. Deve ser maior ou igual a zero. |
| `uploadedAt` | string | sim | sim | Data e hora do upload em ISO 8601, gerada pelo servidor. |
| `owner` | string | sim | sim | Identificador textual do proprietário informado no formulário. Deve ser não vazio após `trim`. |
| `mimeType` | string | sim | sim | Tipo MIME informado pelo upload, para descrever o conteúdo. |
| `storedName` | string | sim | não | Nome seguro gerado para o arquivo no diretório local. |
| `storagePath` | string | sim | não | Caminho absoluto do arquivo gravado; nunca deve ser devolvido ao cliente. |

### 6.2 Regras de armazenamento e ciclo de vida

1. O diretório de armazenamento deve ser criado antes de gravar ou registrar um documento.
2. `multer` deve usar `diskStorage` e gerar um nome físico único, preservando apenas a extensão necessária para o arquivo.
3. O repositório registra o documento em uma coleção em memória após o upload ser concluído.
4. A resposta pública deve remover `storedName` e `storagePath`.
5. Se a validação ou o registro falhar depois da gravação, o serviço deve remover o arquivo físico.
6. O download deve resolver o documento pelo `id`, verificar a existência do arquivo e enviar o conteúdo usando o nome original, sem permitir que o cliente escolha o caminho físico.

## 7. Contratos de API

### 7.1 Convenções gerais

- Base da API consumida pelo frontend: `/api`.
- Rotas do backend, considerando o proxy do frontend: `/upload`, `/documents` e `/documents/:id/download`.
- `Content-Type: application/json` para respostas de metadados e erros.
- Erros devem seguir o formato `{ "error": "mensagem" }`.
- O backend deve retornar HTTP `500` e a mensagem genérica `Erro interno do servidor.` para falhas inesperadas.

### 7.2 `POST /upload`

Envia um documento.

**Entrada**

- `Content-Type: multipart/form-data`.
- Campo de arquivo obrigatório: `file`.
- Campo textual obrigatório: `owner`.
- Deve haver apenas um arquivo por requisição.

**Resposta de sucesso**

- HTTP `201 Created`.
- `Content-Type: application/json`.

```json
{
  "id": "0d5f7c2a-2c0a-4b0e-8a1b-2b2a1f9d1c10",
  "originalName": "relatorio.pdf",
  "size": 245760,
  "uploadedAt": "2026-09-15T12:00:00.000Z",
  "owner": "usuario-123",
  "mimeType": "application/pdf"
}
```

**Erros previstos**

| Status | Situação | Exemplo de resposta |
| --- | --- | --- |
| `400` | Arquivo ausente, proprietário ausente ou erro de processamento do multipart. | `{ "error": "O arquivo é obrigatório." }` |
| `413` | Arquivo maior que `MAX_FILE_SIZE`. | `{ "error": "O arquivo excede o tamanho permitido." }` |
| `500` | Falha inesperada ao criar o diretório ou registrar os metadados. | `{ "error": "Erro interno do servidor." }` |

### 7.3 `GET /documents`

Lista os documentos registrados em memória.

**Entrada**

- Nenhum corpo ou parâmetro obrigatório.

**Resposta de sucesso**

- HTTP `200 OK`.
- Ordenação: `uploadedAt` decrescente.

```json
{
  "documents": [
    {
      "id": "0d5f7c2a-2c0a-4b0e-8a1b-2b2a1f9d1c10",
      "originalName": "relatorio.pdf",
      "size": 245760,
      "uploadedAt": "2026-09-15T12:00:00.000Z",
      "owner": "usuario-123",
      "mimeType": "application/pdf"
    }
  ]
}
```

Uma coleção vazia deve ser representada por `{ "documents": [] }`.

### 7.4 `GET /documents/:id/download`

Baixa o arquivo associado ao identificador.

**Entrada**

- Parâmetro de rota obrigatório: `id`.
- Nenhum corpo.

**Resposta de sucesso**

- HTTP `200 OK`.
- Corpo binário do arquivo armazenado.
- Nome sugerido de download igual a `originalName`.
- Tipo de conteúdo baseado no tipo MIME registrado quando aplicável.

**Erros previstos**

| Status | Situação | Exemplo de resposta |
| --- | --- | --- |
| `404` | Não há metadado para o `id`. | `{ "error": "Documento não encontrado." }` |
| `404` | Há metadado, mas o arquivo físico não está disponível. | `{ "error": "Arquivo do documento não encontrado." }` |
| `500` | Falha inesperada durante o envio. | `{ "error": "Erro interno do servidor." }` |

### 7.5 `GET /health`

Retorna a disponibilidade básica do backend.

```json
{
  "status": "ok"
}
```

## 8. Arquitetura e responsabilidades

### 8.1 Backend

- `routes/`: registra caminhos, middleware de upload e encaminha a requisição ao controller.
- `controllers/`: lê `req.file`, `req.body` e parâmetros de rota; valida entrada básica; escolhe status e formato HTTP; encaminha erros ao middleware.
- `services/`: aplica regras de negócio, coordena criação, listagem, download, verificação do arquivo e limpeza de uploads inválidos.
- `repositories/`: controla a coleção em memória e as operações relacionadas ao diretório e aos metadados persistidos no processo.
- Middleware de erro: converte limites do `multer`, erros esperados e falhas desconhecidas em respostas HTTP consistentes.

O controller não deve acessar `fs` diretamente, o repository não deve conhecer objetos `res` ou `req`, e as rotas não devem conter regra de negócio.

### 8.2 Frontend

- `services/documentService.js`: encapsula chamadas `fetch` para upload, listagem e download.
- `components/UploadComponent.jsx`: controla formulário, arquivo, proprietário, estados de envio e mensagens.
- `components/DocumentList.jsx`: exibe metadados, estado vazio, carregamento, erro e ação de download.
- `App.jsx` ou página equivalente: coordena o carregamento inicial e a atualização da coleção.

## 9. Segurança, validação e operação

- Nunca concatenar diretamente dados enviados pelo cliente em caminhos do filesystem.
- Usar nomes físicos gerados pelo servidor e validar que o caminho resolvido permanece dentro de `STORAGE_DIR`.
- Não retornar `storagePath` ou `storedName` ao cliente.
- Aplicar `MAX_FILE_SIZE` no `multer` antes de aceitar o conteúdo completo.
- Tratar campos textuais com `trim`; rejeitar `owner` ausente ou vazio.
- Limitar o upload ao campo esperado `file` e reportar campos/arquivos incompatíveis como erro de requisição.
- Registrar detalhes técnicos apenas no servidor; mensagens HTTP não devem expor stack trace, caminhos ou configuração interna.
- Como não há autenticação nesta versão, a API deve ser considerada apropriada apenas para ambiente controlado ou exercício local.

## 10. Plano de execução em etapas

O plano abaixo descreve a ordem de implementação. Nesta entrega, ele é apenas planejamento: não executa nem modifica os arquivos de backend ou frontend.

1. **Preparar a configuração e o armazenamento:** confirmar `PORT`, `STORAGE_DIR` e `MAX_FILE_SIZE`; garantir a criação do diretório local e a política de nomes físicos do `multer`.
2. **Concluir o repositório:** implementar a coleção em memória, geração de identificadores, criação, consulta, listagem ordenada, projeção pública e remoção de arquivos em caso de falha.
3. **Concluir o serviço:** coordenar criação, limpeza compensatória, listagem, busca para download e verificação de existência do arquivo.
4. **Concluir controllers e middleware:** validar `file` e `owner`, mapear status HTTP, encaminhar erros e preservar o formato `{ "error": "..." }`.
5. **Concluir rotas HTTP:** ligar o `multer.diskStorage` ao `POST /upload` e registrar os endpoints de documentos sem duplicar regras de negócio.
6. **Cobrir o backend com testes:** testar health check, upload válido, campos obrigatórios, limite de tamanho, listagem vazia e ordenada, download válido, `404` e limpeza após falha.
7. **Implementar o serviço do frontend:** criar funções `fetch` para upload multipart, listagem JSON e download, convertendo respostas não bem-sucedidas em erros exibíveis.
8. **Implementar o fluxo de upload:** criar o formulário React com seleção de arquivo, proprietário, estados de carregamento e feedback em português.
9. **Implementar a listagem e o download:** renderizar metadados, estado vazio, erros e uma ação de download por documento; atualizar a lista após upload.
10. **Integrar e verificar ponta a ponta:** configurar o proxy `/api`, validar o fluxo no navegador, conferir comportamento em caso de backend indisponível e verificar que apenas `backend/storage` recebe arquivos.
11. **Revisar documentação e critérios de aceite:** conferir os contratos contra a implementação e registrar limitações conhecidas, especialmente a perda dos metadados ao reiniciar o processo e a ausência de autenticação.

## 11. Critérios de conclusão

- Todos os requisitos funcionais RF-01 a RF-11 possuem implementação e teste compatível.
- Os três endpoints de documentos respeitam os formatos e status definidos nesta especificação.
- Arquivos são gravados apenas localmente via `multer.diskStorage`, e nenhum caminho interno é exposto.
- A separação `routes -> controllers -> services -> repositories` é preservada.
- O frontend consegue executar upload, listagem e download pelo proxy `/api`.
- O plano de execução permanece separado da implementação e não exige persistência externa nesta fase.