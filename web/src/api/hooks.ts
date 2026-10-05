import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import type { JobsQuery, MatchesQuery, ProfileInput } from './types'

export const queryKeys = {
  jobs: (query: JobsQuery) => ['jobs', query] as const,
  matches: (query: MatchesQuery) => ['matches', query] as const,
  profile: ['profile'] as const,
}

export function useJobs(query: JobsQuery) {
  return useQuery({
    queryKey: queryKeys.jobs(query),
    queryFn: () => api.listJobs(query),
    placeholderData: keepPreviousData,
  })
}

export function useCollectJobs() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (searchTerms?: string[]) => api.collectJobs(searchTerms),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['jobs'] }),
  })
}

export function useMatches(query: MatchesQuery) {
  return useQuery({
    queryKey: queryKeys.matches(query),
    queryFn: () => api.listMatches(query),
    placeholderData: keepPreviousData,
  })
}

export function useRunMatching() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.runMatching,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['matches'] }),
  })
}

export function useProfile() {
  return useQuery({ queryKey: queryKeys.profile, queryFn: api.getProfile })
}

export function useSaveProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ProfileInput) => api.saveProfile(input),
    onSuccess: (profile) => queryClient.setQueryData(queryKeys.profile, profile),
  })
}

export function useSendDigest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: api.sendDigest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['matches'] }),
  })
}
