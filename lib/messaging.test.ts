import { describe, expect, it } from "vitest"
import {
  type Conversation,
  type Message,
  MAX_MESSAGE_LENGTH,
  conversationHref,
  conversationsHref,
  counterpartName,
  cursorAfterSend,
  formatMessageTime,
  lastIncomingSeqOf,
  lastSeqOf,
  mergeMessages,
  messageTextProblem,
  withOlder,
} from "./messaging"

const message = (seq: number, mine = false, text = `m${seq}`): Message => ({ id: `id${seq}`, seq, mine, text, createdAt: "2026-11-01T10:00:00Z" })

describe("mergeMessages", () => {
  it("adds the new messages after the ones we have", () => {
    expect(mergeMessages([message(1), message(2)], [message(3)]).map((m) => m.seq)).toEqual([1, 2, 3])
  })

  it("keeps a message that came twice once, the later copy winning", () => {
    const merged = mergeMessages([message(1), message(2, true, "old")], [message(2, true, "new")])

    expect(merged).toHaveLength(2)
    expect(merged[1]?.text).toBe("new")
  })

  it("puts the messages in order of seq whatever the order they came in", () => {
    expect(mergeMessages([message(3)], [message(2), message(1)]).map((m) => m.seq)).toEqual([1, 2, 3])
  })

  it("does not change the lists it was given", () => {
    const current = [message(1)]

    mergeMessages(current, [message(2)])

    expect(current).toHaveLength(1)
  })
})

const conversation = (id: string): Conversation => ({ id }) as Conversation

describe("withOlder", () => {
  it("puts the older pages after the first one", () => {
    expect(withOlder([conversation("a"), conversation("b")], [conversation("c")]).map((c) => c.id)).toEqual(["a", "b", "c"])
  })

  it("keeps a conversation that moved up to the first page once, where the first page has it", () => {
    // the person read page two, then a message in "c" made it the newest and the first page was read again
    expect(withOlder([conversation("c"), conversation("a")], [conversation("b"), conversation("c")]).map((c) => c.id)).toEqual(["c", "a", "b"])
  })

  it("is the first page alone when nothing older was asked for", () => {
    expect(withOlder([conversation("a")], []).map((c) => c.id)).toEqual(["a"])
  })
})

describe("cursorAfterSend", () => {
  it("moves the cursor to the sent message when it is the very next number", () => {
    expect(cursorAfterSend(5, 6)).toEqual({ cursor: 6, gap: false })
  })

  it("keeps the cursor when a message of the other side was stored in between, so the next poll fetches it", () => {
    // the thread had 1..5, the creator wrote 6, then the buyer's own message came back as 7
    expect(cursorAfterSend(5, 7)).toEqual({ cursor: 5, gap: true })
    expect(cursorAfterSend(0, 3)).toEqual({ cursor: 0, gap: true })
  })

  it("keeps the cursor for a number that was already seen", () => {
    expect(cursorAfterSend(5, 5)).toEqual({ cursor: 5, gap: true })
  })
})

describe("lastSeqOf and lastIncomingSeqOf", () => {
  it("find the newest message and the newest one of the other side", () => {
    const messages = [message(1), message(2, true), message(3, true)]

    expect(lastSeqOf(messages)).toBe(3)
    expect(lastIncomingSeqOf(messages)).toBe(1)
  })

  it("are 0 for no messages and for no messages of the other side", () => {
    expect(lastSeqOf([])).toBe(0)
    expect(lastIncomingSeqOf([message(1, true)])).toBe(0)
  })
})

describe("conversationsHref and conversationHref", () => {
  it("lead a buyer to /messages and a creator to the cabinet (AC-23)", () => {
    expect(conversationsHref("BUYER")).toBe("/messages")
    expect(conversationsHref("CREATOR")).toBe("/cabinet/messages")
    expect(conversationHref("BUYER", "abc")).toBe("/messages/abc")
    expect(conversationHref("CREATOR", "abc")).toBe("/cabinet/messages/abc")
  })
})

describe("counterpartName", () => {
  it("is the name, and 'deleted user' for a deleted account", () => {
    expect(counterpartName({ name: "Анна", deleted: false })).toBe("Анна")
    expect(counterpartName({ deleted: true })).toBe("Удалённый пользователь")
    expect(counterpartName({ name: "Анна", deleted: true })).toBe("Удалённый пользователь")
    expect(counterpartName({ deleted: false })).toBe("Без имени")
  })
})

describe("messageTextProblem", () => {
  it("refuses an empty or blank text and a text over the limit", () => {
    expect(messageTextProblem("")).toBe("Введите сообщение.")
    expect(messageTextProblem("  \n ")).toBe("Введите сообщение.")
    expect(messageTextProblem("я".repeat(MAX_MESSAGE_LENGTH + 1))).not.toBeNull()
  })

  it("takes a text up to the limit", () => {
    expect(messageTextProblem("Привет")).toBeNull()
    expect(messageTextProblem("я".repeat(MAX_MESSAGE_LENGTH))).toBeNull()
  })
})

describe("formatMessageTime", () => {
  const now = new Date("2026-11-08T12:00:00Z")

  it("shows the hour for a message of today", () => {
    expect(formatMessageTime("2026-11-08T09:05:00Z", now, "UTC")).toBe("09:05")
  })

  it("shows the day and the month for an earlier message", () => {
    expect(formatMessageTime("2026-11-02T09:05:00Z", now, "UTC")).toMatch(/^2 ноя/)
  })
})
