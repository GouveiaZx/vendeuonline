# Checklist de Rotas da API (Fase 2)

> Marque cada rota após validar método(s), payload, status codes e integração com store/hook correspondente.

## Admin
- [ ] `/api/admin/analytics`
- [x] `/api/admin/banners`  
  - [x] `/api/admin/banners/:id`
- [ ] `/api/admin/commission-rates`  
  - [ ] `/api/admin/commission-rates/:id`
- [x] `/api/admin/users`  
  - [x] `/api/admin/users/:id`

## Analytics
- [x] `/api/analytics/events` (GA4 implementado)
- [ ] `/api/analytics/metrics`

## Auth
- [x] `/api/auth/login`
- [x] `/api/auth/me`
- [x] `/api/auth/register`

## Banners
- [x] `/api/banners/:id/click`
- [x] `/api/banners/:id/impression`

## Commission
- [ ] `/api/commission/payouts`  
  - [ ] `/api/commission/payouts/:id`
- [ ] `/api/commission/stats`
- [ ] `/api/commission/transactions`  
  - [ ] `/api/commission/transactions/:id`

## Orders
- [x] `/api/orders`  
  - [x] `/api/orders/:id` (mock frete, integração WhatsApp)

## Payments
- [x] `/api/payments/create` (Asaas)
- [x] `/api/payments/status` (Asaas)
- [x] `/api/payments/webhook` (Asaas)

## Plans
- [x] `/api/plans`  
  - [x] `/api/plans/:id`

## Products
- [x] `/api/products`  
  - [x] `/api/products/:id`

## Reviews
- [x] `/api/reviews`  
  - [x] `/api/reviews/:id`
  - [x] `/api/reviews/:id/report`
  - [x] `/api/reviews/:id/vote`
- [x] `/api/reviews/stats`

## Stores
- [x] `/api/stores`  
  - [x] `/api/stores/:id`
  - [x] `/api/stores/:id/stats`
- [x] `/api/stores/approval`
- [x] `/api/stores/documents/upload`
- [x] `/api/stores/documents/delete`
- [x] `/api/stores/my-store`
- [x] `/api/stores/slug/:slug`

## Subscriptions
- [x] `/api/subscriptions`

## Upload
- [x] `/api/upload`

## WhatsApp
- [x] `/api/whatsapp/send` (integração WhatsApp Business)
- [x] `/api/whatsapp/webhook` (runtime: nodejs; validação x-hub-signature-256)

---

### Como usar
1. Verifique cada rota: métodos suportados (GET, POST, etc.), parâmetros, payload e códigos de retorno.
2. Confirme integração com stores, hooks ou páginas.
3. Marque a caixa correspondente após validação.

> Após completar todas as verificações, passaremos para os testes de integração automatizados.