/**
 * Validação de variáveis de ambiente críticas
 * Este arquivo garante que todas as variáveis necessárias estão configuradas
 */

interface RequiredEnvVars {
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  
  // JWT
  JWT_SECRET: string;
  
  // App
  APP_NAME?: string;
  APP_URL?: string;
  APP_ENV?: string;
}

export function validateEnvironment(): RequiredEnvVars {
  const env = process.env;
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'JWT_SECRET'
  ];
  
  const missing: string[] = [];
  
  for (const varName of requiredVars) {
    if (!env[varName]) {
      missing.push(varName);
    }
  }
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.'
    );
  }
  
  // Validar formato das URLs
  try {
    new URL(env.NEXT_PUBLIC_SUPABASE_URL!);
  } catch {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL must be a valid URL');
  }
  
  // Validar JWT Secret
  if (env.JWT_SECRET!.length < 32) {
    console.warn('JWT_SECRET should be at least 32 characters long for security');
  }
  
  return {
    NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL!,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY,
    JWT_SECRET: env.JWT_SECRET!,
    APP_NAME: env.APP_NAME || 'Marketplace Multivendedor',
    APP_URL: env.APP_URL || 'http://localhost:3000',
    APP_ENV: env.APP_ENV || env.NODE_ENV || 'development'
  };
}

// Validar no startup (apenas server-side)
if (typeof window === 'undefined') {
  try {
    validateEnvironment();
  } catch (error) {
    console.error('Environment validation failed:', error);
    process.exit(1);
  }
}