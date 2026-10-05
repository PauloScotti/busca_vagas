import type {
  DigestResult,
  IngestResult,
  Job,
  JobsQuery,
  Match,
  MatchesQuery,
  MatchRunResult,
  Paginated,
  Profile,
  ProfileInput,
} from './types'

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

interface NestErrorBody {
  message?: string | string[]
  errors?: { path?: (string | number)[]; message: string }[]
}

function errorMessage(status: number, body: NestErrorBody | null): string {
  if (body?.errors?.length) {
    return body.errors.map((e) => (e.path?.length ? `${e.path.join('.')}: ${e.message}` : e.message)).join('; ')
  }
  if (Array.isArray(body?.message)) return body.message.join('; ')
  return body?.message ?? `Erro ${status}`
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  const text = await res.text()
  const body = text ? (JSON.parse(text) as unknown) : null
  if (!res.ok) throw new ApiError(res.status, errorMessage(res.status, body as NestErrorBody | null))
  return body as T
}

function toSearch(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value))
  }
  return search.toString()
}

export const api = {
  listJobs: (query: JobsQuery) => request<Paginated<Job>>(`/jobs?${toSearch({ ...query })}`),
  collectJobs: (searchTerms?: string[]) =>
    request<IngestResult>('/jobs/collect', {
      method: 'POST',
      body: JSON.stringify(searchTerms?.length ? { searchTerms } : {}),
    }),

  listMatches: (query: MatchesQuery) => request<Paginated<Match>>(`/matches?${toSearch({ ...query })}`),
  runMatching: () => request<MatchRunResult>('/matches/run', { method: 'POST' }),

  getProfile: async (): Promise<Profile | null> => {
    try {
      return await request<Profile>('/profile')
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return null
      throw err
    }
  },
  saveProfile: (input: ProfileInput) =>
    request<Profile>('/profile', { method: 'PUT', body: JSON.stringify(input) }),

  sendDigest: () => request<DigestResult>('/digest/send', { method: 'POST' }),
}
