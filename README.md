# vspirit-dispatch

[ACARS](https://en.wikipedia.org/wiki/ACARS) messaging client for vspirit dispatching services. Learn more about us
at [vspirit.io](https://www.vspirit.io/).

Messages sent by this service can be
viewed [here](https://www.hoppie.nl/acars/system/callsign.html?network=VATSIM&callsign=NKS).

## Local Development
Create an `.env` file by copying `.env.example`. By default `DEV_MODE` will be set to true, so you can run the code
locally and the output will be displayed on screen rather than getting sent to HOPPIE.

When `DEV_MODE` is set to true, the system will immediately run once and exit. When set to false, a schedule will
be set to check for flights at the top of every minute.

### Commands

#### Local Environment
1. `npm run dev` - Runs the auto-restarting dev server with `nodemon`
2. `npm run build` - Runs the TS compiler (`tsc`)
3. `npm run start` - Runs compiled JS code with Node.

#### Docker
You can use docker to boot up an environment that runs the dispatch server in development mode along with a Redis
container.

Run `docker compose up` to launch. For more information see the
[Docker Compose documentation](https://docs.docker.com/compose/).

## Deployments

We use [fly.io](https://fly.io) for hosting this service. To run deployments, you must have the `flyctl` command line
tool installed. Follow the instructions here to [install flyctl](https://fly.io/docs/hands-on/install-flyctl/). In
addition, you must be added to the `vspirit-admin` Fly organization. vspirit Admins in Discord will be able to assist
with adding you.

### Commands

1. `npm run deploy.staging` - Deploys to the staging environment.
2. `npm run deploy.production` - Deploys to the production environment.
