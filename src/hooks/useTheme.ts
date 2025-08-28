import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

export function useTheme() {
  // Inicializar sempre com 'light' no servidor para evitar hidratação mismatch
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  // Primeiro useEffect: inicializar tema apenas no cliente
  useEffect(() => {
    setMounted(true);
    
    // Determinar tema inicial apenas no cliente
    let initialTheme: Theme = 'light';
    
    try {
      const savedTheme = localStorage.getItem('theme') as Theme;
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        initialTheme = savedTheme;
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        initialTheme = 'dark';
      }
    } catch (error) {
      console.warn('Error accessing localStorage or matchMedia:', error);
    }
    
    setTheme(initialTheme);
  }, []);

  // Segundo useEffect: aplicar tema e salvar no localStorage
  useEffect(() => {
    if (!mounted) return;
    
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    
    try {
      localStorage.setItem('theme', theme);
    } catch (error) {
      console.warn('Error saving theme to localStorage:', error);
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return {
    theme,
    toggleTheme,
    isDark: theme === 'dark',
    mounted // Expor mounted para componentes que precisam esperar hidratação
  };
} 