export class Logger {
  private static instance: Logger;
  private isProduction: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] ${message}`;
  }

  log(message: string, ...args: any[]): void {
    if (!this.isProduction) {
      console.log(this.formatMessage('INFO', message), ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (!this.isProduction) {
      console.warn(this.formatMessage('WARN', message), ...args);
    } else {
      // Em produção, podemos enviar para um serviço de monitoramento
      console.warn(this.formatMessage('WARN', message), ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    console.error(this.formatMessage('ERROR', message), ...args);
  }

  debug(message: string, ...args: any[]): void {
    if (!this.isProduction) {
      console.debug(this.formatMessage('DEBUG', message), ...args);
    }
  }
}

// Funções auxiliares para uso fácil
export const logInfo = (message: string, ...args: any[]) => {
  Logger.getInstance().log(message, ...args);
};

export const logWarn = (message: string, ...args: any[]) => {
  Logger.getInstance().warn(message, ...args);
};

export const logError = (message: string, ...args: any[]) => {
  Logger.getInstance().error(message, ...args);
};

export const logDebug = (message: string, ...args: any[]) => {
  Logger.getInstance().debug(message, ...args);
};