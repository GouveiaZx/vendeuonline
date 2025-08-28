/**
 * API Route para obter tokens CSRF
 */

import { createCSRFResponse } from '@/lib/csrf'

export async function GET(): Promise<Response> {
  return createCSRFResponse()
}

export async function POST(): Promise<Response> {
  return createCSRFResponse()
}