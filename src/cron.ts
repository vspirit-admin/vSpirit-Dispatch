import { schedule } from 'node-cron'
import axios from 'axios'

import getArrivalInfo from './getArrivalInfo'
import { hoppieParse, hoppieString, HoppieType } from './hoppie'

const cron = () => {
  // Auto Send Arrival Info
  // TODO: replace with scheduler that supports async such as Bree
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  schedule('* * * * *', async () => {
    console.log('Looking For Aircraft Approaching TOD')

    const pendingMessages = (await axios.get(hoppieString())).data as string
    const pendingEtaMessages = hoppieParse(pendingMessages).filter(
      ({ type, message }) =>
        type === HoppieType.progress && message.includes('ETA/')
    )

    if (pendingEtaMessages.length === 0) {
      return console.log('No Aircraft Approaching TOD')
    }

    return pendingEtaMessages.map(async ({ from, message }) => {
      const [dep, arr] = message.split('/')
      const flightInfo = {
        callsign: from,
        dep,
        arr,
      }
      const arrivalInfo = getArrivalInfo(flightInfo)
      arrivalInfo.push(process.env.FOOTER ?? '')

      return await axios.post(
        hoppieString(HoppieType.telex, arrivalInfo.join('\n').toUpperCase())
      )
    })
  })
}

export default cron
