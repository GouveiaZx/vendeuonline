'use client';

import { useEffect, useState } from 'react';
import React from 'react';
import { SearchBar } from './SearchBar';

interface SearchBarWrapperProps {
  placeholder?: string;
  showFilters?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  className?: string;
}

/**
 * Wrapper para SearchBar que previne problemas de hydratação
 * Só renderiza o SearchBar após a hidratação completa do cliente
 */
export const SearchBarWrapper = React.memo<SearchBarWrapperProps>((props) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    // Durante SSR ou antes da hidratação, renderiza um placeholder simples
    return (
      <div className={`relative w-full max-w-2xl ${props.className || ''}`}>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder={props.placeholder || "Buscar produtos, lojas..."}
            disabled
            className="block w-full pl-10 pr-20 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm cursor-not-allowed opacity-75"
            readOnly
          />
          <div className="absolute inset-y-0 right-0 flex items-center">
            <button
              disabled
              className="px-4 py-2 mr-1 bg-blue-600 text-white rounded-md opacity-75 cursor-not-allowed text-sm font-medium"
            >
              Buscar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Após a hidratação, renderiza o SearchBar real
  return <SearchBar {...props} />;
});

SearchBarWrapper.displayName = 'SearchBarWrapper';

export default SearchBarWrapper;