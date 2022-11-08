import 'dotenv/config'
import { arrivalMessage } from './arrivalMessage'
import { schedule } from 'node-cron'

const checkEnv = function(envs: string[]) {
  for (const env of envs) {
    if (!process.env[env]) {
      throw new Error(`Missing environment variable ${env}`);
    }
  }
}

checkEnv(['CALLSIGN']);
if (process.env.DEV_MODE == 'false') {
  checkEnv(['HOPPIE_LOGON']);
  schedule('* * * * *', () => {
    void (async () => {
      await arrivalMessage();
    })();
  });
} else {
  void (async () => {
     await arrivalMessage();
  })();
}
