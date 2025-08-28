# Arquitetura do Marketplace – Visão Geral (Fase 1)

> Última atualização: Fase 1 – mapeamento inicial de páginas, APIs, hooks e stores.

## 1. Estrutura em Árvore (Resumo)

```text
📦 Marketplace
├── 🖥️ Front-End (Next .js App Router)
│   ├── Páginas (46)
│   │   ├── Público: /, /about, /contact, /faq, /pricing, /privacy, /terms, /unauthorized
│   │   ├── Auth: /(auth)/login, /(auth)/register, /(auth)/callback, /(auth)/verify
│   │   ├── Buyer: /buyer/orders, /buyer/wishlist, /buyer/reviews
│   │   ├── Seller: /seller/dashboard, /seller/products, /seller/products/new, /seller/orders
│   │   ├── Admin: /admin/overview, /admin/banners, /admin/users
│   │   ├── Pagamento: /checkout, /payment/success, /payment/fail
│   │   ├── Dinâmicas: /stores/[id], /produto/[id]
│   │   └── Utilitárias: /chat, /cart, /settings, /test-asaas
│   ├── Hooks (7)
│   │   ├── useAuth → /api/auth/*
│   │   ├── useCoupons → /api/coupons/*
│   │   ├── useImageUpload → /api/upload
│   │   ├── useOffline → /api/products, /api/stores
│   │   ├── usePayment → /api/payments/*
│   │   ├── useTheme (local)
│   │   └── usePushNotifications (comentado)
│   ├── Stores (13 | 4 HTTP)
│   │   ├── bannerStore → /api/banners/[id]/{click,impression}
│   │   ├── analyticsStore → /api/analytics/*
│   │   ├── adminAnalyticsStore → /api/admin/analytics/*
│   │   └── authStore → /api/auth/me
│   └── Lib (Integrações externas)
│       ├── api.ts (wrapper HTTP)
│       ├── asaas.ts, whatsapp*.ts, cloudinary.ts
│       └── utils.ts, validation.ts, supabase.ts
├── 🔌 API Routes – `src/app/api` (23)
│   ├── auth, analytics, admin/*, banners, commission, orders, payments, plans,
│   │   products, reviews, stores, subscriptions, upload, whatsapp
│   └── Rotas dinâmicas: abundantes ([id], [slug])
└── 🌐 API Raiz – `/api` (compatibilidade SSR/external)
    ├── chat, coupons, search, stores, ...
    └── Mesmas regras de domínio do modelo principal
```

## 2. Fluxos de Dados

| Camada        | Origem               | Destino/Consumo        | Observações |
|---------------|----------------------|------------------------|-------------|
| Pages         | `src/app/**/page.tsx`| Hooks & Stores         | SSR/autocache via App Router |
| Hooks         | `src/hooks`          | API interna/externa    | Centralizam lógica side-effect |
| Stores        | `src/store`          | Componentes & Hooks    | Cache local, gerenciamento de estado |
| Lib           | `src/lib`            | Hooks, API routes      | Facade para serviços externos |
| API Routes    | `src/app/api` & `/api`| Banco/Serviços externos | Validação Zod + Prisma + Supabase |

## 3. Pontos de Atenção

1. **Duplicação de Endpoints** – rotas espelhadas em `src/app/api` e `/api`.
2. **Rotas Dinâmicas** – necessidade de middleware consistente para `[id]`/`[slug]`.
3. **Stores × HTTP Direto** – quatro stores ignoram `lib/api.ts`; padronizar error handling.

## 4. Próximas Etapas (Fase 2)

1. **Checklist de Rotas** – validar todas as páginas e endpoints identificados.
2. **Revisão de `lib/api.ts`** – interceptores, retries e tratamento uniforme de erros.
3. **Testes de Integração** – garantir paridade entre `src/app/api` e `/api`.
4. **Refatoração de Stores** – migrar chamadas diretas para o wrapper.

---

*Documento gerado automaticamente como resultado da Fase 1 – mapping & discovery.*