require('dotenv').config()
const express = require('express')
const axios = require('axios')
const mysql = require('mysql')
const {parse, stringify} = require('flatted')
const api = express()
const { check, validationResult } = require('express-validator') 
const helmet = require('helmet')
const BitGoJS = require('bitgo')


//const nodemailer = require('nodemailer')


const bitgo = new BitGoJS.BitGo({ env: process.env.SERVER, accessToken: process.env.ACCESS_TOKEN })


api.use(express.json())
api.use(express.urlencoded({ extended: true }))



api.use(helmet.contentSecurityPolicy())
api.use(helmet.expectCt())
api.use(helmet.hidePoweredBy())
api.use(helmet.hsts())
api.use(helmet.noSniff())
api.use(helmet.xssFilter())
api.use(helmet.frameguard())


const validateJSON = (request, response, next) => {
    const error = []
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
        
        for (var i in errors.array()){
            error.push(errors.errors[i].msg)
        }

        return response.status(400).json({
            'status' : false,
            'message' : 'One or more fields cannot be validated',
            'data' : error
        });
    } else {
        next()
    }
}




api.get('/wallet/new/:type', [
    check('type').isIn(['tbtc', 'teth', 'busd', 'dash']).withMessage('Wallet must either be btc, eth, dash or busd')
], validateJSON, (request, response) => {
    let walletx
    var type = request.params.type

    
    bitgo.coin(`${type}`).wallets().generateWallet({
        'passphrase' : 'sha512silverg33kgmailcom)', //must be alphanumeric
        'label' : 'My pandar crypto wallet'
    }, function(e, data){
        if(e) {
            //throw e
            response.status(503).json({
                'status' : false,
                'message' : 'Unable to generate wallet'
            })
        } else {

            walletx = data.wallet //typescript object, not JSON
            var walletID = data.wallet._wallet.id

            walletx.createAddress({ "chain": 10 }, function callback(e, address) {
                console.dir(address);

                response.status(200).json({
                    'status' : true,
                    'message' : 'Wallet address has been generated',
                    'wallet' : walletID,
                    'data' : address
                })

            })
        }
    })
})














api.post('/wallet/send/:type', [
    check('type').isIn(['tbtc', 'teth', 'busd']).withMessage('Wallet must either be btc eth or busd'),
    check('amount').isNumeric().withMessage('Please enter a valid amount'),
    check('address').isAlphanumeric().withMessage('Please enter a valid destination wallet address')
], validateJSON, (request, response) => {

    var type = request.params.type
    var amount = request.body.amount //in btc
    var address = request.body.address ///recipient


    var wallet = "5f64d38e4b2abe00267afecbc0e8b8b1" //from the user (email)
    var pass = "sha512slcomx" //from the user (email)

    bitgo.coin(`${type}`).wallets().get({
        'id' : wallet
    }).then(function(data) {

        data.send({
            'amount' : 0.01 * 1e8,
            'address' : address,
            'walletPassphrase' : pass
        }).then(function(data){
            console.dir(data)
            response.status(200).json({
                'status' : true,
                'message' : 'Transaction successful',
                'body' : data
            })
        }).catch((e) => {
            response.status(403).json({
                'status' : false,
                'message' : e.message
            })
        })

    }).catch((e) => {
        response.status(400).json({
            'status' : false,
            'message' : e.message
        })
    })
})


//start listening to port
api.listen(process.env.PORT, ()=> {
  console.log(`listening to api at http://localhost:${process.env.PORT}`)
})
