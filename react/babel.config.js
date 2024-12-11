const ReactCompilerConfig = {
    'react-compiler/react-compiler': 'error',
}

module.exports = {
    presets: [
      '@babel/preset-env',
      ['@babel/preset-react', {runtime: 'automatic'}],
    ],
    plugins: [
        ['babel-plugin-react-compiler', ReactCompilerConfig]
    ]
  };