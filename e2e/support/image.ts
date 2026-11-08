import { randomBytes } from "node:crypto"
import { crc32, deflateSync } from "node:zlib"

export interface ImageFile {
  name: string
  mimeType: "image/png"
  buffer: Buffer
}

function chunk(type: string, data: Buffer): Buffer {
  const head = Buffer.alloc(8)
  head.writeUInt32BE(data.length, 0)
  head.write(type, 4, "ascii")
  const tail = Buffer.alloc(4)
  tail.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0)
  return Buffer.concat([head, data, tail])
}

function png(width: number, height: number, row: (y: number) => Buffer): Buffer {
  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header.set([8, 2, 0, 0, 0], 8) // 8 bits, RGB, no interlace
  const rows: Buffer[] = []
  for (let y = 0; y < height; y += 1) rows.push(Buffer.concat([Buffer.from([0]), row(y)]))
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(Buffer.concat(rows), { level: 0 })),
    chunk("IEND", Buffer.alloc(0)),
  ])
}

/** A small picture of one colour, made without any library. */
export function solidPng(name: string, color: [number, number, number], size = 240): ImageFile {
  const pixel = Buffer.from(color)
  const row = Buffer.concat(Array.from({ length: size }, () => pixel))
  return { name: `${name}.png`, mimeType: "image/png", buffer: png(size, size, () => row) }
}

/**
 * A valid PNG of about `megabytes` MB of file: its pixels are random, so they do not compress, and the stored size follows the number of
 * pixels. For the limit of the upload (AC-42): 9.9 MB must pass, 10.5 MB must be refused.
 */
export function heavyPng(name: string, megabytes: number): ImageFile {
  const width = 2000
  const height = Math.round((megabytes * 1024 * 1024) / (width * 3))
  const noise = randomBytes(width * 3)
  return { name: `${name}.png`, mimeType: "image/png", buffer: png(width, height, () => noise) }
}
