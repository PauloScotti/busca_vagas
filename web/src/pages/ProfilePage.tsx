import type { FormEvent } from 'react'
import { useProfile, useSaveProfile } from '../api/hooks'
import { SENIORITIES, type Profile, type Seniority } from '../api/types'
import { EmptyState, ErrorState } from '../components/States'
import { useToast } from '../components/toast-context'
import { formatDate, splitList } from '../lib/format'

const SENIORITY_LABELS: Record<Seniority, string> = {
  junior: 'Júnior',
  pleno: 'Pleno',
  senior: 'Sênior',
  staff: 'Staff',
}

export function ProfilePage() {
  const profile = useProfile()

  if (profile.isPending) return <EmptyState>Carregando…</EmptyState>
  if (profile.isError) return <ErrorState error={profile.error} onRetry={() => void profile.refetch()} />

  return <ProfileForm key={profile.data?.updatedAt ?? 'new'} profile={profile.data} />
}

function ProfileForm({ profile }: { profile: Profile | null }) {
  const save = useSaveProfile()
  const notify = useToast()

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const skills = splitList(String(form.get('skills')))
    if (skills.length === 0) {
      notify('Informe pelo menos uma skill.', 'error')
      return
    }
    save.mutate(
      {
        name: String(form.get('name')).trim(),
        skills,
        yearsExperience: Number(form.get('yearsExperience')),
        seniority: String(form.get('seniority')) as Seniority,
        preferences: String(form.get('preferences') ?? '').trim(),
      },
      {
        onSuccess: () => notify('Perfil salvo.'),
        onError: (err) => notify(err.message, 'error'),
      },
    )
  }

  return (
    <section className="page">
      <form className="profile-form" onSubmit={submit}>
        {!profile && <p className="hint">Nenhum perfil cadastrado ainda. Ele é usado para pontuar as vagas no matching.</p>}
        <label>
          Nome
          <input type="text" name="name" required maxLength={100} defaultValue={profile?.name} />
        </label>
        <label>
          Skills <small>(separadas por vírgula)</small>
          <input
            type="text"
            name="skills"
            required
            placeholder="nestjs, typescript, react"
            defaultValue={profile?.skills.join(', ')}
          />
        </label>
        <div className="row">
          <label>
            Anos de experiência
            <input
              type="number"
              name="yearsExperience"
              required
              min={0}
              max={60}
              defaultValue={profile?.yearsExperience}
            />
          </label>
          <label>
            Senioridade
            <select name="seniority" required defaultValue={profile?.seniority ?? 'pleno'}>
              {SENIORITIES.map((s) => (
                <option key={s} value={s}>
                  {SENIORITY_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          Preferências
          <textarea
            name="preferences"
            maxLength={1000}
            rows={4}
            placeholder="Ex.: prefiro remoto, evitar plantão…"
            defaultValue={profile?.preferences}
          />
        </label>
        <div className="form-footer">
          {profile && <small>Atualizado em {formatDate(profile.updatedAt)}</small>}
          <button type="submit" className="btn-primary" disabled={save.isPending}>
            {save.isPending ? 'Salvando…' : 'Salvar perfil'}
          </button>
        </div>
      </form>
    </section>
  )
}
