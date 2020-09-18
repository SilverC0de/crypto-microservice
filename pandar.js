require('dotenv').config()
const express = require('express')
const axios = require('axios')
const mysql = require('mysql')
const api = express()
const helmet = require('helmet')
//const nodemailer = require('nodemailer')




api.use(helmet.contentSecurityPolicy())
api.use(helmet.expectCt())
api.use(helmet.hidePoweredBy())
api.use(helmet.hsts())
api.use(helmet.noSniff())
api.use(helmet.xssFilter())
api.use(helmet.frameguard())


// sql = mysql.createConnection({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASS,
//   database: process.env.DB_NAME
// })




//start listening to port
api.listen(process.env.PORT, ()=> {
  console.log(`listening to api at http://localhost:${process.env.PORT}`)
})
