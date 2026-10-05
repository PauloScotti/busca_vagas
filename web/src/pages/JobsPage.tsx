import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router'
import { useCollectJobs, useJobs } from '../api/hooks'
import { JOB_SOURCES, type JobSource, type JobsQuery } from '../api/types'
import { JobCard } from '../components/JobCard'
import { Pagination } from '../components/Pagination'
import { EmptyState, ErrorState } from '../components/States'
import { useToast } from '../components/toast-context'
import { splitList } from '../lib/format'

const PAGE_SIZE = 20

function parseQuery(params: URLSearchParams): JobsQuery {
  const source = params.get('source')
  const remote = params.get('remote')
  return {
    q: params.get('q') || undefined,
    source: JOB_SOURCES.includes(source as JobSource) ? (source as JobSource) : undefined,
    remote: remote === 'true' ? true : remote === 'false' ? false : undefined,
    page: Math.max(1, Number(params.get('page')) || 1),
    pageSize: PAGE_SIZE,
  }
}

export function JobsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = parseQuery(searchParams)
  const jobs = useJobs(query)
  const collect = useCollectJobs()
  const notify = useToast()
  const [terms, setTerms] = useState('')

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const next = new URLSearchParams()
    for (const key of ['q', 'source', 'remote']) {
      const value = String(form.get(key) ?? '').trim()
      if (value) next.set(key, value)
    }
    setSearchParams(next)
  }

  function goToPage(page: number) {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(page))
    setSearchParams(next)
  }

  function runCollect() {
    const searchTerms = splitList(terms)
    collect.mutate(searchTerms.length ? searchTerms : undefined, {
      onSuccess: (r) =>
        notify(`Coleta concluída: ${r.received} recebidas, ${r.persisted} salvas, ${r.skippedDuplicates} duplicadas.`),
      onError: (err) => notify(err.message, 'error'),
    })
  }

  return (
    <section className="page">
      <div className="toolbar">
        <form key={searchParams.toString()} className="filters" onSubmit={applyFilters} role="search">
          <input
            type="search"
            name="q"
            defaultValue={query.q}
            placeholder="Buscar por título ou empresa…"
            maxLength={100}
            aria-label="Buscar"
          />
          <select name="source" defaultValue={query.source ?? ''} aria-label="Fonte">
            <option value="">Todas as fontes</option>
            {JOB_SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select name="remote" defaultValue={query.remote === undefined ? '' : String(query.remote)} aria-label="Modalidade">
            <option value="">Remoto: qualquer</option>
            <option value="true">Somente remoto</option>
            <option value="false">Somente presencial</option>
          </select>
          <button type="submit">Filtrar</button>
        </form>

        <div className="actions">
          <input
            type="text"
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            placeholder="Termos (opcional): nestjs, react"
            aria-label="Termos de coleta"
          />
          <button type="button" className="btn-primary" onClick={runCollect} disabled={collect.isPending}>
            {collect.isPending ? 'Coletando…' : '↻ Coletar vagas'}
          </button>
        </div>
      </div>

      {jobs.isPending ? (
        <EmptyState>Carregando…</EmptyState>
      ) : jobs.isError ? (
        <ErrorState error={jobs.error} onRetry={() => void jobs.refetch()} />
      ) : jobs.data.items.length === 0 ? (
        <EmptyState>Nenhuma vaga encontrada. Ajuste os filtros ou dispare uma coleta.</EmptyState>
      ) : (
        <>
          <div className={`card-list${jobs.isPlaceholderData ? ' is-stale' : ''}`}>
            {jobs.data.items.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
          <Pagination {...jobs.data} onChange={goToPage} />
        </>
      )}
    </section>
  )
}
