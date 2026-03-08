import type { ApiErrorResponse } from '@/types/api'

const API_BASE_URL = (
  import.meta.env.API_BASE_URL ||
  'https://dr-stone-api-production.up.railway.app'
).replace(/\/$/, '')

export class ApiClientError extends Error {
  public readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiClientError'
    this.status = status
  }
}

export async function apiRequest<TResponse>(
  path: string,
  init?: RequestInit
): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {})
    }
  })

  if (response.status === 204) {
    return undefined as TResponse
  }

  const data = (await response.json().catch(() => null)) as TResponse | ApiErrorResponse | null

  if (!response.ok) {
    const message =
      data && typeof data === 'object' && 'error' in data ? String(data.error) : `Request failed: ${response.status}`
    throw new ApiClientError(message, response.status)
  }

  return data as TResponse
}
