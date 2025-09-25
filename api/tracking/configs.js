// API pública para buscar configurações de tracking (sem autenticação) - COM FALLBACK SUPABASE
import { logger } from "../../lib/logger.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    // Tentar Prisma primeiro
    let configs = null;
    let usedFallback = false;

    try {
      configs = await prisma.systemConfig.findMany({
        where: {
          category: "tracking",
          isActive: true,
        },
        select: {
          key: true,
          value: true,
          isActive: true,
        },
      });
      console.log("✅ [TRACKING] Configurações obtidas via Prisma");
    } catch (prismaError) {
      console.warn("⚠️ [TRACKING] Prisma falhou, tentando Supabase direto");

      // Fallback para Supabase fetch direto
      console.log("⚠️ [TRACKING] Tentando fallback com fetch direto...");
      const { getTrackingConfigs } = await import("../../lib/supabase-fetch.js");
      configs = await getTrackingConfigs();
      usedFallback = "supabase-fetch";
      console.log("✅ [TRACKING] Configurações obtidas via Supabase fetch");
    }

    // Converter para formato mais usável
    const configMap = {};
    configs.forEach((config) => {
      configMap[config.key] = {
        value: config.value,
        isActive: config.isActive,
        isConfigured: !!config.value && config.value.trim() !== "",
      };
    });

    return res.status(200).json({
      success: true,
      configs: configMap,
      fallback: usedFallback,
    });
  } catch (error) {
    console.error("❌ [TRACKING] Erro ao buscar configurações:", error);
    console.error("❌ [TRACKING] Erro stack:", error.stack);
    logger.error("Erro ao buscar configurações de tracking:", error);

    // EMERGENCY FALLBACK: Mock data
    console.log("🚨 [TRACKING] Usando mock data de emergência...");
    try {
      const { getMockTrackingConfigs } = await import("../../lib/emergency-mock.js");
      const configMap = getMockTrackingConfigs();

      return res.status(200).json({
        success: true,
        configs: configMap,
        fallback: "emergency-mock",
        warning: "Dados temporários - problemas técnicos sendo resolvidos",
      });
    } catch (mockError) {
      console.error("💥 [TRACKING] Falha total:", mockError.message);
      return res.status(500).json({
        success: false,
        error: "Serviço temporariamente indisponível",
        details: "Todos os fallbacks falharam",
        originalError: error.message,
        mockError: mockError.message,
      });
    }
  }
}
