const express = require("express")
const jwt = require('jsonwebtoken')
const { check, validationResult } = require('express-validator')
const router = express.Router()
const BitGoJS = require('bitgo')
const axios = require('axios')


const bitgo = new BitGoJS.BitGo({ env: process.env.SERVER, accessToken: process.env.ACCESS_TOKEN })



router.use(express.json())
router.use(express.urlencoded({ extended: true }))





router.use(express.json())
router.use(express.urlencoded({ extended: true }))




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


//create crypto currency wallet
router.route('/wallet/new/:coin').get([
    check('coin').isIn(['tbtc', 'teth', 'busd', 'dash']).withMessage('Wallet must either be btc, eth, dash or busd')
], validateJSON, (request, response) => {
    let walletx
    var coin = request.params.coin

    
    bitgo.coin(`${coin}`).wallets().generateWallet({
        'passphrase' : 'sha512silverg33kgmailcom)', //must be alphanumeric
        'label' : 'silverg33jk@outlook.com'
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





//send crypto currency
router.route('/wallet/send/:coin').post([
    check('coin').isIn(['tbtc', 'teth', 'busd']).withMessage('Wallet type must either be btc eth or busd'),
    check('amount').isNumeric().withMessage('Please enter a valid amount'),
    check('address').isAlphanumeric().withMessage('Please enter a valid destination wallet address')
], validateJSON, (request, response) => {

    var coin = request.params.coin
    var amount = request.body.amount //in btc
    var address = request.body.address ///recipient


    var wallet = "5f64d38e4b2abe00267afecbc0e8b8b1" //from the user (email)
    var pass = "sha512slcomx" //from the user (email)

    bitgo.coin(`${coin}`).wallets().get({
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




//list crypto transfers
router.route('/wallet/trx/:coin').get([
    check('coin').isIn(['tbtc', 'teth', 'busd', 'dash']).withMessage('Coin type must either be btc, eth, dash or busd')
], validateJSON, (request, response) => {

    var coin = request.params.coin

    //get wallet from user
    var wallet = '5f64d38e4b2abe00267afecbc0e8b8b1'

    bitgo.coin(`${coin}`).wallets().get({
        'id' : wallet
    }).then(function(data) {
        data.transfers({ limit : 40 }).then(function(list){
            console.dir(list)
            response.status(200).json({
                'status' : true,
                'message' : 'Transaction list fetched',
                'data' : list
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



module.exports = router;