import type { components } from "@/lib/api/schema"

type Schemas = components["schemas"]
export type Conversation = Schemas["Conversation"]
export type Message = Schemas["Message"]
export type ConversationRole = Schemas["ConversationRole"]
export type Participant = Schemas["Participant"]

/** The rhythm of the web client (AC-22, AC-23): an open conversation every 5 s ± 1 s, the badge every 30 s, a stop after 15 min idle. */
export const POLL_INTERVAL_MS = 5000
export const POLL_JITTER_MS = 1000
export const IDLE_LIMIT_MS = 15 * 60 * 1000
export const INBOX_INTERVAL_MS = 30_000
export const MAX_MESSAGE_LENGTH = 4000

/** The messages we have plus the new ones, by `seq`: a message that comes twice (a poll after a send) is kept once, the order is by `seq`. */
export function mergeMessages(current: Message[], incoming: Message[]): Message[] {
  const bySeq = new Map<number, Message>()
  for (const message of [...current, ...incoming]) bySeq.set(message.seq, message)
  return [...bySeq.values()].sort((a, b) => a.seq - b.seq)
}

export function lastSeqOf(messages: Message[]): number {
  return messages.reduce((last, message) => Math.max(last, message.seq), 0)
}

/** The newest message of the other side: everything up to it is read once the conversation is on the screen. */
export function lastIncomingSeqOf(messages: Message[]): number {
  return messages.reduce((last, message) => (message.mine ? last : Math.max(last, message.seq)), 0)
}

/** A buyer reads on `/messages`, a creator in the cabinet (AC-23). */
export function conversationsHref(role: ConversationRole): string {
  return role === "BUYER" ? "/messages" : "/cabinet/messages"
}

export function conversationHref(role: ConversationRole, id: string): string {
  return `${conversationsHref(role)}/${id}`
}

export function counterpartName(participant: Participant): string {
  if (participant.deleted) return "Удалённый пользователь"
  return participant.name ?? "Без имени"
}

/** What is wrong with a text before it is sent; `null` when nothing is. */
export function messageTextProblem(text: string): string | null {
  if (text.trim() === "") return "Введите сообщение."
  if (text.length > MAX_MESSAGE_LENGTH) return `Сообщение длиннее ${MAX_MESSAGE_LENGTH} символов.`
  return null
}

/** The time of a message in a list: only the hour for today, the day and the month for an earlier one. */
export function formatMessageTime(iso: string, now: Date = new Date(), timeZone?: string): string {
  const date = new Date(iso)
  const sameDay = (a: Date, b: Date) =>
    new Intl.DateTimeFormat("en-CA", { timeZone }).format(a) === new Intl.DateTimeFormat("en-CA", { timeZone }).format(b)
  return sameDay(date, now)
    ? new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit", timeZone }).format(date)
    : new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", timeZone }).format(date)
}
