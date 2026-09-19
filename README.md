# Floripa Imóveis

Portal que agrega, numa única busca, anúncios de aluguel, compra e venda,
imóveis comerciais e temporada publicados por imobiliárias e corretores
parceiros da Grande Florianópolis.

Este repositório implementa o **MVP completo (Fase 2)** do roadmap: busca com
mapa e filtros por todos os tipos de operação, comparação lado a lado, ficha
do imóvel com contato unificado, alertas de busca salva, cadastro manual e
integração via feed para parceiros, painel do parceiro e marcação automática
de anúncios desatualizados. O plano completo do produto (escopo, modelo de
negócio, arquitetura, roadmap) está no documento de planejamento do projeto.

## Rodando localmente

```bash
npm install
npm run dev
```

Acesse http://localhost:3000.

- `/` — busca de imóveis, com filtros (tipo de operação, município, preço,
  quartos, aceita pet), mapa, comparação de até 4 imóveis e alerta de busca salva
- `/imoveis/[id]` — ficha do imóvel, com contato unificado (gera um lead) e
  aviso/denúncia de anúncio desatualizado
- `/comparar?ids=1,2,3` — comparação lado a lado dos imóveis selecionados
- `/parceiros/cadastrar` — cadastro manual de imóveis por imobiliárias/corretores parceiros
- `/parceiros/painel?contato=...` — painel do parceiro: seus imóveis, leads
  recebidos e confirmação de anúncios marcados como "verificar"

Na primeira execução, o banco de dados local é criado em `data/app.db` e
populado com ~18 imóveis fictícios espalhados pelos municípios núcleo do MVP
(Florianópolis, São José, Palhoça, Biguaçu, Santo Amaro da Imperatriz,
Governador Celso Ramos e Águas Mornas), cobrindo os quatro tipos de operação.

## Scripts de manutenção (workers agendados)

Pensados para rodar via cron/worker, como descrito na arquitetura do plano:

```bash
# Importa/atualiza imóveis de um parceiro a partir de um feed JSON (upsert por externalRef)
npm run importar-feed -- --file exemplos/feed-parceiro-exemplo.json

# Marca como "verificar" imóveis sem atualização/confirmação do parceiro há N dias (padrão 30)
npm run marcar-verificar -- --dias 30

# Verifica alertas de busca salva e imprime no console os novos imóveis compatíveis
# (envio real de e-mail é um ponto de integração pendente — ver "Limitações" abaixo)
npm run verificar-alertas
```

O formato do feed de parceiro está documentado em
`exemplos/feed-parceiro-exemplo.json`.

## Stack

- **Next.js (App Router) + TypeScript + Tailwind CSS**
- **SQLite (better-sqlite3)** como camada de dados do MVP — zero configuração
  externa para começar a desenvolver. O modelo de dados (`src/lib/db.ts`)
  já segue as entidades do planejamento (Imóvel, Fonte/Parceiro, Lead, Alerta)
  e foi desenhado para migrar para **PostgreSQL + PostGIS (Supabase/Neon)**
  quando a busca geoespacial e o volume de dados justificarem.
- **Leaflet + OpenStreetMap** para o mapa interativo (sem custo de API key)
- **Zod** para validação dos formulários/API
- **tsx** para rodar os scripts de manutenção em TypeScript

## Estrutura

```
src/
  app/
    page.tsx                        # busca (lista + mapa + filtros + alerta)
    comparar/page.tsx                # comparação lado a lado
    imoveis/[id]/page.tsx            # ficha do imóvel + contato + status
    parceiros/cadastrar/page.tsx     # cadastro manual de imóveis
    parceiros/painel/page.tsx        # painel do parceiro (imóveis + leads)
    api/
      imoveis/route.ts               # GET (lista/filtra) e POST (cadastro)
      imoveis/[id]/route.ts          # GET de um imóvel
      imoveis/[id]/denunciar/route.ts # POST: visitante sinaliza desatualizado
      imoveis/[id]/confirmar/route.ts # POST: parceiro confirma disponibilidade
      leads/route.ts                 # POST de contato (lead)
      alertas/route.ts               # POST de alerta de busca salva
  components/                        # busca, mapa, cartões, formulários, painel
  lib/
    db.ts                            # schema SQLite, seed e queries
    types.ts                         # tipos compartilhados
scripts/
  importar-feed.ts                   # ingestão via feed de parceiro (upsert)
  marcar-verificar.ts                # marca anúncios inativos como "verificar"
  verificar-alertas.ts               # verifica e "envia" alertas de busca salva
exemplos/
  feed-parceiro-exemplo.json         # formato de feed aceito pela ingestão
```

## Limitações conhecidas deste MVP (por design)

- **E-mail de alerta não é enviado de verdade.** `verificar-alertas` imprime
  no console o que seria enviado. Plugar um provedor real (Resend, Postmark
  etc.) exige uma chave de API — ponto de integração isolado em
  `scripts/verificar-alertas.ts`, função `notificar()`.
- **Painel do parceiro não tem autenticação real** — o acesso é só pelo
  contato cadastrado, adequado para um piloto com poucos parceiros de
  confiança, não para produção com muitos parceiros.
- **SQLite local**, não compartilhado entre múltiplas instâncias/ambientes —
  ok para o MVP fechado, migrar para Supabase/Neon antes de qualquer
  deploy com mais de um servidor.

## Próximos passos técnicos (fora deste MVP)

- Autenticação real do parceiro (login/senha ou magic link) no painel
- Envio real de e-mail de alerta (Resend/Postmark) e push
- Migrar a camada de dados para Supabase/Neon com PostGIS
- Deduplicação automática de anúncios entre múltiplas fontes
