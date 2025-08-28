# Guia de Deploy - Vendeu Online

## Visão Geral

Este guia cobre o deploy do marketplace multivendedor, incluindo integrações com WhatsApp Business, Asaas, Supabase, GA4, configurações de DNS/subdomínios e políticas de segurança (CSP/Permissions-Policy).

## Pré-requisitos

### Ferramentas Necessárias
- **Node.js** 18.x ou superior
- **npm** ou **yarn**
- **Git**
- **Vercel CLI** (`npm i -g vercel`)

### Contas/Serviços Necessários
- **Vercel** (deploy frontend e backend)
- **Supabase** (banco de dados PostgreSQL)
- **Asaas** (gateway de pagamento)
- **Meta Developer** (WhatsApp Business API)
- **Google Analytics** (analytics)
- **Cloudinary** (upload de imagens)

---

## 1. Configuração de Ambiente

### 1.1 Variáveis de Ambiente

Inclua e revise as variáveis:
- WhatsApp Business: `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_WEBHOOK_SECRET`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID`, `WHATSAPP_APP_ID`, `WHATSAPP_APP_SECRET`
- Asaas: `ASAAS_API_KEY`, `ASAAS_BASE_URL`, `ASAAS_WEBHOOK_SECRET`
- GA4: `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- CSP/Permissions-Policy: configure no Vercel para bloquear iframes externos, limitar APIs sensíveis e proteger dados
- DNS/Subdomínios: configure no Vercel para cada loja, com instruções para domínios próprios

## 2. Configuração do Supabase

- Crie buckets para uploads, produtos e avatars
- Configure políticas RLS conforme exemplos
- Gere e aplique migrações Prisma

## 3. Configuração do Asaas

- Crie conta, obtenha API Key, configure webhooks para `/api/payments/webhook`
- Teste pagamentos PIX, Cartão e Boleto

## 4. Configuração do WhatsApp Business

- Configure app no Meta Developer, obtenha tokens e IDs
- Configure webhook para `/api/whatsapp/webhook` (GET/POST)
- Teste envio e recebimento de mensagens

## 5. Configuração do GA4

- Crie propriedade no Google Analytics
- Adicione `NEXT_PUBLIC_GA_MEASUREMENT_ID` no .env
- Teste eventos e rastreamento

## 6. Configuração de DNS/Subdomínios

- Adicione domínios no Vercel
- Configure subdomínios para lojas
- Para domínios próprios, instrua vendedor a adicionar registro CNAME

## 7. Políticas de Segurança

- Configure CSP e Permissions-Policy no Vercel
- Ative SSL
- Configure monitoramento Sentry

## 8. Pós-Deploy

- Verifique site, banco, uploads, pagamentos, webhooks, analytics, SSL
- Execute testes de integração

### 5.1 Deploy via Vercel CLI
```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer login
vercel login

# Deploy inicial
vercel

# Deploy para produção
vercel --prod
```

### 5.2 Deploy via GitHub
1. Conecte seu repositório no Vercel
2. Configure as variáveis de ambiente no dashboard
3. O deploy será automático a cada push

### 5.3 Configurar Variáveis no Vercel
Acesse o dashboard do Vercel e configure TODAS as variáveis listadas na seção 1.1.

### 5.4 Configurar Domínio
1. No dashboard do Vercel, vá em **Settings > Domains**
2. Adicione seu domínio personalizado
3. Configure DNS conforme instruções

---

## 6. Pós-Deploy

### 6.1 Verificações Obrigatórias
- [ ] Site acessível no domínio
- [ ] Banco de dados conectado
- [ ] Upload de imagens funcionando
- [ ] Pagamentos Asaas funcionando
- [ ] Webhook Asaas configurado
- [ ] WhatsApp webhook funcionando
- [ ] Google Analytics rastreando
- [ ] SSL ativo

### 6.2 Testes de Integração
```bash
# Testar webhook Asaas
curl -X POST https://seu-dominio.com/api/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{"event":"PAYMENT_RECEIVED","payment":{"id":"test"}}'

# Testar webhook WhatsApp
curl -X POST https://seu-dominio.com/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{"object":"whatsapp_business_account","entry":[]}'
```

---

## 7. Monitoramento e Logs

### 7.1 Logs da Vercel
```bash
# Ver logs em tempo real
vercel logs seu-projeto --follow

# Ver logs específicos
vercel logs seu-projeto --since=1h
```

### 7.2 Métricas Importantes
- **Performance**: Core Web Vitals
- **Errors**: Taxa de erro das APIs
- **Usage**: Uso de bandwidth e executions
- **Database**: Conexões e queries

---

## 8. Solução de Problemas

### 8.1 Problemas Comuns

#### Database Connection Error
```
Error: "Database connection failed"
Solução: Verificar DATABASE_URL e DIRECT_URL no .env
```

#### Webhook Asaas não funciona
```
Error: "Webhook signature invalid"
Solução: Verificar ASAAS_WEBHOOK_SECRET no .env
```

#### Upload de imagens falha
```
Error: "Upload failed"
Solução: Verificar credenciais Cloudinary e políticas RLS
```

#### WhatsApp webhook falha verificação
```
Error: "Webhook verification failed"
Solução: Verificar WHATSAPP_VERIFY_TOKEN e URL do webhook
```

### 8.2 Debug Avançado
```bash
# Verificar variáveis de ambiente
vercel env ls

# Testar build local
npm run build

# Verificar logs detalhados
vercel logs --output=raw
```

---

## 9. Otimizações de Performance

### 9.1 Configurações Recomendadas
- **Image Optimization**: Ativado por padrão no Next.js
- **Edge Functions**: Para APIs geograficamente distribuídas
- **Caching**: Cache de dados estáticos e dinâmicos
- **CDN**: Distribuição global de assets

### 9.2 Monitoramento Contínuo
- Configure alertas para downtime
- Monitore métricas de performance
- Faça backup regular do banco
- Teste webhooks periodicamente

---

## 10. Checklist Final

### Pré-Deploy
- [ ] Todas variáveis de ambiente configuradas
- [ ] Banco de dados configurado
- [ ] Buckets Supabase criados
- [ ] Políticas RLS configuradas
- [ ] Conta Asaas configurada
- [ ] WhatsApp Business configurado

### Pós-Deploy
- [ ] Site funcionando
- [ ] SSL ativo
- [ ] Analytics funcionando
- [ ] Pagamentos funcionando
- [ ] WhatsApp funcionando
- [ ] Uploads funcionando
- [ ] Webhooks testados

### Produção
- [ ] Domínio configurado
- [ ] Monitoramento ativo
- [ ] Backups configurados
- [ ] Logs sendo coletados
- [ ] Performance otimizada