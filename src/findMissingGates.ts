import _ from 'lodash'

import gates from './data/gates'
import routes from './data/routes'

// Poorly-written script for finding airports we're missing the gate info for.

const missing: string[] = []

routes.forEach((route) => {
  const gate1 = gates.filter((gate) => gate.icao === route.dep)
  const gate2 = gates.filter((gate) => gate.icao === route.arr)
  if (gate1.length === 0) {
    missing.push(route.dep)
  }
  if (gate2.length === 0) {
    missing.push(route.arr)
  }
})

console.log(_.sortedUniq(missing.sort()))
