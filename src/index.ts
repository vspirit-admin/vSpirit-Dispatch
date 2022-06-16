import express from 'express'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

import routes from './data/routes'
import getArrivalInfo from './getArrivalInfo'

dotenv.config()

if (
  !process.env.AVWX_TOKEN ||
  !process.env.HOPPIE_LOGON ||
  !process.env.CALLSIGN
) {
  throw new Error('Missing environment variables')
}

import cron from './cron'

cron()

const port = process.env.PORT ?? 3000

const app = express()

app.all('/', (req, res) => {
  res.status(200).json({
    message: 'Server Online',
  })
})

app.get('/dispatch/', (req, res) => {
  res.status(400).json({
    message: 'Bad Request, no file specified',
  })
})

app.get('/dispatch/:flightFile', (req, res) => {
  const flightFile = String(req.params.flightFile).toUpperCase().split('.')

  if (flightFile.length !== 2) {
    return res.status(400).json({
      message: 'Bad Request, file must be a valid file',
    })
  }

  const flight = flightFile[0]
  const requestType = flightFile[1]
  const filePath = path.join(__dirname, './files/', flightFile.join('.'))
  const flightInfo = routes.find((route) => route.callsign === flight)

  const text: string[] = []
  if (!flightInfo) {
    text.push(`Flight ${flight} not found`)
  } else {
    switch (requestType) {
      case 'TST': {
        text.push('Test Successful')
        break
      }

      case 'ARV': {
        text.push(...getArrivalInfo(flightInfo))
      }
    }
  }

  if (process.env.FOOTER_LN1) text.push('')
  if (process.env.FOOTER_LN1) text.push(process.env.FOOTER_LN1)
  if (process.env.FOOTER_LN2) text.push(process.env.FOOTER_LN2)
  if (process.env.FOOTER_LN3) text.push(process.env.FOOTER_LN3)
  if (process.env.FOOTER_LN4) text.push(process.env.FOOTER_LN4)
  if (process.env.FOOTER_LN5) text.push(process.env.FOOTER_LN5)

  fs.writeFileSync(filePath, text.join('\n').toUpperCase())
  res.status(200).sendFile(filePath)
})

app.all('*', (req, res) => {
  res.status(404).json({
    message: 'Not found',
  })
})

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})
