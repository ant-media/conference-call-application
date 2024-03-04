module.exports = {
    collectCoverage: true,
    coverageReporters: ["json", "lcov", "text", "clover"],
    collectCoverageFrom: ['src/Components/*.js','src/pages/*.js'],
    coverageDirectory: 'coverage',
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    moduleNameMapper:{
        "\\.(css|less|sass|scss)$": "<rootDir>/src/__mocks__/styleMock.js",
        "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$": "<rootDir>/src/__mocks__/fileMock.js"
   },
   //changedSince:'origin/main',
   /*
   coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: -10,
    },
  },
  */
   moduleDirectories: [
    "node_modules",
    "src"
],
transformIgnorePatterns: [
    "node_modules/(?!@ngrx|(?!deck.gl)|ng-dynamic)"
  ]
  };