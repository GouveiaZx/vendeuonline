'use client';

import { FC } from 'react';
import { LucideProps } from 'lucide-react';
import { 
  Search, 
  MapPin, 
  Star, 
  Store, 
  Package, 
  ChevronDown,
  Menu,
  X,
  User,
  ShoppingCart,
  Settings,
  LogOut,
  Bell,
  Heart,
  BarChart3,
  Users,
  Shield,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Mail,
  Phone,
  CreditCard,
  Truck
} from 'lucide-react';

// Mapa de ícones disponíveis
const iconMap = {
  Search,
  MapPin,
  Star,
  Store,
  Package,
  ChevronDown,
  Menu,
  X,
  User,
  ShoppingCart,
  Settings,
  LogOut,
  Bell,
  Heart,
  BarChart3,
  Users,
  Shield,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Mail,
  Phone,
  CreditCard,
  Truck
} as const;

export type IconName = keyof typeof iconMap;

interface SafeIconProps extends Omit<LucideProps, 'ref'> {
  name: IconName;
}

/**
 * Wrapper seguro para ícones Lucide que previne erros de hidratação
 * Especialmente útil quando extensões do navegador (como Dark Reader) 
 * modificam atributos dos SVGs
 */
export const SafeIcon: FC<SafeIconProps> = ({ name, ...props }) => {
  const Icon = iconMap[name];
  
  if (!Icon) {
    console.warn(`Icon "${name}" not found in iconMap`);
    return null;
  }
  
  return (
    <Icon 
      {...props} 
      suppressHydrationWarning={true}
    />
  );
};

export default SafeIcon;