import type { ReactNode } from 'react'
import type { Job } from '../api/types'
import { formatDate, formatSalary } from '../lib/format'

interface JobCardProps {
  job: Job
  aside?: ReactNode
  children?: ReactNode
}

export function JobCard({ job, aside, children }: JobCardProps) {
  const salary = formatSalary(job.salaryMin, job.salaryMax)
  const published = formatDate(job.publishedAt)

  return (
    <article className="card">
      <div className="card-main">
        <h3 className="card-title">
          <a href={job.url} target="_blank" rel="noopener noreferrer">
            {job.title}
          </a>
        </h3>
        <p className="card-company">{job.company}</p>
        <ul className="card-meta">
          <li className={`badge badge-${job.source}`}>{job.source}</li>
          <li>{job.remote ? '🌎 Remoto' : `📍 ${job.location ?? 'Local não informado'}`}</li>
          {salary && <li>💰 {salary}</li>}
          {published && <li>📅 {published}</li>}
        </ul>
        {job.tags.length > 0 && (
          <ul className="tags">
            {job.tags.slice(0, 8).map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        )}
        {children}
      </div>
      {aside && <div className="card-aside">{aside}</div>}
    </article>
  )
}
