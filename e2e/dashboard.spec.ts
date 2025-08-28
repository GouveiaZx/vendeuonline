import { test, expect } from '@playwright/test';

test.describe('Dashboard - Comprador', () => {
  test.beforeEach(async ({ page }) => {
    // Login como comprador
    await page.goto('/login/buyer');
    await page.fill('[data-testid="email"]', 'maria@comprador.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="submit-button"]');
    await page.waitForURL('/buyer/dashboard');
  });

  test('deve exibir dashboard do comprador corretamente', async ({ page }) => {
    await expect(page.locator('[data-testid="user-welcome"]')).toContainText('Bem-vinda, Maria');
    await expect(page.locator('[data-testid="buyer-stats"]')).toBeVisible();
    await expect(page.locator('[data-testid="recent-orders"]')).toBeVisible();
  });

  test('deve navegar para pedidos', async ({ page }) => {
    await page.click('[data-testid="nav-orders"]');
    await expect(page).toHaveURL('/buyer/orders');
    await expect(page.locator('h1')).toContainText('Meus Pedidos');
  });

  test('deve navegar para lista de desejos', async ({ page }) => {
    await page.click('[data-testid="nav-wishlist"]');
    await expect(page).toHaveURL('/buyer/wishlist');
    await expect(page.locator('h1')).toContainText('Lista de Desejos');
  });

  test('deve navegar para endereços', async ({ page }) => {
    await page.click('[data-testid="nav-addresses"]');
    await expect(page).toHaveURL('/buyer/addresses');
    await expect(page.locator('h1')).toContainText('Meus Endereços');
  });

  test('deve navegar para perfil', async ({ page }) => {
    await page.click('[data-testid="nav-profile"]');
    await expect(page).toHaveURL('/buyer/profile');
    await expect(page.locator('h1')).toContainText('Meu Perfil');
  });
});

test.describe('Dashboard - Vendedor', () => {
  test.beforeEach(async ({ page }) => {
    // Login como vendedor
    await page.goto('/login/seller');
    await page.fill('[data-testid="email"]', 'joao@vendedor.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="submit-button"]');
    await page.waitForURL('/seller/dashboard');
  });

  test('deve exibir dashboard do vendedor corretamente', async ({ page }) => {
    await expect(page.locator('[data-testid="seller-welcome"]')).toContainText('Bem-vindo, João');
    await expect(page.locator('[data-testid="store-name"]')).toContainText('Loja do João');
    await expect(page.locator('[data-testid="sales-stats"]')).toBeVisible();
    await expect(page.locator('[data-testid="recent-orders"]')).toBeVisible();
  });

  test('deve navegar para produtos', async ({ page }) => {
    await page.click('[data-testid="nav-products"]');
    await expect(page).toHaveURL('/seller/products');
    await expect(page.locator('h1')).toContainText('Meus Produtos');
  });

  test('deve navegar para pedidos', async ({ page }) => {
    await page.click('[data-testid="nav-orders"]');
    await expect(page).toHaveURL('/seller/orders');
    await expect(page.locator('h1')).toContainText('Pedidos Recebidos');
  });

  test('deve navegar para loja', async ({ page }) => {
    await page.click('[data-testid="nav-store"]');
    await expect(page).toHaveURL('/seller/store');
    await expect(page.locator('h1')).toContainText('Minha Loja');
  });

  test('deve navegar para analytics', async ({ page }) => {
    await page.click('[data-testid="nav-analytics"]');
    await expect(page).toHaveURL('/seller/analytics');
    await expect(page.locator('h1')).toContainText('Análises e Relatórios');
  });

  test('deve adicionar novo produto', async ({ page }) => {
    await page.click('[data-testid="nav-products"]');
    await page.click('[data-testid="add-product-button"]');
    
    await expect(page).toHaveURL('/seller/products/new');
    await expect(page.locator('h1')).toContainText('Adicionar Produto');
  });
});

