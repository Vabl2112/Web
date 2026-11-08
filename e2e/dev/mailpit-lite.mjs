// A local stand-in for Mailpit (and, with --media, for the nginx that serves /media/), for a machine without Docker. It takes mail on the SMTP
// port 1025 and answers the two calls of the Mailpit API that e2e/support/mail.ts uses on port 8025:
//   GET /api/v1/messages        -> { total, messages: [{ ID, Subject, To: [{ Address }], Created }] }
//   GET /api/v1/message/{ID}    -> { ID, Subject, To, Text, HTML }
// Usage: node e2e/dev/mailpit-lite.mjs [--media <directory of EGG_MEDIA_DIR>]
import { createServer as netServer } from "node:net"
import { createServer as httpServer } from "node:http"
import { existsSync, readFileSync, statSync } from "node:fs"
import { extname, join, normalize } from "node:path"

const messages = []

const decodeQuotedPrintable = (text) =>
  text.replace(/=\r?\n/g, "").replace(/=([0-9A-F]{2})/g, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)))

/** A header with encoded words (`=?UTF-8?B?...?=` and `=?UTF-8?Q?...?=`, the second when the text is mostly ASCII), as plain text. */
const decodeWords = (value) =>
  value.replace(/=\?UTF-8\?([BQ])\?([^?]*)\?=\s*/gi, (_, kind, data) =>
    kind.toUpperCase() === "B"
      ? Buffer.from(data, "base64").toString("utf8")
      : Buffer.from(
          data.replaceAll("_", " ").replace(/=([0-9A-Fa-f]{2})/g, (_hex, byte) => String.fromCharCode(Number.parseInt(byte, 16))),
          "latin1",
        ).toString("utf8"),
  )

/** The text of the base64 parts of a body: the lines that are only base64, joined, decoded. */
function base64Parts(body) {
  const groups = []
  let current = []
  for (const line of body.split("\n")) {
    if (/^[A-Za-z0-9+/]{20,}={0,2}$/.test(line.trim())) current.push(line.trim())
    else {
      if (current.length > 0) groups.push(current.join(""))
      current = []
    }
  }
  if (current.length > 0) groups.push(current.join(""))
  return groups.map((group) => Buffer.from(group, "base64").toString("utf8")).join("\n")
}

function parse(raw, recipients) {
  const split = raw.indexOf("\n\n")
  const headers = (split < 0 ? raw : raw.slice(0, split)).replace(/\n[ \t]+/g, " ")
  const body = split < 0 ? "" : raw.slice(split + 2)
  const subject = decodeWords((headers.match(/^Subject: (.*)$/m) ?? [])[1] ?? "")
  const text = `${decodeQuotedPrintable(body)}\n${base64Parts(body)}`
  return {
    ID: `${messages.length + 1}`,
    Subject: subject,
    To: recipients.map((Address) => ({ Address })),
    Created: new Date().toISOString(),
    Text: text,
    HTML: "",
  }
}

netServer((socket) => {
  let inData = false
  let body = ""
  let recipients = []
  let pending = ""
  const handle = (line) => {
    if (inData) {
      if (line === ".") {
        inData = false
        messages.push(parse(body, recipients))
        return socket.write("250 OK\r\n")
      }
      body += `${line.startsWith("..") ? line.slice(1) : line}\n`
      return undefined
    }
    const command = line.slice(0, 4).toUpperCase()
    if (command === "MAIL") recipients = []
    if (command === "RCPT") recipients.push(line.slice(line.indexOf("<") + 1, line.indexOf(">")))
    if (command === "DATA") {
      inData = true
      body = ""
      return socket.write("354 go ahead\r\n")
    }
    if (command === "QUIT") {
      socket.write("221 bye\r\n")
      return socket.end()
    }
    return socket.write(command === "EHLO" || command === "HELO" ? "250 localhost\r\n" : "250 OK\r\n")
  }
  socket.write("220 localhost ESMTP\r\n")
  socket.on("data", (chunk) => {
    pending += chunk.toString("latin1")
    let index = pending.indexOf("\r\n")
    while (index >= 0) {
      handle(pending.slice(0, index))
      pending = pending.slice(index + 2)
      index = pending.indexOf("\r\n")
    }
  })
  socket.on("error", () => {})
}).listen(1025, () => console.log("smtp on 1025"))

const json = (response, status, body) => {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" })
  response.end(JSON.stringify(body))
}

httpServer((request, response) => {
  const url = new URL(request.url ?? "/", "http://localhost")
  if (url.pathname === "/api/v1/messages") {
    const list = messages.map(({ ID, Subject, To, Created }) => ({ ID, Subject, To, Created })).reverse()
    return json(response, 200, { total: list.length, messages: list })
  }
  const one = url.pathname.match(/^\/api\/v1\/message\/([^/]+)$/)
  if (one) {
    const message = messages.find((candidate) => candidate.ID === one[1])
    return message ? json(response, 200, message) : json(response, 404, { error: "not found" })
  }
  response.writeHead(404)
  return response.end()
}).listen(8025, () => console.log("mail api on http://localhost:8025/api/v1/"))

const mediaIndex = process.argv.indexOf("--media")
if (mediaIndex >= 0) {
  const mediaDir = process.argv[mediaIndex + 1]
  const types = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" }
  httpServer((request, response) => {
    const key = normalize(decodeURIComponent((request.url ?? "").replace(/^\/media\//, "").split("?")[0])).replace(/^(\.\.[\\/])+/, "")
    const file = join(mediaDir, key)
    if (!request.url?.startsWith("/media/") || !existsSync(file) || !statSync(file).isFile()) {
      response.writeHead(404)
      return response.end()
    }
    response.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream", "cache-control": "no-store" })
    return response.end(readFileSync(file))
  }).listen(8090, () => console.log(`media on http://localhost:8090/media/ from ${mediaDir}`))
}
