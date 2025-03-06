module.exports = {
    env: {
        browser: true,
        es6: true,
        node: true
    },
    plugins: [
        'react',
        'react-compiler'
    ],
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true
        }
    },
    rules: {
        'react-compiler/react-compiler': 'error'
    },
    settings: {
        react: {
            version: 'detect'
        }
    }
};