import { NextRequest, NextResponse } from 'next/server'

interface OrderData {
  noResi: string
  nama: string
  alamat: string
  kecamatan: string
  kota: string
  provinsi: string
  kodepos: string
  noHp: string
  namaBarang: string
  nilaiPembayaran: string
  ongkir: string
  jenisPembayaran: string
  originalIndex: number
}

interface DuplicateGroup {
  key: string
  items: OrderData[]
}

function parseOrderData(rawData: string): OrderData[] {
  const orders: OrderData[] = []

  // Split by the separator pattern - any number of "=" followed by digits
  const entries = rawData.split(/={3,}\d+/)

  entries.forEach((entry, idx) => {
    const trimmedEntry = entry.trim()
    if (!trimmedEntry) return

    const order: Partial<OrderData> = { originalIndex: idx }

    // Parse each line
    const lines = trimmedEntry.split('\n').map(line => line.trim())

    lines.forEach(line => {
      // Handle both ":" and ":" separators
      const colonIndex = line.indexOf(':')
      if (colonIndex === -1) return

      const key = line.substring(0, colonIndex).trim().toLowerCase().replace(/\s+/g, '')
      const value = line.substring(colonIndex + 1).trim()

      switch (key) {
        case 'noresi':
        case 'noresi:':
          order.noResi = value
          break
        case 'nama':
          order.nama = value
          break
        case 'alamat':
          order.alamat = value
          break
        case 'kecamatan':
          order.kecamatan = value
          break
        case 'kota':
          order.kota = value
          break
        case 'provinsi':
          order.provinsi = value
          break
        case 'kodepos':
          order.kodepos = value
          break
        case 'nohp':
        case 'nohp:':
        case 'noh:':
          order.noHp = value
          break
        case 'namabarang':
          order.namaBarang = value
          break
        case 'nilaipembayaran':
        case 'nilaipembayaran:':
        case 'hargabarang':
          order.nilaiPembayaran = value
          break
        case 'ongkir':
          order.ongkir = value
          break
        case 'jenispembayaran':
        case 'jenispembayaran:':
          order.jenisPembayaran = value
          break
      }
    })

    // Ensure required fields exist and set defaults for optional fields
    if (order.nama && order.noHp) {
      // Set default values for missing fields
      if (!order.noResi) order.noResi = '0'
      if (!order.alamat) order.alamat = ''
      if (!order.kecamatan) order.kecamatan = ''
      if (!order.kota) order.kota = ''
      if (!order.provinsi) order.provinsi = ''
      if (!order.kodepos) order.kodepos = ''
      if (!order.namaBarang) order.namaBarang = ''
      if (!order.nilaiPembayaran) order.nilaiPembayaran = '0'
      if (!order.ongkir) order.ongkir = '0'
      if (!order.jenisPembayaran) order.jenisPembayaran = ''

      // Normalize phone number (remove spaces, dashes, slashes)
      order.noHp = order.noHp
        .replace(/\s+/g, '')
        .replace(/-/g, '')
        .split('/')[0] // Take first phone if multiple

      orders.push(order as OrderData)
    }
  })

  return orders
}

function detectDuplicates(orders: OrderData[]): {
  duplicates: DuplicateGroup[]
  unique: OrderData[]
  totalCount: number
} {
  // Group by noHp only
  const groupedByDuplicate = new Map<string, OrderData[]>()
  const uniqueOrders: OrderData[] = []

  orders.forEach(order => {
    // Create a unique key based on noHp only (normalized)
    const normalizedNoHp = order.noHp.replace(/\D/g, '') // Remove non-digits
    const key = normalizedNoHp

    if (groupedByDuplicate.has(key)) {
      groupedByDuplicate.get(key)!.push(order)
    } else {
      groupedByDuplicate.set(key, [order])
    }
  })

  // Separate duplicates and unique
  const duplicates: DuplicateGroup[] = []
  groupedByDuplicate.forEach((items, key) => {
    if (items.length > 1) {
      // This is a duplicate group
      // First item goes to unique, rest go to duplicates
      uniqueOrders.push(items[0])
      duplicates.push({
        key: items[0].noHp,
        items: items.slice(1) // Only the duplicate items (2nd, 3rd, etc.)
      })
    } else {
      // This is unique
      uniqueOrders.push(items[0])
    }
  })

  return {
    duplicates,
    unique: uniqueOrders,
    totalCount: orders.length
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data } = body

    if (!data || typeof data !== 'string') {
      return NextResponse.json(
        { error: 'Data input tidak valid' },
        { status: 400 }
      )
    }

    // Parse the raw data
    const orders = parseOrderData(data)

    if (orders.length === 0) {
      return NextResponse.json(
        { error: 'Tidak ada data order yang valid ditemukan' },
        { status: 400 }
      )
    }

    // Detect duplicates
    const result = detectDuplicates(orders)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error processing duplicates:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat memproses data' },
      { status: 500 }
    )
  }
}
