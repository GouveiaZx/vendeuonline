import { VercelRequest, VercelResponse } from '@vercel/node'
import { z } from 'zod'
import { prisma } from '../../src/lib/prisma.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória')
})

function generateToken(payload: any): string {
  const secret = process.env.JWT_SECRET || 'fallback-secret'
  return jwt.sign(payload, secret, { expiresIn: '7d' })
}

function createAuthResponse(user: any, token: string) {
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      type: user.type,
      city: user.city,
      state: user.state,
      phone: user.phone,
      buyer: user.buyer,
      seller: user.seller,
      admin: user.admin
    },
    token
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('[LOGIN] Iniciando handler de login')
  console.log('[LOGIN] Método:', req.method)
  console.log('[LOGIN] Headers:', JSON.stringify(req.headers, null, 2))
  
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    console.log('[LOGIN] Respondendo OPTIONS')
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    console.log('[LOGIN] Método não permitido:', req.method)
    return res.status(405).json({ error: 'Método não permitido' })
  }

  try {
    console.log('[LOGIN] Body recebido:', JSON.stringify(req.body, null, 2))
    console.log('[LOGIN] Testando conexão com Prisma...')
    const { email, password } = loginSchema.parse(req.body)
    console.log('[LOGIN] Dados validados:', { email, passwordLength: password.length })

    // Buscar usuário por email
    console.log('[LOGIN] Buscando usuário por email:', email)
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        buyer: true,
        seller: {
          include: {
            store: true
          }
        },
        admin: true
      }
    })
    console.log('[LOGIN] Usuário encontrado:', user ? 'Sim' : 'Não')

    if (!user) {
      console.log('[LOGIN] Usuário não encontrado')
      return res.status(401).json({ error: 'Credenciais inválidas' })
    }

    // Verificar senha
    console.log('[LOGIN] Verificando senha...')
    const isPasswordValid = await bcrypt.compare(password, user.password)
    console.log('[LOGIN] Senha válida:', isPasswordValid)
    if (!isPasswordValid) {
      console.log('[LOGIN] Senha inválida')
      return res.status(401).json({ error: 'Credenciais inválidas' })
    }

    // Gerar token JWT
    console.log('[LOGIN] Gerando token JWT...')
    const token = generateToken({
      userId: user.id,
      email: user.email,
      type: user.type
    })
    console.log('[LOGIN] Token gerado com sucesso')

    console.log('[LOGIN] Login realizado com sucesso para:', email)
    return res.status(200).json(createAuthResponse(user, token))
  } catch (error) {
    console.error('[LOGIN] Erro capturado:', error)
    console.error('[LOGIN] Stack trace:', error instanceof Error ? error.stack : 'N/A')
    
    if (error instanceof z.ZodError) {
      console.log('[LOGIN] Erro de validação Zod:', error.issues)
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.issues
      })
    }

    // Log específico para erros do Prisma
    if (error && typeof error === 'object' && 'code' in error) {
      console.error('[LOGIN] Erro do Prisma - Code:', (error as any).code)
      console.error('[LOGIN] Erro do Prisma - Message:', (error as any).message)
    }

    console.error('[LOGIN] Erro no login:', error)
    return res.status(500).json({ error: 'Erro interno do servidor' })
  } finally {
    console.log('[LOGIN] Desconectando Prisma...')
    await prisma.$disconnect()
    console.log('[LOGIN] Prisma desconectado')
  }
}