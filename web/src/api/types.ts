export const JOB_SOURCES = ['remotive', 'gupy', 'greenhouse', 'lever', 'ashby'] as const
export type JobSource = (typeof JOB_SOURCES)[number]

export const SENIORITIES = ['junior', 'pleno', 'senior', 'staff'] as const
export type Seniority = (typeof SENIORITIES)[number]

export interface Job {
  id: string
  source: JobSource
  externalId: string
  title: string
  company: string
  location: string | null
  remote: boolean
  url: string
  description: string
  tags: string[]
  salaryMin: number | null
  salaryMax: number | null
  publishedAt: string | null
  collectedAt: string
}

export interface Match {
  id: string
  jobId: string
  profileId: string
  score: number
  reasons: string[]
  scoredAt: string
  notifiedAt: string | null
  job: Job
}

export interface Profile {
  id: string
  name: string
  skills: string[]
  yearsExperience: number
  seniority: Seniority
  preferences: string
  updatedAt: string
}

export type ProfileInput = Omit<Profile, 'id' | 'updatedAt'>

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface JobsQuery {
  q?: string
  source?: JobSource
  remote?: boolean
  page: number
  pageSize: number
}

export interface MatchesQuery {
  minScore: number
  page: number
  pageSize: number
}

export interface IngestResult {
  received: number
  persisted: number
  skippedDuplicates: number
}

export interface MatchRunResult {
  evaluated: number
  scoredByLlm: number
  discardedByPrefilter: number
}

export interface DigestResult {
  sent: number
}
