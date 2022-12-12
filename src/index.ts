import 'dotenv/config'
import { redisClient } from './cache/caches'
import { log } from './log'
import { arrivalMessage } from './arrivalMessage'
import { schedule } from 'node-cron'

const checkEnv = function(envs: string[]) {
  for (const env of envs) {
    if (!process.env[env]) {
      throw new Error(`Missing environment variable ${env}`);
    }
  }
}

log.info('NODE_ENV', process.env.NODE_ENV);
for (const env of [
  'DEV_MODE',
  'LOG_LEVEL',
  'NKS_DISPATCH_CALLSIGN',
  'AAL_DISPATCH_CALLSIGN'
]) {
  log.debug(env, process.env[env]);
};
const runArrivalMessage = () =>
  Promise.all([
    arrivalMessage('NKS'),
    arrivalMessage('AAL')
  ]);


if (process.env.DEV_MODE == 'false') {
  checkEnv(['HOPPIE_LOGON']);
  log.info('Starting scheduler');
  schedule('* * * * *', () => {
    void runArrivalMessage()
  });
} else {
  log.info('DEV_MODE is on - running once')
  runArrivalMessage().finally(() => {
    void redisClient.quit();
  });
}
