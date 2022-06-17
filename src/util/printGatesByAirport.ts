import gates from '../data/gates'

process.argv
  .slice(2)
  .forEach((arg) =>
    console.log(gates.filter((gate) => gate.icao === arg.toUpperCase()))
  )
