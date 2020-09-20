module.exports = (api) => {
    api.use('/', require('./crypto.js')) //signin, password recovery, register
}