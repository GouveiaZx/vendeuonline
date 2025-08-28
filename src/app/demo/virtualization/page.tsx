"use client";
import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  Chip, 
  Divider,
  LinearProgress,
  Alert
} from '@mui/material';
import { usePerformanceTest, useVirtualizationTest, PerformanceTestResults } from '@/hooks/usePerformanceTest';
import { VirtualizedStoreListExample, useViewMode } from '@/components/virtualized/VirtualizedStoreListExample';
import { Speed, Memory, TrendingUp, Info } from '@mui/icons-material';

export default function VirtualizationDemoPage() {
  const [currentTest, setCurrentTest] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<any>(null);
  
  const { viewMode, toggleViewMode } = useViewMode();
  const { runVirtualizationTest } = useVirtualizationTest();
  
  const testScenarios = [
    { name: '100 lojas', count: 100 },
    { name: '1.000 lojas', count: 1000 },
    { name: '5.000 lojas', count: 5000 },
    { name: '10.000 lojas', count: 10000 },
  ];

  const runPerformanceTest = async (itemCount: number) => {
    setCurrentTest(`Testando com ${itemCount.toLocaleString()} itens...`);
    setTestResults(null);
    
    try {
      const { report } = await runVirtualizationTest(itemCount);
      setTestResults(report);
    } catch (error) {
      console.error('Erro no teste de performance:', error);
    } finally {
      setCurrentTest(null);
    }
  };

  const PerformanceCard = ({ title, value, icon, color }: any) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2}>
          <Box 
            sx={{ 
              color: `${color}.main`, 
              display: 'flex', 
              alignItems: 'center' 
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography variant="h6" component="div">
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" gutterBottom>
          Demo: Virtualização de Listas
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Teste de performance com react-window para grandes datasets
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          Esta demonstração mostra como a virtualização mantém performance constante mesmo com milhares de itens.
          Use os controles abaixo para testar diferentes cenários.
        </Typography>
      </Alert>

      {/* Seção de Testes de Performance */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Testes de Performance
        </Typography>
        
        <Grid container spacing={3}>
          {testScenarios.map((scenario) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={scenario.name}>
              <Button
                variant="contained"
                fullWidth
                onClick={() => runPerformanceTest(scenario.count)}
                disabled={currentTest !== null}
                sx={{ height: 60 }}
              >
                {scenario.name}
              </Button>
            </Grid>
          ))}
        </Grid>

        {currentTest && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              {currentTest}
            </Typography>
            <LinearProgress />
          </Box>
        )}

        {testResults && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Resultados do Teste
            </Typography>
            
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <PerformanceCard
                  title="Tempo de Renderização"
                  value={`${testResults.averageRenderTime}ms`}
                  icon={<Speed />}
                  color="primary"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <PerformanceCard
                  title="Uso de Memória"
                  value={`${testResults.averageMemoryUsage}MB`}
                  icon={<Memory />}
                  color="secondary"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <PerformanceCard
                  title="FPS Médio"
                  value={`${testResults.averageFps}`}
                  icon={<TrendingUp />}
                  color="success"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <PerformanceCard
                  title="Classificação"
                  value={testResults.grade}
                  icon={<Info />}
                  color={
                    testResults.grade === 'EXCELENTE' ? 'success' :
                    testResults.grade === 'BOM' ? 'info' :
                    testResults.grade === 'ACEITÁVEL' ? 'warning' : 'error'
                  }
                />
              </Grid>
            </Grid>

            <PerformanceTestResults report={testResults} />
          </Box>
        )}
      </Paper>

      {/* Seção de Demonstração Visual */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5">
            Demonstração Visual
          </Typography>
          <Button
            variant="outlined"
            onClick={toggleViewMode}
            startIcon={viewMode === 'list' ? <TrendingUp /> : <Speed />}
          >
            {viewMode === 'list' ? 'Ver em Grid' : 'Ver em Lista'}
          </Button>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Chip 
            label={`Modo: ${viewMode === 'list' ? 'Lista' : 'Grid'}`} 
            color="primary" 
            variant="outlined" 
          />
        </Box>

        <VirtualizedStoreListExample viewMode={viewMode} />
      </Paper>

      {/* Seção de Dicas de Performance */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Dicas de Performance
        </Typography>
        
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h6" gutterBottom>
              Virtualização Eficiente
            </Typography>
            <Typography variant="body2" component="ul">
              <li>Use altura fixa quando possível</li>
              <li>Evite re-renders desnecessários</li>
              <li>Implemente memorização de componentes</li>
              <li>Use lazy loading para imagens</li>
            </Typography>
          </Grid>
          
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h6" gutterBottom>
              Melhores Práticas
            </Typography>
            <Typography variant="body2" component="ul">
              <li>Teste com diferentes tamanhos de datasets</li>
              <li>Monitore uso de memória em produção</li>
              <li>Implemente paginação virtual</li>
              <li>Use debounce para filtros dinâmicos</li>
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />
        
        <Typography variant="body2" color="text.secondary">
          <strong>Nota:</strong> Os valores de performance podem variar dependendo do dispositivo, 
          navegador e outros fatores do sistema. Use estes testes como referência para ajustar 
          suas implementações.
        </Typography>
      </Paper>
    </Container>
  );
}