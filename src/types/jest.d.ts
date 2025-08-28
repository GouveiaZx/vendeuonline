import '@testing-library/jest-dom'

// Ensure jest-dom matchers are available globally
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R
      toBeVisible(): R
      toHaveTextContent(text: string | RegExp): R
      toHaveAttribute(attr: string, value?: string): R
      toHaveClass(className: string): R
      toBeDisabled(): R
      toBeEnabled(): R
      toHaveValue(value: string | number): R
    }
  }
}