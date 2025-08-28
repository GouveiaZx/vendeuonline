/**
 * Componente seguro para renderização de data/hora que evita problemas de hidratação
 */

import { useState, useEffect } from 'react'

interface SafeDateTimeProps {
  date: string | Date
  format?: 'date' | 'datetime' | 'relative' | 'expiry'
  fallback?: string
}

export default function SafeDateTime({ 
  date, 
  format = 'date', 
  fallback = 'Carregando...' 
}: SafeDateTimeProps) {
  const [isClient, setIsClient] = useState(false)
  const [formattedDate, setFormattedDate] = useState(fallback)

  useEffect(() => {
    setIsClient(true)
    
    const dateObj = new Date(date)
    
    if (isNaN(dateObj.getTime())) {
      setFormattedDate('Data inválida')
      return
    }

    const now = new Date()
    
    switch (format) {
      case 'date':
        setFormattedDate(dateObj.toLocaleDateString('pt-BR'))
        break
        
      case 'datetime':
        setFormattedDate(dateObj.toLocaleString('pt-BR'))
        break
        
      case 'relative': {
        const diffTime = now.getTime() - dateObj.getTime()
        const diffMinutes = Math.floor(diffTime / (1000 * 60))
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
        
        if (diffMinutes < 1) {
          setFormattedDate('Agora mesmo')
        } else if (diffMinutes < 60) {
          setFormattedDate(`${diffMinutes} min atrás`)
        } else if (diffHours < 24) {
          setFormattedDate(`${diffHours}h atrás`)
        } else if (diffDays < 7) {
          setFormattedDate(`${diffDays} dias atrás`)
        } else {
          setFormattedDate(dateObj.toLocaleDateString('pt-BR'))
        }
        break
      }
        
      case 'expiry': {
        const diffTime = dateObj.getTime() - now.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        
        if (diffDays < 0) {
          setFormattedDate('Expirado')
        } else if (diffDays === 0) {
          setFormattedDate('Expira hoje')
        } else if (diffDays === 1) {
          setFormattedDate('Expira amanhã')
        } else if (diffDays <= 7) {
          setFormattedDate(`Expira em ${diffDays} dias`)
        } else {
          setFormattedDate(`Expira em ${dateObj.toLocaleDateString('pt-BR')}`)
        }
        break
      }
        
      default:
        setFormattedDate(dateObj.toLocaleDateString('pt-BR'))
    }
  }, [date, format, isClient])

  // Durante SSR, mostrar apenas a data formatada simples
  if (!isClient) {
    const dateObj = new Date(date)
    if (isNaN(dateObj.getTime())) {
      return <span>{fallback}</span>
    }
    return <span>{dateObj.toLocaleDateString('pt-BR')}</span>
  }

  return <span>{formattedDate}</span>
}