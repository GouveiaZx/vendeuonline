import { useState, useEffect } from 'react'

export interface Region {
  city: string
  state: string
  label: string
}

export interface RegionStats {
  city: string
  state: string
  label: string
  storeCount: number
}

export interface RegionsData {
  cities: Region[]
  states: string[]
  stats: RegionStats[]
}

export function useRegions(search?: string) {
  const [regions, setRegions] = useState<RegionsData>({
    cities: [],
    states: [],
    stats: []
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRegions = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const params = new URLSearchParams()
        if (search) params.append('search', search)
        
        const response = await fetch(`/api/regions?${params}`)
        
        if (!response.ok) {
          throw new Error('Erro ao buscar regiões')
        }
        
        const data = await response.json()
        setRegions(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }

    fetchRegions()
  }, [search])

  return { regions, loading, error }
}

export function useRegionSearch() {
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  const { regions, loading, error } = useRegions(debouncedSearch)

  return {
    searchTerm,
    setSearchTerm,
    regions,
    loading,
    error
  }
}