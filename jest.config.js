/** @type {import('ts-jest').JestConfigWithTsJest} **/

process.env = Object.assign(process.env, {
  DATA_ENCRYPTION_KEY_HEX: 'f94a98e130c561ac9f499ecee45bb669efadda7a5132e5344fb57904c05273a5'
})

module.exports = {
  testRegex: '^.+\\.test.ts?$',
  globalSetup: '<rootDir>/src/db/test_db_setup.ts',
  globalTeardown: '<rootDir>/src/db/test_db_teardown.ts',
  transform: {
    "^.+.ts$": ["ts-jest",{}],
  },
};