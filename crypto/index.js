module.exports = (api) => {
    api.use('/', require('./bitcoin.js')) //signin, password recovery, register
}