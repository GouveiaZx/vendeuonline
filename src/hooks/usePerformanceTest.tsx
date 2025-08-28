import React, { useState, useEffect, useRef, useCallback } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  fps: number;
  frameCount: number;
  totalItems: number;
}

interface PerformanceTestOptions {
  itemCount: number;
  testDuration?: number;
  warmupRounds?: number;
}

export const usePerformanceTest = (options: PerformanceTestOptions) => {
  const { itemCount, testDuration = 5000, warmupRounds = 2 } = options;
  
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    fps: 0,
    frameCount: 0,
    totalItems: itemCount,
  });
  
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<PerformanceMetrics[]>([]);
  
  const frameCountRef = useRef(0);
  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>();
  const memoryMeasurementsRef = useRef<number[]>([]);

  const measureRenderTime = useCallback(async (renderFunction: () => void) => {
    const startTime = performance.now();
    
    renderFunction();
    
    // Aguardar o próximo frame para medir o tempo real
    await new Promise(resolve => requestAnimationFrame(resolve));
    
    const endTime = performance.now();
    return endTime - startTime;
  }, []);

  const measureMemory = useCallback(() => {
    if ('memory' in performance && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }, []);

  const startFrameCounting = useCallback(() => {
    const countFrame = () => {
      frameCountRef.current++;
      animationFrameRef.current = requestAnimationFrame(countFrame);
    };
    
    frameCountRef.current = 0;
    animationFrameRef.current = requestAnimationFrame(countFrame);
  }, []);

  const stopFrameCounting = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  const runTest = useCallback(async (renderFunction: () => void) => {
    setIsTesting(true);
    setTestResults([]);
    
    // Warmup rounds
    for (let i = 0; i < warmupRounds; i++) {
      await measureRenderTime(renderFunction);
    }
    
    // Clear garbage collector if available
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }
    
    const testResults: PerformanceMetrics[] = [];
    
    for (let round = 0; round < 3; round++) {
      const initialMemory = measureMemory();
      startFrameCounting();
      startTimeRef.current = performance.now();
      
      const renderTime = await measureRenderTime(renderFunction);
      
      stopFrameCounting();
      
      const elapsed = performance.now() - startTimeRef.current;
      const finalMemory = measureMemory();
      
      const result: PerformanceMetrics = {
        renderTime,
        memoryUsage: finalMemory - initialMemory,
        fps: (frameCountRef.current / elapsed) * 1000,
        frameCount: frameCountRef.current,
        totalItems: itemCount,
      };
      
      testResults.push(result);
      setMetrics(result);
      
      // Small delay between rounds
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setTestResults(testResults);
    setIsTesting(false);
    
    return testResults;
  }, [itemCount, warmupRounds, measureRenderTime, measureMemory, startFrameCounting, stopFrameCounting]);

  const getPerformanceGrade = useCallback((metrics: PerformanceMetrics) => {
    const { renderTime, fps } = metrics;
    
    if (renderTime < 16 && fps > 60) return 'EXCELENTE';
    if (renderTime < 33 && fps > 30) return 'BOM';
    if (renderTime < 100 && fps > 15) return 'ACEITÁVEL';
    return 'NECESSITA_MELHORIAS';
  }, []);

  const generateReport = useCallback(() => {
    if (testResults.length === 0) return null;
    
    const avgRenderTime = testResults.reduce((sum, r) => sum + r.renderTime, 0) / testResults.length;
    const avgMemoryUsage = testResults.reduce((sum, r) => sum + r.memoryUsage, 0) / testResults.length;
    const avgFps = testResults.reduce((sum, r) => sum + r.fps, 0) / testResults.length;
    
    const grade = getPerformanceGrade({
      renderTime: avgRenderTime,
      memoryUsage: avgMemoryUsage,
      fps: avgFps,
      frameCount: testResults[0].frameCount,
      totalItems: itemCount,
    });
    
    return {
      itemCount,
      averageRenderTime: Math.round(avgRenderTime * 100) / 100,
      averageMemoryUsage: Math.round(avgMemoryUsage * 100) / 100,
      averageFps: Math.round(avgFps * 100) / 100,
      grade,
      recommendations: getRecommendations(grade, avgRenderTime, avgMemoryUsage),
    };
  }, [testResults, itemCount, getPerformanceGrade]);

  const getRecommendations = (grade: string, renderTime: number, memoryUsage: number) => {
    const recommendations: string[] = [];
    
    if (grade === 'NECESSITA_MELHORIAS') {
      if (renderTime > 100) {
        recommendations.push('Considere implementar lazy loading ou paginação');
        recommendations.push('Reduza a complexidade dos componentes de item');
      }
      
      if (memoryUsage > 50) {
        recommendations.push('Otimize o uso de memória com memorização');
        recommendations.push('Implemente virtualização mais agressiva');
      }
    }
    
    if (grade === 'ACEITÁVEL') {
      recommendations.push('Considere otimizações adicionais para melhor UX');
    }
    
    return recommendations;
  };

  useEffect(() => {
    return () => {
      stopFrameCounting();
    };
  }, [stopFrameCounting]);

  return {
    metrics,
    isTesting,
    testResults,
    runTest,
    generateReport,
    getPerformanceGrade,
  };
};

