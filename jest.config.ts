import { createDefaultEsmPreset, type JestConfigWithTsJest } from 'ts-jest'

const defaultEsmPreset = createDefaultEsmPreset()

const jestConfig: JestConfigWithTsJest = {
  ...defaultEsmPreset,
  moduleNameMapper: {
    // This maps the .js extension in imports back to the .ts files for Jest
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
}

export default jestConfig