test.describe('Dashboard - Admin', () => {
  test.beforeEach(async ({ page }) => {
    // Login como admin
    await page.goto('/login/admin');
    await page.fill('[data-testid="email"]', 'admin@vendeuonline.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.fill('[data-testid="admin-code"]', 'ADMIN2024');
    await page.click('[data-testid="submit-button"]');
    await page.waitForURL('/admin/dashboard');
  });

  test('deve exibir dashboard do admin corretamente', async ({ page }) => {
    await expect(page.locator('[data-testid="admin-welcome"]')).toContainText('Painel Administrativo');
    await expect(page.locator('[data-testid="admin-stats"]')).toBeVisible();
    await expect(page.locator('[data-testid="system-health"]')).toBeVisible();
  });

  test('deve navegar para usuários', async ({ page }) => {
    await page.click('[data-testid="nav-users"]');
    await expect(page).toHaveURL('/admin/users');
    await expect(page.locator('h1')).toContainText('Gerenciar Usuários');
  });

  test('deve navegar para lojas', async ({ page }) => {
    await page.click('[data-testid="nav-stores"]');
    await expect(page).toHaveURL('/admin/stores');
    await expect(page.locator('h1')).toContainText('Gerenciar Lojas');
  });

  test('deve navegar para produtos', async ({ page }) => {
    await page.click('[data-testid="nav-products"]');
    await expect(page).toHaveURL('/admin/products');
    await expect(page.locator('h1')).toContainText('Gerenciar Produtos');
  });

  test('deve navegar para analytics', async ({ page }) => {
    await page.click('[data-testid="nav-analytics"]');
    await expect(page).toHaveURL('/admin/analytics');
    await expect(page.locator('h1')).toContainText('Analytics Globais');
  });

  test('deve navegar para configurações', async ({ page }) => {
    await page.click('[data-testid="nav-settings"]');
    await expect(page).toHaveURL('/admin/settings');
    await expect(page.locator('h1')).toContainText('Configurações do Sistema');
  });

  test('deve filtrar usuários por tipo', async ({ page }) => {
    await page.click('[data-testid="nav-users"]');
    
    await page.selectOption('[data-testid="user-type-filter"]', 'SELLER');
    await expect(page.locator('[data-testid="user-list"]')).toContainText('SELLER');
    
    await page.selectOption('[data-testid="user-type-filter"]', 'BUYER');
    await expect(page.locator('[data-testid="user-list"]')).toContainText('BUYER');
  });

  test('deve buscar usuários por email', async ({ page }) => {
    await page.click('[data-testid="nav-users"]');
    
    await page.fill('[data-testid="search-users"]', 'maria@comprador.com');
    await page.press('[data-testid="search-users"]', 'Enter');
    
    await expect(page.locator('[data-testid="user-list"]')).toContainText('maria@comprador.com');
  });
});

test.describe('Navegação Global', () => {
  test('deve alternar entre temas', async ({ page }) => {
    await page.goto('/login/buyer');
    
    // Tema padrão (light)
    await expect(page.locator('html')).not.toHaveClass('dark');
    
    // Alternar para dark
    await page.click('[data-testid="theme-toggle"]');
    await expect(page.locator('html')).toHaveClass('dark');
    
    // Voltar para light
    await page.click('[data-testid="theme-toggle"]');
    await expect(page.locator('html')).not.toHaveClass('dark');
  });

  test('deve mostrar notificações', async ({ page }) => {
    // Login como qualquer usuário
    await page.goto('/login/buyer');
    await page.fill('[data-testid="email"]', 'maria@comprador.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="submit-button"]');
    
    await page.waitForURL('/buyer/dashboard');

    // Abrir centro de notificações
    await page.click('[data-testid="notifications-toggle"]');
    await expect(page.locator('[data-testid="notifications-panel"]')).toBeVisible();
  });

  test('deve fazer busca global', async ({ page }) => {
    await page.goto('/');
    
    await page.fill('[data-testid="global-search"]', 'smartphone');
    await page.press('[data-testid="global-search"]', 'Enter');
    
    await expect(page).toHaveURL('/search?q=smartphone');
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
  });
});