// Utilitários de performance extraídos para fora
const performanceUtils = {
  measureRenderTime: async (renderFunction: () => void) => {
    const startTime = performance.now();
    renderFunction();
    await new Promise(resolve => requestAnimationFrame(resolve));
    const endTime = performance.now();
    return endTime - startTime;
  },

  measureMemory: () => {
    if ('memory' in performance && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }
};

// Hook específico para testar virtualização
export const useVirtualizationTest = () => {
  const [testData, setTestData] = useState<any[]>([]);
  
  const generateTestData = useCallback((count: number) => {
    return Array.from({ length: count }, (_, index) => ({
      id: `item-${index}`,
      name: `Item ${index + 1}`,
      description: `Descrição do item ${index + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
      image: `https://picsum.photos/200/150?random=${index}`,
      rating: Math.round((Math.random() * 2 + 3) * 10) / 10,
      price: Math.round(Math.random() * 1000),
      category: ['A', 'B', 'C', 'D'][index % 4],
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
    }));
  }, []);

  const runVirtualizationTest = useCallback(async (itemCount: number) => {
    const data = generateTestData(itemCount);
    setTestData(data);
    
    // Função de renderização para teste
    const renderFunction = () => {
      // Simula a renderização de uma lista virtualizada
      const container = document.createElement('div');
      container.style.height = '600px';
      container.style.overflow = 'auto';
      
      // Simula renderização de 20 itens visíveis
      for (let i = 0; i < 20; i++) {
        const item = document.createElement('div');
        item.style.height = '120px';
        item.style.border = '1px solid #ccc';
        item.style.margin = '4px';
        item.style.padding = '8px';
        item.textContent = data[i]?.name || `Item ${i}`;
        container.appendChild(item);
      }
      
      document.body.appendChild(container);
      document.body.removeChild(container);
    };
    
    // Executar teste de renderização
    const initialMemory = performanceUtils.measureMemory();
    const renderTime = await performanceUtils.measureRenderTime(renderFunction);
    const finalMemory = performanceUtils.measureMemory();
    
    const results = {
      renderTime,
      memoryUsage: finalMemory - initialMemory,
      fps: 60, // Estimativa
      frameCount: 1,
      totalItems: itemCount,
    };
    
    const getGrade = (renderTime: number) => {
      if (renderTime < 16) return 'EXCELENTE';
      if (renderTime < 33) return 'BOM';
      if (renderTime < 100) return 'ACEITÁVEL';
      return 'NECESSITA_MELHORIAS';
    };
    
    const grade = getGrade(renderTime);
    
    const report = {
      itemCount,
      averageRenderTime: Math.round(renderTime * 100) / 100,
      averageMemoryUsage: Math.round(results.memoryUsage * 100) / 100,
      averageFps: 60,
      grade,
      recommendations: grade === 'NECESSITA_MELHORIAS' 
        ? ['Considere implementar lazy loading ou paginação', 'Reduza a complexidade dos componentes']
        : grade === 'ACEITÁVEL' 
        ? ['Considere otimizações adicionais para melhor UX']
        : [],
    };
    
    return { results, report, testData: data };
  }, [generateTestData]);

  return {
    testData,
    generateTestData,
    runVirtualizationTest,
  };
};

// Componente de UI para exibir resultados de teste
export const PerformanceTestResults: React.FC<{
  report: any;
}> = ({ report }) => {
  if (!report) return null;

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'EXCELENTE': return 'success.main';
      case 'BOM': return 'info.main';
      case 'ACEITÁVEL': return 'warning.main';
      case 'NECESSITA_MELHORIAS': return 'error.main';
      default: return 'text.secondary';
    }
  };

  return (
    <div style={{ padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
      <h3>Resultados do Teste de Performance</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div>
          <strong>Total de Itens:</strong> {report.itemCount}
        </div>
        <div>
          <strong>Tempo Médio de Renderização:</strong> {report.averageRenderTime}ms
        </div>
        <div>
          <strong>Uso Médio de Memória:</strong> {report.averageMemoryUsage}MB
        </div>
        <div>
          <strong>FPS Médio:</strong> {report.averageFps}
        </div>
        <div>
          <strong>Classificação:</strong> 
          <span style={{ color: getGradeColor(report.grade), fontWeight: 'bold' }}>
            {report.grade}
          </span>
        </div>
      </div>
      
      {report.recommendations.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <h4>Recomendações:</h4>
          <ul>
            {report.recommendations.map((rec: string, index: number) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};