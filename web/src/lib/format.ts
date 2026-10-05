const dateFormat = new Intl.DateTimeFormat('pt-BR')
const numberFormat = new Intl.NumberFormat('pt-BR')

export function formatDate(iso: string | null): string | null {
  return iso ? dateFormat.format(new Date(iso)) : null
}

export function formatSalary(min: number | null, max: number | null): string | null {
  if (min && max) return `${numberFormat.format(min)} – ${numberFormat.format(max)}`
  if (min) return `a partir de ${numberFormat.format(min)}`
  if (max) return `até ${numberFormat.format(max)}`
  return null
}

export function scoreLevel(score: number): 'high' | 'mid' | 'low' {
  if (score >= 75) return 'high'
  if (score >= 50) return 'mid'
  return 'low'
}

export function splitList(value: string): string[] {
  return [...new Set(value.split(',').map((s) => s.trim()).filter(Boolean))]
}
