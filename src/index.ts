import 'dotenv/config'

if (
  // !process.env.AVWX_TOKEN ||
  !process.env.HOPPIE_LOGON ||
  !process.env.CALLSIGN
) {
  throw new Error('Missing environment variables')
}

import { cron2 } from './cron'

cron2()

import app from './express'

const port = process.env.PORT ?? 3000

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})
