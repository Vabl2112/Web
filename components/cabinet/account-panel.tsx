"use client"

import { useId, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { FormAlert } from "@/components/auth/form-alert"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { errorTextOf } from "@/lib/api/errors"
import { useSession } from "@/lib/auth/session"

/** What the API does when an account is deleted (`deleteMe`, AC-34); the privacy policy says the same. */
const CONSEQUENCES = [
  "Войти в аккаунт сразу станет невозможно, все входы на всех устройствах завершатся.",
  "Витрина будет снята с публикации, а письма, ещё не отправленные вам, отменятся.",
  "В течение 30 дней ваши имя, почта и аватар обезличатся.",
  "Собеседники в диалогах увидят «Удалённый пользователь».",
]

/** "Удалить аккаунт" with a question first: the API asks for nothing but the session, so the question is the only guard against a slip. */
function DeleteAccountButton() {
  const router = useRouter()
  const { deleteAccount } = useSession()
  const checkId = useId()
  const [open, setOpen] = useState(false)
  const [understood, setUnderstood] = useState(false)
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  const change = (next: boolean) => {
    if (busy) return
    setOpen(next)
    setUnderstood(false)
    setFailure(null)
  }

  const remove = async () => {
    setBusy(true)
    setFailure(null)
    try {
      await deleteAccount()
      router.push("/account-deleted")
    } catch (error) {
      setFailure(errorTextOf(error))
      setBusy(false)
    }
  }

  return (
    <>
      <Button type="button" variant="destructive" className="w-fit" onClick={() => setOpen(true)}>
        Удалить аккаунт
      </Button>
      <Dialog open={open} onOpenChange={change}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить аккаунт?</DialogTitle>
            <DialogDescription>Это нельзя отменить.</DialogDescription>
          </DialogHeader>
          <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-muted-foreground">
            {CONSEQUENCES.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
          <div className="flex items-start gap-3">
            <Checkbox id={checkId} checked={understood} onCheckedChange={(value) => setUnderstood(value === true)} />
            <Label htmlFor={checkId} className="block text-sm leading-snug font-normal">
              Я понимаю, что аккаунт и витрина будут удалены без возможности восстановления.
            </Label>
          </div>
          {failure ? <FormAlert message={failure} /> : null}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={busy} onClick={() => change(false)}>
              Не удалять
            </Button>
            <Button type="button" variant="destructive" disabled={!understood || busy} onClick={() => void remove()}>
              {busy ? "Удаляем…" : "Удалить навсегда"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/** The page "Аккаунт" of the cabinet: who is signed in, and the deletion of the account. Everybody has it, a creator or not. */
export function AccountPanel() {
  const { account, isLoading } = useSession()
  const dangerId = useId()
  if (isLoading) return <p className="text-sm text-muted-foreground">Загружаем…</p>
  if (account === null) return null
  return (
    <div className="flex max-w-xl flex-col gap-8">
      <section aria-label="Данные аккаунта">
        <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Имя</dt>
          <dd className="break-words">{account.name}</dd>
          <dt className="text-muted-foreground">Почта</dt>
          <dd className="break-words">
            {account.email}{" "}
            {account.emailVerified ? (
              <span className="text-muted-foreground">(подтверждена)</span>
            ) : (
              <Link href="/verify-email" className="underline underline-offset-4">
                подтвердить
              </Link>
            )}
          </dd>
        </dl>
      </section>
      <section aria-labelledby={dangerId} className="flex flex-col gap-3 rounded-2xl border border-destructive/40 p-5">
        <h2 id={dangerId} className="text-lg font-semibold">
          Удаление аккаунта
        </h2>
        <p className="text-sm text-muted-foreground">
          Если вы больше не хотите пользоваться EGG, аккаунт можно удалить. Что при этом произойдёт, вы увидите перед подтверждением.
        </p>
        <DeleteAccountButton />
      </section>
    </div>
  )
}
