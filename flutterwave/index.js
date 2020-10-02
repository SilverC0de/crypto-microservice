module.exports = (api) => {
    api.use('/', require('./pay.js')) //signin, password recovery, register
}