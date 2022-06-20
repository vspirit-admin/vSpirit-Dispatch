import 'dotenv/config'

if (
  // !process.env.AVWX_TOKEN ||
  !process.env.HOPPIE_LOGON ||
  !process.env.CALLSIGN
) {
  throw new Error('Missing environment variables')
}

import { cron } from './cron'

cron()
