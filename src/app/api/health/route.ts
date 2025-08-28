import { NextRequest, NextResponse } from 'next/server';
import { HealthMonitor, MonitoringService } from '@/lib/monitoring';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const start = Date.now();
  
  try {
    const healthMonitor = HealthMonitor.getInstance();
    const healthReport = await healthMonitor.performFullHealthCheck();
    
    // Registrar métrica
    MonitoringService.setTiming('health.check', Date.now() - start);
    
    const status = healthReport.overall === 'healthy' ? 200 : 
                   healthReport.overall === 'degraded' ? 207 : 503;

    return NextResponse.json(healthReport, { 
      status,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    MonitoringService.captureException(error as Error, {
      tags: { endpoint: 'health', method: 'GET' }
    });

    return NextResponse.json(
      {
        overall: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: (error as Error).message,
      },
      { status: 503 }
    );
  }
}