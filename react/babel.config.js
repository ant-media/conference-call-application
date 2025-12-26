module.exports = {
    presets: [
      '@babel/preset-env',
      ['@babel/preset-react', {runtime: 'automatic'}],
    ],
    plugins: [
        ['babel-plugin-react-compiler', {
            'react-compiler/react-compiler': 'error',
        }],
        'babel-plugin-istanbul'
    ]
  };