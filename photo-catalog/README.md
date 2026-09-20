# Catálogo de Fotos

Catálogo pessoal de fotos com filtros por data, local e tipo, visualização
em tela cheia, edição de filtros visuais (desfoque, sépia, monocromático) e
compartilhamento. Roda inteiramente no navegador: as fotos e os metadados
ficam armazenados localmente (IndexedDB), nada é enviado para um servidor.

## Por que Google Takeout, e não a API do Google Fotos

Desde 2025 o Google restringiu a Photos Library API: aplicativos novos não
conseguem mais listar/sincronizar a biblioteca inteira automaticamente — só
o modo "picker" (o usuário escolhe fotos manualmente a cada sessão), o que
inviabiliza um catálogo persistente. Por isso o import aqui é feito a partir
de um export do [Google Takeout](https://takeout.google.com), que inclui as
fotos originais e um JSON de metadados por arquivo (data, GPS) — sem exigir
aprovação de app pelo Google.

## Como usar

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

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Dexie (IndexedDB) para armazenar fotos e metadados localmente
- JSZip para ler o export do Takeout no navegador
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
- Os dados vivem no IndexedDB do navegador/dispositivo em uso — não há
  sincronização entre dispositivos nem backup automático nesta versão.
