import { formatters } from '../formatters'

describe('Formatters', () => {
  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      expect(formatters.formatCurrency(1234.56)).toMatch(/R\$\s?1\.234,56/)
      expect(formatters.formatCurrency(0)).toMatch(/R\$\s?0,00/)
      expect(formatters.formatCurrency(999.99)).toMatch(/R\$\s?999,99/)
      expect(formatters.formatCurrency(1000)).toMatch(/R\$\s?1\.000,00/)
    })

    it('should handle negative values', () => {
      expect(formatters.formatCurrency(-123.45)).toMatch(/-R\$\s?123,45/)
    })

    it('should handle very large numbers', () => {
      expect(formatters.formatCurrency(1234567.89)).toMatch(/R\$\s?1\.234\.567,89/)
    })
  })

  describe('formatPhone', () => {
    it('should format phone numbers correctly', () => {
      expect(formatters.formatPhone('11987654321')).toBe('(11) 98765-4321')
      expect(formatters.formatPhone('1133334444')).toBe('(11) 3333-4444')
    })

    it('should handle incomplete phone numbers', () => {
      expect(formatters.formatPhone('11987')).toBe('11987') // Retorna sem formatação para números incompletos
      expect(formatters.formatPhone('119')).toBe('119')
    })

    it('should handle empty or invalid input', () => {
      expect(formatters.formatPhone('')).toBe('')
      expect(formatters.formatPhone('abc')).toBe('abc')
    })
  })

  describe('formatCPF', () => {
    it('should format CPF correctly', () => {
      expect(formatters.formatCPF('12345678901')).toBe('123.456.789-01')
    })

    it('should handle incomplete CPF', () => {
      expect(formatters.formatCPF('123456')).toBe('123456') // Retorna sem formatação para CPF incompleto
      expect(formatters.formatCPF('123')).toBe('123')
    })

    it('should handle empty input', () => {
      expect(formatters.formatCPF('')).toBe('')
    })
  })

  describe('formatCNPJ', () => {
    it('should format CNPJ correctly', () => {
      expect(formatters.formatCNPJ('12345678000195')).toBe('12.345.678/0001-95')
    })

    it('should handle incomplete CNPJ', () => {
      expect(formatters.formatCNPJ('123456780')).toBe('12.345.678/0')
      expect(formatters.formatCNPJ('123456')).toBe('12.345.6')
    })
  })

  describe('formatDate', () => {
    it('should format dates correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      expect(formatters.formatDate(date)).toBe('15/01/2024')
    })

    it('should format date strings', () => {
      const result = formatters.formatDate('2024-01-15')
      // Allow for timezone differences - just check that it's a valid date format
      expect(result).toMatch(/^\d{1,2}\/\d{1,2}\/2024$/)
      expect(result.includes('2024')).toBe(true)
    })
  })

  describe('formatDateTime', () => {
    it('should format date and time correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      const result = formatters.formatDateTime(date)
      // Check that it contains date and time components
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/2024.*\d{1,2}:\d{2}/)
      expect(result.includes('2024')).toBe(true)
    })
  })

  describe('formatTimeAgo', () => {
    it('should format time ago correctly', () => {
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      
      expect(formatters.formatTimeAgo(oneHourAgo)).toMatch(/1h atrás/)
      expect(formatters.formatTimeAgo(oneDayAgo)).toMatch(/1d atrás/)
    })
  })

  describe('formatCEP', () => {
    it('should format CEP correctly', () => {
      expect(formatters.formatCEP('01234567')).toBe('01234-567')
    })

    it('should handle incomplete CEP', () => {
      expect(formatters.formatCEP('01234')).toBe('01234')
    })
  })

  describe('formatFileSize', () => {
    it('should format file sizes correctly', () => {
      expect(formatters.formatFileSize(1024)).toBe('1 KB')
      expect(formatters.formatFileSize(1048576)).toBe('1 MB')
      expect(formatters.formatFileSize(1073741824)).toBe('1 GB')
      expect(formatters.formatFileSize(500)).toBe('500 Bytes')
    })
  })

  describe('formatPercentage', () => {
    it('should format percentages correctly', () => {
      expect(formatters.formatPercentage(50)).toBe('50,0%')
      expect(formatters.formatPercentage(12.34)).toBe('12,3%')
      expect(formatters.formatPercentage(100)).toBe('100,0%')
    })
  })
})