import fs from 'node:fs'
import path from 'node:path'

const fixturesDir = 'C:\\SULAM\\wanita-niaga-ai\\test_fixtures'
if (!fs.existsSync(fixturesDir)) {
  fs.mkdirSync(fixturesDir, { recursive: true })
}

const csvContent = `Produk,Kuantiti,Harga,Kos,Tarikh,Saluran
Karipap,50,RM2.00,RM0.80,2026-11-10,Booth
Brownies,20,8.00,4.00,2026-11-11,Booth
Nasi Lemak,30,3.50,1.50,2026-11-12,Online
`

fs.writeFileSync(path.join(fixturesDir, 'test_sales.csv'), csvContent, 'utf-8')
fs.writeFileSync(path.join(fixturesDir, 'test_invalid.pdf'), 'Dummy PDF content', 'utf-8')

console.log('Fixtures created successfully!')
