// One-shot script: generate a solid 1200x630 terracotta PNG for og:image
const { deflateSync } = require('zlib')
const { writeFileSync } = require('fs')

const width = 1200
const height = 630
const r = 0xC7, g = 0x5B, b = 0x39 // #C75B39 terracotta

// Build raw pixel data: filter byte (0 = None) + RGB per pixel per row
const rowBytes = 1 + width * 3
const raw = Buffer.alloc(rowBytes * height)
for (let y = 0; y < height; y++) {
  const offset = y * rowBytes
  raw[offset] = 0 // filter: None
  for (let x = 0; x < width; x++) {
    const px = offset + 1 + x * 3
    raw[px] = r
    raw[px + 1] = g
    raw[px + 2] = b
  }
}

const compressed = deflateSync(raw)

function crc32(buf) {
  let crc = 0xFFFFFFFF
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i]
    for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0)
  }
  return (crc ^ 0xFFFFFFFF) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typeData = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(typeData))
  return Buffer.concat([len, typeData, crc])
}

const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(width, 0)
ihdr.writeUInt32BE(height, 4)
ihdr[8] = 8  // bit depth
ihdr[9] = 2  // color type: RGB
ihdr[10] = 0 // compression
ihdr[11] = 0 // filter
ihdr[12] = 0 // interlace

const png = Buffer.concat([
  sig,
  chunk('IHDR', ihdr),
  chunk('IDAT', compressed),
  chunk('IEND', Buffer.alloc(0)),
])

writeFileSync('public/og-image.png', png)
console.log(`Created public/og-image.png (${png.length} bytes, ${width}x${height})`)
