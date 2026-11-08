/** The mails of the backend, read through the API of Mailpit (or of e2e/dev/mailpit-lite.mjs). */
export const MAIL_URL = process.env.E2E_MAIL_URL ?? "http://localhost:8025"

export interface Mail {
  to: string[]
  subject: string
  text: string
  /** Every address in the body, as the person would click it. */
  links: string[]
}

interface Listed {
  ID: string
  Subject: string
  To: { Address: string }[]
}

interface Full extends Listed {
  Text?: string
  HTML?: string
}

const LINK = /https?:\/\/[^\s"'<>)]+/g
const POLL_MS = 1000
const WAIT_MS = 60_000

const decodeEntities = (text: string) => text.replaceAll("&amp;", "&").replaceAll("&#61;", "=").replaceAll("&quot;", '"')

/**
 * The newest mail to `to` whose subject matches, waiting for it (the backend sends mail every 10 s). `ignore` holds the ids of mails the
 * caller has already used, so that a second wait for the same kind of mail does not find the first one again.
 */
export async function waitForMail(to: string, subject: RegExp, ignore: ReadonlySet<string> = new Set()): Promise<Mail & { id: string }> {
  const deadline = Date.now() + WAIT_MS
  while (Date.now() < deadline) {
    const list = (await (await fetch(`${MAIL_URL}/api/v1/messages?limit=200`)).json()) as { messages: Listed[] }
    const found = list.messages.find(
      (message) => !ignore.has(message.ID) && message.To.some((address) => address.Address.toLowerCase() === to.toLowerCase()) && subject.test(message.Subject),
    )
    if (found) {
      const full = (await (await fetch(`${MAIL_URL}/api/v1/message/${found.ID}`)).json()) as Full
      const text = decodeEntities(`${full.Text ?? ""}\n${full.HTML ?? ""}`)
      return { id: full.ID, to: full.To.map((address) => address.Address), subject: full.Subject, text, links: [...new Set(text.match(LINK) ?? [])] }
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_MS))
  }
  throw new Error(`no mail to ${to} with a subject like ${subject} in ${WAIT_MS / 1000} s`)
}

/** The first link of a mail that leads to the page `path` of the web client (for example `/verify-email`). */
export function linkTo(mail: Mail, path: string): string {
  const link = mail.links.find((candidate) => new URL(candidate).pathname === path)
  if (!link) throw new Error(`the mail "${mail.subject}" has no link to ${path}: ${mail.links.join(", ")}`)
  return link
}
