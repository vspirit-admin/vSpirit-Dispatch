import express from 'express'

import routes from './data/routes'
import getArrivalInfo from './getArrivalInfo'

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
    res.status(400).json({
      message: 'Bad Request, file must be a valid file',
    })
    return
  }

  const flightInfo = routes.find((route) => route.callsign === flight)

  const message: string[] = []
  if (!flightInfo) {
    message.push(`Flight ${flight} not found`)
  } else {
    switch (requestType) {
      case 'TST': {
        message.push('Test Successful')
        break
      }

      case 'ARV': {
        message.push(getArrivalInfo(flightInfo))
      }
    }
  }

  res.attachment(flightFile).status(200).send(message.join('\n').toUpperCase())
})

app.all('*', (req, res) => {
  res.status(404).json({
    message: 'Not found',
  })
})

export default app
