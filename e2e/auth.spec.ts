import { test, expect } from '@playwright/test';

test.describe('Autenticação', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('deve navegar para login de comprador', async ({ page }) => {
    await page.click('[data-testid="login-buyer"]');
    await expect(page).toHaveURL('/login/buyer');
    await expect(page.locator('h1')).toContainText('Login do Comprador');
  });

  test('deve navegar para login de vendedor', async ({ page }) => {
    await page.click('[data-testid="login-seller"]');
    await expect(page).toHaveURL('/login/seller');
    await expect(page.locator('h1')).toContainText('Login do Vendedor');
  });

  test('deve navegar para login de admin', async ({ page }) => {
    await page.click('[data-testid="login-admin"]');
    await expect(page).toHaveURL('/login/admin');
    await expect(page.locator('h1')).toContainText('Login do Administrador');
  });

  test('deve fazer login como comprador', async ({ page }) => {
    await page.goto('/login/buyer');
    
    await page.fill('[data-testid="email"]', 'maria@comprador.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="submit-button"]');

    // Aguardar redirecionamento para dashboard
    await page.waitForURL('/buyer/dashboard');
    await expect(page.locator('[data-testid="user-name"]')).toContainText('Maria');
  });

  test('deve fazer login como vendedor', async ({ page }) => {
    await page.goto('/login/seller');
    
    await page.fill('[data-testid="email"]', 'joao@vendedor.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="submit-button"]');

    // Aguardar redirecionamento para dashboard
    await page.waitForURL('/seller/dashboard');
    await expect(page.locator('[data-testid="store-name"]')).toContainText('Loja do João');
  });

  test('deve fazer login como admin', async ({ page }) => {
    await page.goto('/login/admin');
    
    await page.fill('[data-testid="email"]', 'admin@vendeuonline.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.fill('[data-testid="admin-code"]', 'ADMIN2024');
    await page.click('[data-testid="submit-button"]');

    // Aguardar redirecionamento para dashboard
    await page.waitForURL('/admin/dashboard');
    await expect(page.locator('[data-testid="admin-panel"]')).toBeVisible();
  });

  test('deve mostrar erro com credenciais inválidas', async ({ page }) => {
    await page.goto('/login/buyer');
    
    await page.fill('[data-testid="email"]', 'email@inexistente.com');
    await page.fill('[data-testid="password"]', 'senhaerrada');
    await page.click('[data-testid="submit-button"]');

    await expect(page.locator('[data-testid="error-message"]')).toContainText('Credenciais inválidas');
  });

  test('deve validar campos obrigatórios', async ({ page }) => {
    await page.goto('/login/buyer');
    
    await page.click('[data-testid="submit-button"]');

    await expect(page.locator('[data-testid="email-error"]')).toContainText('Email obrigatório');
    await expect(page.locator('[data-testid="password-error"]')).toContainText('Senha obrigatória');
  });

  test('deve navegar para registro de comprador', async ({ page }) => {
    await page.goto('/login/buyer');
    await page.click('[data-testid="register-link"]');
    
    await expect(page).toHaveURL('/register/buyer');
    await expect(page.locator('h1')).toContainText('Cadastro do Comprador');
  });

  test('deve navegar para registro de vendedor', async ({ page }) => {
    await page.goto('/login/seller');
    await page.click('[data-testid="register-link"]');
    
    await expect(page).toHaveURL('/register/seller');
    await expect(page.locator('h1')).toContainText('Cadastro do Vendedor');
  });

  test('deve navegar para esqueci senha', async ({ page }) => {
    await page.goto('/login/buyer');
    await page.click('[data-testid="forgot-password-link"]');
    
    await expect(page).toHaveURL('/forgot-password');
    await expect(page.locator('h1')).toContainText('Recuperar Senha');
  });

  test('deve fazer logout corretamente', async ({ page }) => {
    // Primeiro fazer login
    await page.goto('/login/buyer');
    await page.fill('[data-testid="email"]', 'maria@comprador.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="submit-button"]');
    
    await page.waitForURL('/buyer/dashboard');

    // Fazer logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');

    // Verificar redirecionamento para home
    await expect(page).toHaveURL('/');
    await expect(page.locator('[data-testid="login-buyer"]')).toBeVisible();
  });
});

test.describe('Registro', () => {
  test('deve registrar novo comprador', async ({ page }) => {
    await page.goto('/register/buyer');
    
    await page.fill('[data-testid="name"]', 'Novo Comprador');
    await page.fill('[data-testid="email"]', 'novo@comprador.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.fill('[data-testid="phone"]', '11999999999');
    await page.fill('[data-testid="city"]', 'São Paulo');
    await page.selectOption('[data-testid="state"]', 'SP');
    
    await page.click('[data-testid="submit-button"]');

    // Aguardar sucesso e redirecionamento
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Cadastro realizado com sucesso');
  });

  test('deve registrar novo vendedor', async ({ page }) => {
    await page.goto('/register/seller');
    
    // Dados pessoais
    await page.fill('[data-testid="name"]', 'Novo Vendedor');
    await page.fill('[data-testid="email"]', 'novo@vendedor.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.fill('[data-testid="phone"]', '11888888888');
    await page.fill('[data-testid="city"]', 'Rio de Janeiro');
    await page.selectOption('[data-testid="state"]', 'RJ');
    
    // Dados da loja
    await page.fill('[data-testid="store-name"]', 'Nova Loja');
    await page.fill('[data-testid="store-description"]', 'Descrição da nova loja');
    await page.fill('[data-testid="store-slug"]', 'nova-loja');
    await page.selectOption('[data-testid="category"]', 'Eletrônicos');
    
    await page.click('[data-testid="submit-button"]');

    // Aguardar sucesso
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Cadastro realizado com sucesso');
  });

  test('deve validar slug único da loja', async ({ page }) => {
    await page.goto('/register/seller');
    
    await page.fill('[data-testid="store-slug"]', 'loja-do-joao'); // Slug já existente
    await page.locator('[data-testid="store-slug"]').blur();

    await expect(page.locator('[data-testid="slug-error"]')).toContainText('Este slug já está em uso');
  });
});

test.describe('Recuperação de Senha', () => {
  test('deve enviar email de recuperação', async ({ page }) => {
    await page.goto('/forgot-password');
    
    await page.fill('[data-testid="email"]', 'maria@comprador.com');
    await page.click('[data-testid="submit-button"]');

    await expect(page.locator('[data-testid="success-message"]')).toContainText('Email de recuperação enviado');
  });

  test('deve validar email no formato correto', async ({ page }) => {
    await page.goto('/forgot-password');
    
    await page.fill('[data-testid="email"]', 'email-invalido');
    await page.click('[data-testid="submit-button"]');

    await expect(page.locator('[data-testid="email-error"]')).toContainText('Email inválido');
  });

  test('deve resetar senha com token válido', async ({ page }) => {
    // Simular acesso com token válido
    await page.goto('/reset-password?token=valid-token-123');
    
    await page.fill('[data-testid="new-password"]', 'novasenha123');
    await page.fill('[data-testid="confirm-password"]', 'novasenha123');
    await page.click('[data-testid="submit-button"]');

    await expect(page.locator('[data-testid="success-message"]')).toContainText('Senha alterada com sucesso');
  });

  test('deve mostrar erro com token inválido', async ({ page }) => {
    await page.goto('/reset-password?token=token-invalido');
    
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Token inválido ou expirado');
  });
});