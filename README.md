# vSpirit-Dispatch

[ACARS](https://en.wikipedia.org/wiki/ACARS) messaging client for vSpirit dispatching services. Learn more about us
at [vSpirit.io](https://www.vspirit.io/).

Messages sent by this service can be
viewed [here](https://www.hoppie.nl/acars/system/callsign.html?network=VATSIM&callsign=NKS).

## Commands

1. `npm run dev` - Runs the auto-restarting dev server
2. `npm run build` - Runs the TS compiler (`tsc`)
3. `npm run start` - Runs compiled JS code with Node.

## Routes

* `localhost:3000/dispatch/{fileName}` - Retrieves a file as outlined [here](https://www.hoppie.nl/acars/prg/dispatch/)
  under "File Store".
