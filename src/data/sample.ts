import type { ValidatedSale } from '../types'

export const SAMPLE_LABEL = 'Data Simulasi Perniagaan Makanan SULAM'
export const SAMPLE_NOTE =
  'Data ini adalah data simulasi (contoh) perniagaan kuih & kek untuk demonstrasi SULAM Wanita with AI. Rekod ini bukan data perniagaan sebenar.'

export const SAMPLE_SALES: ValidatedSale[] = [
  {
    id: 's1',
    produk: 'Karipap',
    kuantiti: 120,
    harga: 2.5,
    kos: 0.8,
    tarikh: '2026-01-05',
    saluran: 'Booth',
  },
  {
    id: 's2',
    produk: 'Karipap',
    kuantiti: 40,
    harga: 2.5,
    kos: 0.8,
    tarikh: '2026-01-12',
    saluran: 'Online',
  },
  {
    id: 's3',
    produk: 'Brownies',
    kuantiti: 30,
    harga: 8.0,
    kos: 3.0,
    tarikh: '2026-01-06',
    saluran: 'Booth',
  },
  {
    id: 's4',
    produk: 'Brownies',
    kuantiti: 25,
    harga: 8.0,
    kos: 3.0,
    tarikh: '2026-01-13',
    saluran: 'Online',
  },
  {
    id: 's5',
    produk: 'Kuih Lapis',
    kuantiti: 50,
    harga: 4.0,
    kos: 1.5,
    tarikh: '2026-01-07',
    saluran: 'Booth',
  },
  {
    id: 's6',
    produk: 'Kuih Lapis',
    kuantiti: 20,
    harga: 4.0,
    kos: 1.5,
    tarikh: '2026-01-14',
    saluran: 'Lain-lain',
  },
  {
    id: 's7',
    produk: 'Karipap',
    kuantiti: 60,
    harga: 2.5,
    kos: 0.8,
    tarikh: '2026-01-19',
    saluran: 'Booth',
  },
  {
    id: 's8',
    produk: 'Brownies',
    kuantiti: 15,
    harga: 8.0,
    kos: 3.0,
    tarikh: '2026-01-20',
    saluran: 'Online',
  },
  {
    id: 's9',
    produk: 'Kuih Lapis',
    kuantiti: 35,
    harga: 4.0,
    kos: 1.5,
    tarikh: '2026-01-21',
    saluran: 'Booth',
  },
]

export const SAMPLE_CSV = `Produk,Kuantiti,Harga,Kos,Tarikh,Saluran
Karipap,120,2.50,0.80,2026-01-05,Booth
Karipap,40,2.50,0.80,2026-01-12,Online
Brownies,30,8.00,3.00,2026-01-06,Booth
Brownies,25,8.00,3.00,2026-01-13,Online
Kuih Lapis,50,4.00,1.50,2026-01-07,Booth
Kuih Lapis,20,4.00,1.50,2026-01-14,Lain-lain
Karipap,60,2.50,0.80,2026-01-19,Booth
Brownies,15,8.00,3.00,2026-01-20,Online
Kuih Lapis,35,4.00,1.50,2026-01-21,Booth`
