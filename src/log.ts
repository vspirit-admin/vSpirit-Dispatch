import { Logger, TLogLevelName } from 'tslog'

let min_level = process.env.LOG_LEVEL
if (!min_level) {
  min_level = 'info'
}

export const log = new Logger({
  minLevel: min_level as TLogLevelName,
  type: process.env.NODE_ENV == 'test' ? 'hidden' : 'pretty',
})
