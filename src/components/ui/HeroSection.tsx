import { Search, MapPin, Star, Store, Package, ChevronDown } from 'lucide-react';
import SafeIcon from './SafeIcon';

export default function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-blue-500 via-purple-600 to-purple-700 text-white py-24 overflow-hidden">
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
      <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight tracking-tight">
            Vendeu Online
            <span className="block text-yellow-300">Erechim-RS</span>
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 max-w-4xl mx-auto leading-relaxed font-light">
            Marketplace e classificados locais de Erechim. Compre e venda com segurança!
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-5xl mx-auto mb-20">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/20">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative group">
                  <SafeIcon name="Search" className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 group-focus-within:text-blue-500 transition-colors duration-200" />
                  <input
                    type="text"
                    placeholder="O que você está procurando?"
                    className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 shadow-sm hover:shadow-md focus:shadow-lg transition-all duration-300 text-lg"
                  />
                </div>
              </div>
              <div className="md:w-72">
                <div className="relative group">
                  <SafeIcon name="MapPin" className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 group-focus-within:text-blue-500 transition-colors duration-200" />
                  <select className="w-full pl-12 pr-10 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 appearance-none shadow-sm hover:shadow-md focus:shadow-lg transition-all duration-300 text-lg">
                    <option>Erechim, RS</option>
                    <option>Getúlio Vargas, RS</option>
                    <option>Passo Fundo, RS</option>
                    <option>Marcelino Ramos, RS</option>
                  </select>
                  <SafeIcon name="ChevronDown" className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
                </div>
              </div>
              <button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-10 py-4 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95">
                Buscar
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div className="group">
            <div className="flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <div className="bg-yellow-400/20 p-3 rounded-full mr-4">
                <SafeIcon name="Store" className="h-8 w-8 text-yellow-400" />
              </div>
              <span className="text-4xl font-bold">150+</span>
            </div>
            <p className="text-blue-100 text-lg font-medium">Vendedores Locais</p>
          </div>
          <div className="group">
            <div className="flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <div className="bg-yellow-400/20 p-3 rounded-full mr-4">
                <SafeIcon name="Package" className="h-8 w-8 text-yellow-400" />
              </div>
              <span className="text-4xl font-bold">5k+</span>
            </div>
            <p className="text-blue-100 text-lg font-medium">Anúncios Ativos</p>
          </div>
          <div className="group">
            <div className="flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <div className="bg-yellow-400/20 p-3 rounded-full mr-4">
                <SafeIcon name="Star" className="h-8 w-8 text-yellow-400 fill-current" />
              </div>
              <span className="text-4xl font-bold">4.8</span>
            </div>
            <p className="text-blue-100 text-lg font-medium">Avaliação Média</p>
          </div>
        </div>
      </div>
    </section>
  );
}