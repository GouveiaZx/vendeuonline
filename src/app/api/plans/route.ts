import { NextRequest, NextResponse } from '@/types/api';
import { prisma } from '@/lib/prisma';
import { authMiddleware } from '@/lib/middleware';
import { planSchema } from '@/lib/validation';
import { z } from 'zod';

// GET /api/plans - Listar todos os planos ativos
export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        order: 'asc'
      }
    });

    return NextResponse.json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Erro ao buscar planos:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor'
      },
      { status: 500 }
    );
  }
}

// POST /api/plans - Criar novo plano (apenas admin)
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação e permissão de admin
    const authResult = await authMiddleware(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      );
    }

    const user = authResult.user;
    if (user.type !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = planSchema.parse(body);

    // Verificar se já existe um plano com o mesmo nome ou slug
    const existingPlan = await prisma.plan.findFirst({
      where: {
        OR: [
          { name: validatedData.name },
          { slug: validatedData.slug }
        ]
      }
    });

    if (existingPlan) {
      return NextResponse.json(
        {
          success: false,
          error: 'Já existe um plano com este nome ou slug'
        },
        { status: 400 }
      );
    }

    const plan = await prisma.plan.create({
      data: validatedData as any
    });

    return NextResponse.json(
      {
        success: true,
        data: plan,
        message: 'Plano criado com sucesso'
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Dados inválidos',
          details: error.issues
        },
        { status: 400 }
      );
    }

    console.error('Erro ao criar plano:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor'
      },
      { status: 500 }
    );
  }
}

// PUT /api/plans - Atualizar plano (apenas admin)
export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticação e permissão de admin
    const authResult = await authMiddleware(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      );
    }

    const user = authResult.user;
    if (user.type !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID do plano é obrigatório' },
        { status: 400 }
      );
    }

    const validatedData = planSchema.partial().parse(updateData);

    // Verificar se o plano existe
    const existingPlan = await prisma.plan.findUnique({
      where: { id }
    });

    if (!existingPlan) {
      return NextResponse.json(
        { success: false, error: 'Plano não encontrado' },
        { status: 404 }
      );
    }

    const updatedPlan = await prisma.plan.update({
      where: { id },
      data: validatedData
    });

    return NextResponse.json({
      success: true,
      data: updatedPlan,
      message: 'Plano atualizado com sucesso'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Dados inválidos',
          details: error.issues
        },
        { status: 400 }
      );
    }

    console.error('Erro ao atualizar plano:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor'
      },
      { status: 500 }
    );
  }
}