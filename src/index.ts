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
  'DISPATCH_CALLSIGN',
]) {
  log.debug(env, process.env[env]);
};

checkEnv(['DISPATCH_CALLSIGN']);
if (process.env.DEV_MODE == 'false') {
  checkEnv(['HOPPIE_LOGON']);
  log.info('Starting scheduler');
  schedule('* * * * *', () => {
    void arrivalMessage();
  });
} else {
  log.info('DEV_MODE is on - running once')
  void arrivalMessage().finally(() => {
    void redisClient.quit();
  });
}
