import 'dotenv/config'
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

for (const env of [
  'NODE_ENV',
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
    void (async () => {
      await arrivalMessage();
    })();
  });
} else {
  log.info('DEV_MODE is on - running once')
  void (async () => {
     await arrivalMessage();
  })();
}
