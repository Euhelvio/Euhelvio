# Catálogo de Fotos

Catálogo pessoal de fotos com filtros por data, local e tipo, visualização
em tela cheia, edição de filtros visuais (desfoque, sépia, monocromático) e
compartilhamento. Duas formas de alimentar o catálogo:

- **Importado localmente**: sobe um export do Google Takeout; as fotos e
  metadados ficam guardados no navegador (IndexedDB) — funciona offline,
  mas duplica o espaço (cada foto ocupa espaço na nuvem *e* no disco local).
- **Google Drive**: conecta a uma pasta do seu Drive e navega/edita as fotos
  direto de lá, sob demanda — só a miniatura ao rolar a lista e a foto
  inteira quando você abre em tela cheia. Nada é duplicado localmente, mas
  precisa de conexão e de login com sua conta Google.

Nenhum dos dois modos envia fotos para um servidor próprio: local é 100%
no navegador, e o modo Drive fala direto do navegador com a API do Google.

## Por que Google Takeout, e não a API do Google Fotos

Desde 2025 o Google restringiu a Photos Library API: aplicativos novos não
conseguem mais listar/sincronizar a biblioteca inteira automaticamente — só
o modo "picker" (o usuário escolhe fotos manualmente a cada sessão), o que
inviabiliza um catálogo persistente. Por isso o import local é feito a
partir de um export do [Google Takeout](https://takeout.google.com), que
inclui as fotos originais e um JSON de metadados por arquivo (data, GPS) —
sem exigir aprovação de app pelo Google.

O modo Google Drive contorna essa mesma restrição de outro jeito: em vez de
usar a Photos API (bloqueada para navegação livre), ele extrai o export do
Takeout dentro do próprio Google Drive (o Drive tem opção de "descompactar"
um `.zip` enviado para lá) e usa a Drive API — que não tem essa restrição —
para listar e ler as fotos, já soltas como arquivos normais numa pasta.

## Modo local: como usar

1. `npm install`
2. `npm run dev` e abra http://localhost:3000
3. Em [takeout.google.com](https://takeout.google.com), selecione apenas
   "Google Fotos" e exporte em formato `.zip`.
4. No app, use o painel "Importar do Google Takeout" para enviar o(s)
   arquivo(s) `.zip` (o Takeout pode dividir bibliotecas grandes em várias
   partes — todas podem ser selecionadas de uma vez).
5. Use os filtros de data, local e tipo para navegar; clique numa foto para
   abrir em tela cheia.
6. Na visualização em tela cheia: `Info` mostra data/local/tipo (o tipo é
   editável manualmente), `Filtros` abre os controles de desfoque, sépia,
   monocromático, brilho, contraste e saturação, com botões para salvar uma
   cópia no catálogo ou compartilhar via a API nativa de compartilhamento do
   navegador (com fallback para download).
7. No painel "Backup do catálogo", use "Exportar backup" para baixar um
   `.zip` com todas as fotos e metadados — guarde esse arquivo em outro
   lugar, já que o catálogo só existe neste navegador (veja abaixo). Use
   "Restaurar backup" para trazer esse `.zip` de volta, neste navegador ou
   em outro/em outro dispositivo.

## Modo Google Drive: como usar

1. No Google Takeout, escolha entregar o export direto no seu Google Drive
   (em vez de por e-mail).
2. No Google Drive, abra o `.zip` recebido e use a opção de descompactar —
   as fotos (e os `.json` de metadata) ficam soltas numa pasta.
3. No app, aba "Google Drive" → "Conectar ao Google Drive": faz login com
   sua conta Google e escolhe a pasta.
4. O app lista as fotos da pasta (usa a data/GPS que o próprio Drive extrai
   do EXIF de cada imagem) e permite filtrar/abrir/editar/compartilhar como
   no modo local — só que buscando os bytes de cada foto sob demanda.
5. Use "Atualizar lista" depois de adicionar/remover fotos na pasta.

**Configuração necessária** (feita uma vez, no [Google Cloud
Console](https://console.cloud.google.com)): criar um projeto, ativar a
Google Drive API e a Google Picker API, configurar a tela de consentimento
OAuth como "Externo"/"Teste" com seu e-mail como usuário de teste, e criar
um Client ID OAuth (Web) + uma chave de API restrita a essas duas APIs — os
valores ficam em `src/lib/googleConfig.ts` (são identificadores públicos,
seguros de manter no código; não são segredo).

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Dexie (IndexedDB) para armazenar fotos/metadados localmente e cachear a
  lista de arquivos do Drive
- [`@zip.js/zip.js`](https://gildas-lormeau.github.io/zip.js/) para ler o
  export do Takeout e gerar/ler backups sem carregar o arquivo inteiro na
  memória (importante para exports de vários GB)
- Google Identity Services + Picker API + Drive API v3 para o modo Drive
- Nominatim (OpenStreetMap) para geocoding reverso (lat/lng → cidade),
  com cache local e fila limitada a ~1 req/s

## Limitações conhecidas / roadmap

- **Classificação por tipo (paisagem, pessoas, objeto...)** é manual por
  enquanto — cada foto começa como "Não classificado" e pode ser marcada na
  tela cheia. Um classificador automático (ex. TensorFlow.js/ML Kit) é o
  próximo passo natural.
- **HEIC/HEIF**: fotos de iPhone exportadas nesse formato podem não
  decodificar em navegadores sem suporte nativo a HEIC; essas fotos são
  ignoradas no import (contabilizadas como "ignoradas" no resumo).
  Convertê-las para JPEG antes do export do Takeout evita o problema.
- **Vídeos** não são importados nesta versão — só fotos.
- **Geocoding** depende de um serviço externo (Nominatim) e respeita o
  limite de uso dele; para bibliotecas com muitos locais distintos, resolver
  todos pode levar alguns minutos.
- **Bibliotecas muito grandes** (dezenas de milhares de fotos): o import
  roda inteiramente no navegador; para catálogos assim, prefira importar os
  arquivos `.zip` do Takeout um de cada vez.
- Os dados do modo local vivem no IndexedDB do navegador/dispositivo em
  uso — não há sincronização automática entre dispositivos. Use o painel de
  backup (exportar/restaurar) para levar o catálogo para outro
  navegador/aparelho ou se precaver antes de limpar os dados do site.
- **Modo Drive — sessão expira**: o token de acesso do Google dura cerca de
  1 hora; passado esse tempo, ações que buscam foto (miniatura, tela cheia)
  podem pedir para conectar de novo.
- **Modo Drive — categoria/salvar cópia**: a categoria (tipo) marcada fica
  salva localmente (associada ao ID do arquivo do Drive), não no Drive em
  si. "Salvar cópia editada" não está disponível no modo Drive (só baixa ou
  compartilha) — editar e salvar de volta na pasta do Drive é um possível
  próximo passo.
- **Miniaturas do Drive**: o app tenta usar a miniatura que o próprio Drive
  já gera; se isso falhar por algum motivo, ele baixa a foto inteira e gera
  a miniatura localmente (mais lento, mas funciona).
