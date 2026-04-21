'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Copy, CheckCircle, AlertTriangle, Loader2, Database, X } from 'lucide-react'
import { toast } from 'sonner'

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

export default function Home() {
  const [inputData, setInputData] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([])
  const [uniqueData, setUniqueData] = useState<OrderData[]>([])
  const [processedCount, setProcessedCount] = useState(0)

  const processDuplicates = async () => {
    if (!inputData.trim()) {
      toast.error('Mohon masukkan data terlebih dahulu')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/process-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: inputData })
      })

      if (!response.ok) throw new Error('Gagal memproses data')

      const result = await response.json()
      setDuplicates(result.duplicates)
      setUniqueData(result.unique)
      setProcessedCount(result.totalCount)

      if (result.duplicates.length > 0) {
        toast.success(`Terdeteksi ${result.duplicates.length} data dobel dari ${result.totalCount} data`)
      } else {
        toast.success('Tidak ada data dobel ditemukan')
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat memproses data')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatOrderData = (order: OrderData, index?: number): string => {
    const idx = index !== undefined ? index : order.originalIndex
    const displayNumber = idx + 1 // Start from #1 instead of #0
    const separator = '='.repeat(27) // Always 27 equal signs
    return `/NO RESI : ${order.noResi}\nNAMA : ${order.nama}\nALAMAT : ${order.alamat}\nKECAMATAN : ${order.kecamatan}\nKOTA : ${order.kota}\nPROVINSI : ${order.provinsi}\nKODEPOS : ${order.kodepos}\nNO HP : ${order.noHp}\nNAMA BARANG : ${order.namaBarang}\nNILAI PEMBAYARAN : ${order.nilaiPembayaran}\nONGKIR : ${order.ongkir}\nJENIS PEMBAYARAN : ${order.jenisPembayaran}\n${separator}${displayNumber}`
  }

  const copyDuplicates = () => {
    if (duplicates.length === 0) {
      toast.error('Tidak ada data dobel untuk disalin')
      return
    }

    let text = 'Terdapat data dobel\n\n'
    duplicates.forEach((group, groupIdx) => {
      text += `[Group ${groupIdx + 1} - ${group.key}]\n\n`
      group.items.forEach(item => {
        text += formatOrderData(item) + '\n\n'
      })
      text += '---\n\n'
    })

    navigator.clipboard.writeText(text).then(() => {
      toast.success('Data dobel berhasil disalin!')
    }).catch(() => {
      toast.error('Gagal menyalin data')
    })
  }

  const copyUnique = () => {
    if (uniqueData.length === 0) {
      toast.error('Tidak ada data aman untuk disalin')
      return
    }

    let text = uniqueData.map(item => formatOrderData(item)).join('\n\n')
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Data aman berhasil disalin!')
    }).catch(() => {
      toast.error('Gagal menyalin data')
    })
  }

  const clearAll = () => {
    setInputData('')
    setDuplicates([])
    setUniqueData([])
    setProcessedCount(0)
    toast.success('Data berhasil dibersihkan')
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] transition-colors duration-200">
      {/* Header */}
      <header className="border-b border-neutral-100 dark:border-neutral-800/50 sticky top-0 z-50 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">
                Deteksi Data Dobel
              </h1>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Identifikasi data order duplikat
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-neutral-400 dark:text-neutral-500">
                {processedCount > 0 ? `${processedCount} data diproses` : ''}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12 max-w-6xl">
        {/* Hero */}
        <div className="mb-10">
          <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900 dark:text-white mb-2">
            Analisis Data Order
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-xl">
            Paste data order Anda, sistem akan mendeteksi duplikat berdasarkan No HP
          </p>
        </div>

        {/* Input Section */}
        <div className="mb-12">
          <div className="bg-neutral-50 dark:bg-[#121212] rounded-2xl p-6 border border-neutral-100 dark:border-neutral-800/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                <h3 className="text-sm font-medium text-neutral-900 dark:text-white">
                  Input Data Order
                </h3>
              </div>
              {inputData && (
                <button
                  onClick={clearAll}
                  className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                  title="Bersihkan"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
<Textarea
  placeholder={`/NO RESI : 0
NAMA : Fadhel
ALAMAT : Btn graha cendekia b19 Makassar  jln Daya raya Kel DAYA
KECAMATAN : BIRING KANAYA
KOTA : MAKASSAR
PROVINSI : SULAWESI SELATAN
KODEPOS : 90241
NO HP : 088245402148
NAMA BARANG : BAO JIAN TAN TKT AZ
NILAI PEMBAYARAN : 131.900
ONGKIR : 46.000
JENIS PEMBAYARAN : COD
===========================1

Paste semua data order anda disini...`}
  value={inputData}
  onChange={(e) => setInputData(e.target.value)}
  className="min-h-[280px] font-mono text-xs bg-white dark:bg-[#1a1a1a] border-neutral-200 dark:border-neutral-800 focus:border-neutral-900 dark:focus:border-neutral-600 rounded-xl resize-none whitespace-pre-wrap"
/>
            <div className="mt-4">
              <Button
                onClick={processDuplicates}
                disabled={isLoading || !inputData.trim()}
                className="w-full h-11 font-medium bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-xl transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Deteksi Data Dobel
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {(duplicates.length > 0 || uniqueData.length > 0) && (
          <Tabs defaultValue="unique" className="space-y-6">
            <TabsList className="inline-flex h-9 bg-neutral-100 dark:bg-[#1a1a1a] p-1 rounded-lg">
              <TabsTrigger
                value="unique"
                className="gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-[#0a0a0a] data-[state=active]:shadow-sm rounded-md font-medium text-xs px-4 transition-all"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Data Aman ({uniqueData.length})
              </TabsTrigger>
              <TabsTrigger
                value="duplicates"
                className="gap-1.5 data-[state=active]:bg-white dark:data-[state=active]:bg-[#0a0a0a] data-[state=active]:shadow-sm rounded-md font-medium text-xs px-4 transition-all"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Data Dobel ({duplicates.length})
              </TabsTrigger>
            </TabsList>

            {/* Unique Tab */}
            <TabsContent value="unique">
              <div className="bg-neutral-50 dark:bg-[#121212] rounded-2xl border border-neutral-100 dark:border-neutral-800/30 overflow-hidden">
                <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
                    <span className="text-sm font-medium text-neutral-900 dark:text-white">
                      Data Aman
                    </span>
                  </div>
                  <Button
                    onClick={copyUnique}
                    variant="ghost"
                    size="sm"
                    className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white h-8 px-3 text-xs"
                  >
                    <Copy className="w-3.5 h-3.5 mr-1.5" />
                    Salin
                  </Button>
                </div>
                <div className="p-6">
                  {uniqueData.length === 0 ? (
                    <div className="text-center py-12 text-neutral-400 dark:text-neutral-500">
                      <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">Belum ada data diproses</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                      {uniqueData.map((item, idx) => (
                        <div
                          key={idx}
                          className="bg-white dark:bg-[#1a1a1a] border border-neutral-200 dark:border-neutral-800/50 rounded-xl p-4 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
                        >
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-xs text-neutral-400 dark:text-neutral-500">#{item.originalIndex + 1}</span>
                            <span className="text-sm font-medium text-neutral-900 dark:text-white">{item.nama}</span>
                            <span className="ml-auto text-xs text-neutral-500 dark:text-neutral-400 font-mono">{item.noHp}</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                            <div className="flex gap-2">
                              <span className="text-neutral-400 dark:text-neutral-500">Alamat:</span>
                              <span className="text-neutral-600 dark:text-neutral-400 truncate">{item.alamat}</span>
                            </div>
                            <div className="flex gap-2">
                              <span className="text-neutral-400 dark:text-neutral-500">Total:</span>
                              <span className="text-neutral-600 dark:text-neutral-400">Rp {parseFloat(item.nilaiPembayaran.replace(/\./g, '').replace(',', '.')).toLocaleString('id-ID')}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Duplicates Tab */}
            <TabsContent value="duplicates">
              <div className="bg-neutral-50 dark:bg-[#121212] rounded-2xl border border-neutral-100 dark:border-neutral-800/30 overflow-hidden">
                <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-500" />
                    <span className="text-sm font-medium text-neutral-900 dark:text-white">
                      Data Dobel
                    </span>
                  </div>
                  <Button
                    onClick={copyDuplicates}
                    variant="ghost"
                    size="sm"
                    className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white h-8 px-3 text-xs"
                  >
                    <Copy className="w-3.5 h-3.5 mr-1.5" />
                    Salin
                  </Button>
                </div>
                <div className="p-6">
                  {duplicates.length === 0 ? (
                    <div className="text-center py-12 text-neutral-400 dark:text-neutral-500">
                      <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">Tidak ada data dobel</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {duplicates.map((group, groupIdx) => (
                        <div key={groupIdx} className="bg-white dark:bg-[#1a1a1a] border border-neutral-200 dark:border-neutral-800/50 rounded-xl overflow-hidden">
                          <div className="bg-neutral-100 dark:bg-neutral-900/50 px-4 py-2.5 flex items-center justify-between">
                            <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                              Grup {groupIdx + 1}
                            </span>
                            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                              {group.key}
                            </span>
                          </div>
                          <div className="divide-y divide-neutral-100 dark:divide-neutral-800/30">
                            {group.items.map((item, itemIdx) => (
                              <div key={itemIdx} className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-xs text-neutral-400 dark:text-neutral-500">#{item.originalIndex + 1}</span>
                                  <span className="text-sm font-medium text-neutral-900 dark:text-white">{item.nama}</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                                  <div className="flex gap-2">
                                    <span className="text-neutral-400 dark:text-neutral-500">No HP:</span>
                                    <span className="text-neutral-600 dark:text-neutral-400">{item.noHp}</span>
                                  </div>
                                  <div className="flex gap-2">
                                    <span className="text-neutral-400 dark:text-neutral-500">Alamat:</span>
                                    <span className="text-neutral-600 dark:text-neutral-400 truncate">{item.alamat}</span>
                                  </div>
                                  <div className="flex gap-2">
                                    <span className="text-neutral-400 dark:text-neutral-500">Total:</span>
                                    <span className="text-neutral-600 dark:text-neutral-400">Rp {parseFloat(item.nilaiPembayaran.replace(/\./g, '').replace(',', '.')).toLocaleString('id-ID')}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-neutral-100 dark:border-neutral-800/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              © 2026 Deteksi Data Dobel
            </p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500">
              Dibuat untuk efisiensi bisnis Anda
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
