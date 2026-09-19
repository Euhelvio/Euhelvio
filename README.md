# Floripa Imóveis

Portal que agrega, numa única busca, anúncios de aluguel, compra e venda,
imóveis comerciais e temporada publicados por imobiliárias e corretores
parceiros da Grande Florianópolis.

Este repositório implementa o **MVP fechado (Fase 1)** do roadmap: busca com
mapa e filtros, ficha do imóvel com contato unificado, e cadastro manual de
imóveis por parceiros — cobrindo, por enquanto, apenas aluguel residencial.
O plano completo do produto (escopo, modelo de negócio, arquitetura, roadmap)
está no documento de planejamento do projeto.

## Rodando localmente

```bash
npm install
npm run dev
```

Acesse http://localhost:3000.

- `/` — busca de imóveis, com filtros (município, preço, quartos, aceita pet) e mapa
- `/imoveis/[id]` — ficha do imóvel, com formulário de contato unificado (gera um lead)
- `/parceiros/cadastrar` — cadastro manual de imóveis por imobiliárias/corretores parceiros

Na primeira execução, o banco de dados local é criado em `data/app.db` e
populado com ~15 imóveis fictícios espalhados pelos municípios núcleo do MVP
(Florianópolis, São José, Palhoça, Biguaçu, Santo Amaro da Imperatriz,
Governador Celso Ramos e Águas Mornas).

## Stack

- **Next.js (App Router) + TypeScript + Tailwind CSS**
- **SQLite (better-sqlite3)** como camada de dados do MVP — zero configuração
  externa para começar a desenvolver. O modelo de dados (`src/lib/db.ts`)
  já segue as entidades do planejamento (Imóvel, Fonte/Parceiro, Lead) e foi
  desenhado para migrar para **PostgreSQL + PostGIS (Supabase/Neon)** na
  Fase 2, quando a busca geoespacial e o volume de dados justificarem.
- **Leaflet + OpenStreetMap** para o mapa interativo (sem custo de API key)
- **Zod** para validação dos formulários/API

## Estrutura

```
src/
  app/
    page.tsx                    # busca (lista + mapa + filtros)
    imoveis/[id]/page.tsx        # ficha do imóvel + contato
    parceiros/cadastrar/page.tsx # cadastro manual de imóveis
    api/
      imoveis/route.ts           # GET (lista/filtra) e POST (cadastro)
      imoveis/[id]/route.ts      # GET de um imóvel
      leads/route.ts             # POST de contato (lead)
  components/                    # busca, mapa, cartão de imóvel, formulário de contato
  lib/
    db.ts                        # schema SQLite, seed e queries
    types.ts                     # tipos compartilhados
```

## Próximos passos técnicos (fora deste MVP fechado)

- Adicionar os demais tipos de operação (compra/venda, comercial, temporada)
- Alertas personalizados de busca salva (Fase 2)
- Migrar a camada de dados para Supabase/Neon com PostGIS
- Integração automatizada via feed XML/JSON para parceiros maiores
