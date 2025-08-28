import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'

const querySchema = z.object({
  search: z.string().optional(),
  type: z.enum(['cities', 'states', 'all']).default('all'),
  limit: z.string().transform(Number).default('50')
})

// GET - Obter regiões disponíveis (cidades e estados)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = querySchema.parse(Object.fromEntries(searchParams))

    const results: {
      cities: Array<{ city: string; state: string; label: string }>;
      states: string[];
    } = {
      cities: [],
      states: []
    }

    // Buscar estados únicos
    if (query.type === 'states' || query.type === 'all') {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      let statesQuery = supabase
        .from('stores')
        .select('state')
        .eq('is_active', true)
        .not('state', 'is', null)
        .not('state', 'eq', '')
        .limit(query.limit)

      if (query.search) {
        statesQuery = statesQuery.ilike('state', `%${query.search}%`)
      }

      const { data: statesData } = await statesQuery
      
      if (statesData) {
        const uniqueStates = [...new Set(statesData.map(store => store.state))]
        results.states = uniqueStates.filter(Boolean).sort()
      }
    }

    // Buscar cidades únicas
    if (query.type === 'cities' || query.type === 'all') {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      let citiesQuery = supabase
        .from('stores')
        .select('city, state')
        .eq('is_active', true)
        .not('city', 'is', null)
        .not('city', 'eq', '')
        .not('state', 'is', null)
        .not('state', 'eq', '')
        .limit(query.limit)

      if (query.search) {
        citiesQuery = citiesQuery.or(`city.ilike.%${query.search}%,state.ilike.%${query.search}%`)
      }

      const { data: citiesData } = await citiesQuery
      
      if (citiesData) {
        const uniqueCities = citiesData
          .map(store => ({
            city: store.city,
            state: store.state,
            label: `${store.city}, ${store.state}`
          }))
          .filter(item => item.city && item.state)
        
        // Remover duplicatas baseado na combinação cidade + estado
        const seen = new Set()
        results.cities = uniqueCities
          .filter(item => {
            const key = `${item.city}-${item.state}`
            if (seen.has(key)) return false
            seen.add(key)
            return true
          })
          .sort((a, b) => a.label.localeCompare(b.label))
      }
    }

    // Contar lojas por região para estatísticas
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data: allStores } = await supabase
      .from('stores')
      .select('city, state')
      .eq('is_active', true)
      .not('city', 'is', null)
      .not('city', 'eq', '')
      .not('state', 'is', null)
      .not('state', 'eq', '')
    
    // Agrupar e contar manualmente
    const regionCounts: Record<string, { city: string; state: string; count: number }> = {}
    
    if (allStores) {
      allStores.forEach(store => {
        const key = `${store.city}-${store.state}`
        if (!regionCounts[key]) {
          regionCounts[key] = {
            city: store.city,
            state: store.state,
            count: 0
          }
        }
        regionCounts[key].count++
      })
    }
    
    const regionStats = Object.values(regionCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 20) // Top 20 regiões com mais lojas

    return NextResponse.json({
      ...results,
      stats: regionStats.map(stat => ({
        city: stat.city,
        state: stat.state,
        label: `${stat.city}, ${stat.state}`,
        storeCount: stat.count
      }))
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Erro ao buscar regiões:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Exportação já feita acima