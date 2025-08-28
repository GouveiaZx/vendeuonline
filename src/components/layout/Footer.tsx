'use client';

import { Store, Mail, Phone, MapPin, Facebook, Instagram, Twitter, Youtube, Heart, Shield, Truck, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { APP_CONFIG } from '@/config/app';
import Logo from '@/components/ui/Logo';
import SafeIcon from '@/components/ui/SafeIcon';
export default function Footer() {
  
  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer Content */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Logo size="sm" variant="white" showText={false} />
              <div>
                <h3 className="text-xl font-bold text-white">{APP_CONFIG.name}</h3>
                <p className="text-sm text-gray-400">Marketplace de Erechim-RS</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              A plataforma que conecta compradores e vendedores em Erechim e região. 
              Encontre produtos locais com segurança e praticidade.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
                <SafeIcon name="Facebook" className="h-4 w-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-pink-600 transition-colors">
                <SafeIcon name="Instagram" className="h-4 w-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-400 transition-colors">
                <SafeIcon name="Twitter" className="h-4 w-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
                <SafeIcon name="Youtube" className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Links Rápidos</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Página Inicial
                </Link>
              </li>
              <li>
                <Link href="/products" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Todos os Produtos
                </Link>
              </li>
              <li>
                <Link href="/stores" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Lojas Parceiras
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Planos e Preços
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Sobre Nós
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Perguntas Frequentes
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Suporte</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Central de Ajuda
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-300 hover:text-white transition-colors text-sm">
                  PolÃ­tica de Privacidade
                </Link>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Como Vender
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Como Comprar
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">
                  SeguranÃ§a
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Contato</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <SafeIcon name="MapPin" className="h-4 w-4 text-blue-400 flex-shrink-0" />
                <span className="text-gray-300 text-sm">
                  Erechim, Rio Grande do Sul
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <SafeIcon name="Phone" className="h-4 w-4 text-blue-400 flex-shrink-0" />
                <span className="text-gray-300 text-sm">
                  (54) 9999-9999
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <SafeIcon name="Mail" className="h-4 w-4 text-blue-400 flex-shrink-0" />
                <span className="text-gray-300 text-sm">
                  contato@vendeuonline.com.br
                </span>
              </div>
            </div>
            
            {/* Trust Badges */}
            <div className="pt-4">
              <h5 className="text-sm font-medium text-white mb-3">SeguranÃ§a e ConfianÃ§a</h5>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2 bg-gray-800 rounded-lg p-2">
                  <SafeIcon name="Shield" className="h-4 w-4 text-green-400" />
                  <span className="text-xs text-gray-300">SSL Seguro</span>
                </div>
                <div className="flex items-center space-x-2 bg-gray-800 rounded-lg p-2">
                  <SafeIcon name="CreditCard" className="h-4 w-4 text-blue-400" />
                  <span className="text-xs text-gray-300">Pag. Seguro</span>
                </div>
                <div className="flex items-center space-x-2 bg-gray-800 rounded-lg p-2">
                  <SafeIcon name="Truck" className="h-4 w-4 text-orange-400" />
                  <span className="text-xs text-gray-300">Entrega Local</span>
                </div>
                <div className="flex items-center space-x-2 bg-gray-800 rounded-lg p-2">
                  <SafeIcon name="Heart" className="h-4 w-4 text-red-400" />
                  <span className="text-xs text-gray-300">Suporte 24h</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-gray-400">
              Â© 2024 {APP_CONFIG.name}. Todos os direitos reservados.
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <span>Desenvolvido com</span>
              <SafeIcon name="Heart" className="h-4 w-4 text-red-500" />
              <span>em Erechim-RS</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
