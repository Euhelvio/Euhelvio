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

## Configuração do banco (Supabase)

A aplicação precisa de um Postgres — o plano usa **Supabase** (grátis para
este volume). Passo a passo:

1. Crie uma conta e um projeto em https://supabase.com
2. No projeto, vá em **Project Settings > Database > Connection string**
3. Copie a URI no formato **"Transaction pooler"** (recomendado — funciona
   bem tanto local quanto na Vercel, que roda em ambiente serverless)
4. Copie `.env.example` para `.env.local` e cole a connection string em
   `DATABASE_URL`, substituindo `[YOUR-PASSWORD]` pela senha do banco que
   você definiu ao criar o projeto

```bash
cp .env.example .env.local
# edite .env.local com a connection string do seu projeto Supabase
```

Não é preciso criar tabelas manualmente: na primeira conexão, a aplicação
cria o schema (`CREATE TABLE IF NOT EXISTS`) e popula ~19 imóveis fictícios
de exemplo, se o banco estiver vazio.

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

## Deploy na Vercel

1. Importe o repositório na Vercel (você já tem conta)
2. Em **Project Settings > Environment Variables**, adicione `DATABASE_URL`
   com a mesma connection string do Supabase (necessária também em build
   time, pois a página de busca é pré-renderizada)
3. Deploy — pronto, o link já é público

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
- **PostgreSQL (Supabase)** via `pg`, sem ORM — o modelo de dados
  (`src/lib/db.ts`) segue as entidades do planejamento (Imóvel, Fonte/Parceiro,
  Lead, Alerta). O schema é criado automaticamente na primeira conexão.
  Busca geoespacial por raio/área desenhada (PostGIS) é um upgrade natural
  quando isso entrar no roadmap — hoje o filtro geográfico é por município.
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
    db.ts                            # conexão Postgres, schema, seed e queries
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
- **Cobrança por lead ainda não é automática** — o modelo de negócio do
  plano (comissão por lead) está registrado (tabela `leads`), mas não há
  integração com processador de pagamento; combine com os parceiros-piloto
  por fora enquanto valida.

## Próximos passos técnicos (fora deste MVP)

- Autenticação real do parceiro (login/senha ou magic link) no painel
- Envio real de e-mail de alerta (Resend/Postmark) e push
- Cobrança automática por lead (Asaas/Pagar.me/Stripe)
- Deduplicação automática de anúncios entre múltiplas fontes
- Busca geoespacial por raio/área desenhada com PostGIS
