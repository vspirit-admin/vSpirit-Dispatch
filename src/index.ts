import express from 'express'
import 'dotenv/config'

import routes from './data/routes'
import getArrivalInfo from './getArrivalInfo'

if (
  // !process.env.AVWX_TOKEN ||
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
  const flightFile = req.params.flightFile.toUpperCase()
  const [flight, requestType] = flightFile.split('.')

  if (flightFile.split('.').length !== 2) {
    return res.status(400).json({
      message: 'Bad Request, file must be a valid file',
    })
  }

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

  if (process.env.FOOTER) {
    text.push(process.env.FOOTER)
  }

  res.attachment(flightFile).status(200).send(text.join('\n').toUpperCase())
})

app.all('*', (req, res) => {
  res.status(404).json({
    message: 'Not found',
  })
})

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})
