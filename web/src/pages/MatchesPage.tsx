import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useMatches, useRunMatching } from '../api/hooks'
import { ApiError } from '../api/client'
import { JobCard } from '../components/JobCard'
import { Pagination } from '../components/Pagination'
import { EmptyState, ErrorState } from '../components/States'
import { useToast } from '../components/toast-context'
import { scoreLevel } from '../lib/format'

const PAGE_SIZE = 20
const DEFAULT_MIN_SCORE = 60

function clampScore(value: string | null): number {
  if (value === null || value === '') return DEFAULT_MIN_SCORE
  const n = Math.trunc(Number(value))
  return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : DEFAULT_MIN_SCORE
}

export function MatchesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const minScore = clampScore(searchParams.get('minScore'))
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const matches = useMatches({ minScore, page, pageSize: PAGE_SIZE })
  const run = useRunMatching()
  const notify = useToast()

  function applyFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setSearchParams({ minScore: String(clampScore(String(form.get('minScore')))) })
  }

  function goToPage(next: number) {
    setSearchParams({ minScore: String(minScore), page: String(next) })
  }

  function runMatching() {
    run.mutate(undefined, {
      onSuccess: (r) =>
        notify(
          `Matching concluído: ${r.evaluated} avaliadas, ${r.scoredByLlm} pontuadas pela LLM, ${r.discardedByPrefilter} descartadas no pré-filtro.`,
        ),
      onError: (err) => notify(err.message, 'error'),
    })
  }

  const needsProfile = run.error instanceof ApiError && run.error.status === 400

  return (
    <section className="page">
      <div className="toolbar">
        <form key={minScore} className="filters" onSubmit={applyFilter}>
          <label className="inline-label">
            Score mínimo
            <input type="number" name="minScore" defaultValue={minScore} min={0} max={100} />
          </label>
          <button type="submit">Filtrar</button>
        </form>
        <div className="actions">
          <button type="button" className="btn-primary" onClick={runMatching} disabled={run.isPending}>
            {run.isPending ? 'Avaliando vagas…' : '▶ Rodar matching'}
          </button>
        </div>
      </div>

      {needsProfile && (
        <p className="hint">
          Você ainda não tem perfil. <Link to="/perfil">Cadastre seu perfil</Link> para rodar o matching.
        </p>
      )}

      {matches.isPending ? (
        <EmptyState>Carregando…</EmptyState>
      ) : matches.isError ? (
        <ErrorState error={matches.error} onRetry={() => void matches.refetch()} />
      ) : matches.data.items.length === 0 ? (
        <EmptyState>Nenhum match com score ≥ {minScore}. Rode o matching ou diminua o score mínimo.</EmptyState>
      ) : (
        <>
          <div className={`card-list${matches.isPlaceholderData ? ' is-stale' : ''}`}>
            {matches.data.items.map((m) => (
              <JobCard
                key={m.id}
                job={m.job}
                aside={
                  <div className={`score score-${scoreLevel(m.score)}`} title="Score de compatibilidade">
                    {m.score}
                  </div>
                }
              >
                {m.reasons.length > 0 && (
                  <ul className="reasons">
                    {m.reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                )}
                {m.notifiedAt && <p className="notified">✓ Enviado no digest</p>}
              </JobCard>
            ))}
          </div>
          <Pagination {...matches.data} onChange={goToPage} />
        </>
      )}
    </section>
  )
}
