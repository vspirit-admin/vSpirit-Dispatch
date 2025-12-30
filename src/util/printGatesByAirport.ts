import gates from '../data/gates.js'

process.argv
  .slice(2)
  .forEach((arg) =>
    console.log(gates.filter((gate) => gate.icao === arg.toUpperCase()))
  )
