require('dotenv').config()
const express = require('express')
const mysql = require('mysql')
const helmet = require('helmet')
const api = express()


//setup security
api.use(helmet.contentSecurityPolicy())
api.use(helmet.expectCt())
api.use(helmet.hidePoweredBy())
api.use(helmet.hsts())
api.use(helmet.noSniff())
api.use(helmet.xssFilter())
api.use(helmet.frameguard())


//require major routes
require('./routes')(api)


api.get('/', (request, response) => {
    response.status(200).send('PandarJS microservice online')
})

api.all('*', (request, response) => {
    response.status(502).json({
        'status' : false,
        'message' : 'Invalid request'
    })
})


//start listening to port
api.listen(process.env.PORT, ()=> {
  console.log(`listening to api at http://localhost:${process.env.PORT}`)
})
