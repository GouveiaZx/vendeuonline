import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    return NextResponse.json({
      status: 'ok',
      timestamp: '2024-01-01T00:00:00.000Z',
      connections: 0, // WebSocket não implementado
      service: 'Next.js API Routes',
      version: process.env.npm_package_version || '1.0.0'
    });
  } catch (error) {
    // Log de erro mantido para debugging crítico
    return NextResponse.json(
      {
        status: 'error',
        timestamp: '2024-01-01T00:00:00.000Z',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

// HEAD /api/status - Health check for monitoring
export async function HEAD(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache',
    },
  });
}