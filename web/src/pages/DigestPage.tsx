import { useSendDigest } from '../api/hooks'
import { useToast } from '../components/toast-context'

export function DigestPage() {
  const send = useSendDigest()
  const notify = useToast()

  function sendDigest() {
    send.mutate(undefined, {
      onSuccess: ({ sent }) =>
        notify(sent === 0 ? 'Nenhum match novo acima do score mínimo; nada foi enviado.' : `Digest enviado com ${sent} vaga(s).`),
      onError: (err) => notify(err.message, 'error'),
    })
  }

  return (
    <section className="page">
      <div className="digest-box">
        <p>
          Envia para o Telegram os matches novos (ainda não notificados) com score acima do limite configurado no
          servidor (<code>DIGEST_MIN_SCORE</code>), até <code>DIGEST_LIMIT</code> vagas.
        </p>
        <button type="button" className="btn-primary" onClick={sendDigest} disabled={send.isPending}>
          {send.isPending ? 'Enviando…' : '✉ Enviar digest agora'}
        </button>
      </div>
    </section>
  )
}
