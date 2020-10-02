const express = require("express")
const jwt = require('jsonwebtoken')
const { check, validationResult } = require('express-validator')
const router = express.Router()
const BitGoJS = require('bitgo')
const moment = require('moment')
const axios = require('axios')


const bitgo = new BitGoJS.BitGo({ env: process.env.SERVER, accessToken: process.env.ACCESS_TOKEN })

router.use(express.json())
router.use(express.urlencoded({ extended: true }))




const validateJSON = (request, response, next) => {
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
        console.dir(errors.errors)
        return response.status(400).json({
            'status' : false,
            'message' : errors.errors[errors.errors.length - 1].msg
        })
    } else {
        next()
    }
}


//validate jtw
const validateJWT = (request, response, next) => {
    const authHeader = request.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1]

        jwt.verify(token, process.env.KEY, { algorithms : ['HS512']}, (error, user) => {
            if (error) {
                return response.status(401).json({
                    'status' : false,
                    'message' : 'Invalid authentication token'
                })
            }
            request.body.mail = user.mail
            next()
        })
    } else {
        return response.status(401).json({
            'status' : false,
            'message' : 'Authorization is required'
        })
    }
}


//create crypto currency wallet
router.route('/bitcoin/open').get(validateJSON, validateJWT, (request, response) => {
    let walletx
    var mail = request.body.mail
    var coin = 'tbtc'


    //check if user doesn't have wallet
    
    var checkWallet = `SELECT * FROM crypto WHERE email = '${mail}' LIMIT 1`
    
    sql.query(checkWallet, (e, data) => {

        if(e){
            response.status(400).json({
                'status' : false,
                'message' : e.message
            })
        } else {
            if(data.length == 0 || !data[0].address_btc){

                bitgo.coin(`${coin}`).wallets().generateWallet({
                    'passphrase' : process.env.AUTH,
                    'label' : mail
                }, function(e, data){
                    if(e) {
                        response.status(400).json({
                            'status' : false,
                            'message' : e.message
                        })
                    } else {
                        //generate the address and save the wallet
                        walletx = data.wallet //typescript object, not JSON


                        var walletID = data.wallet._wallet.id
                        //switch adress and make sure the address matched the coin specified

            
                        walletx.createAddress({ "chain": 10 }, function callback(e, bit) {
                            var updateAddress = `INSERT INTO crypto SET ?`

                            
                            var insert = {
                                'email' : mail,
                                'wallet' : walletID,
                                'address_btc' : bit.address
                            }
                            
                            sql.query(updateAddress, insert, (e, data) => {
                                response.status(200).json({
                                    'status' : true,
                                    'message' : 'Wallet address has been generated',
                                    'address' : bit.address, //lol, just get me an address
                                    'balance' : 0.0000
                                })
                            })
                        })
                    }
                })
            } else {
                //fetch the address and the balance
                

                response.status(200).json({
                    'status' : true,
                    'message' : 'Bitcoin address already exists',
                    'address' : data[0].address_btc,
                    'balance' : data[0].balance_btc
                })
            }
        }
    })
})



//6623 66.23.237.210




//send crypto currency
router.route('/bitcoin/send').post([
    check('amount').isDecimal().withMessage('Please enter a valid amount in BTC'),
    check('address').isAlphanumeric().isLength({ min : 20, max : 40 }).withMessage('Please enter a valid recipient BTC wallet address'),
    check('auth').isNumeric().isLength(4).withMessage('Enter a valid 4 digit security code')
], validateJSON, validateJWT, (request, response) => {

    var coin = 'tbtc'
    var mail = request.body.mail
    var amount = request.body.amount //in btc
    var address = request.body.address ///recipient

    var satoshi = amount * 1e8
    //get wallet here
    var walletSQL = `SELECT wallet FROM crypto WHERE email = '${mail}'`
    sql.query(walletSQL, (e, user) => {
        if(e){
            response.status(500).json({
                'status' : false,
                'message' : e.message
            })
        } else {
            
            var wallet = user[0].wallet
            
            bitgo.coin(`${coin}`).wallets().get({
                'id' : wallet
            }).then(function(data) {
        
                data.send({
                    'amount' : satoshi,
                    'address' : address,
                    'walletPassphrase' : process.env.AUTH
                }).then(function(data){
        
                    //deduct money from wallet jire
                    var chargeSQL = `UPDATE crypto SET balance_btc = balance_btc - '${amount}' WHERE email = '${mail}'`
                    sql.query(chargeSQL, () => {})
        
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
        }
    })
})






//list crypto transfers
router.route('/bitcoin/trx').get(validateJSON, validateJWT, (request, response) => {

    let balance //be empty
    var coin = 'tbtc'
    var mail = request.body.mail



    //get wallet and balance from user
    var walletSQL = `SELECT wallet, address_btc FROM crypto WHERE email = '${mail}'`
    sql.query(walletSQL, (e, user) => {
        if(e){
            response.status(401).json({
                'status' : true,
                'message' : 'Unable to fetch user wallet'
            })
        } else {
            var wallet = user[0].wallet
            var address = user[0].address_btc

            bitgo.coin(`${coin}`).wallets().get({
                'id' : wallet
            }).then(function(data) {


                data.getAddress({
                    address : address
                }).then(function(addr){
                    //load balance
                    balance = (addr.balance.totalReceived / 1e8).toFixed(4)

                    //save balance
                    var saveBTC = `UPDATE crypto SET balance_btc = '${balance}' WHERE email = '${mail}'`
                    sql.query(saveBTC, () =>{ })
                }).then(() =>{
                    //load transactions
                    data.transfers({ limit : 20 }).then(function(list){
                        var trx = []
                        //rewrite the list
                        for(var i in list.transfers){
    
                            var object = list.transfers[i]
    
                            var trxTXID = object.txid
                            var trxType = object.type
                            var trxValue = (object.baseValue / 1e8).toFixed(4).toString().replace('-', '')
                            var trxUSD = (object.usd).toFixed(2).toString().replace('-', '')
                            var trxRate = Math.round(object.usdRate)
                            var trxDate = moment.utc(object.date).format('MMMM D, YYYY @ h:mm a')
                            var trxStatus = object.state
                            var trxFrom = object.inputs[object.inputs.length - 1].address //0 or last ??
                            var trxTo = object.outputs[object.outputs.length -1].address //0 or last? i think last
                            
                            trx.push({
                                'status' : trxStatus,
                                'hash' : trxTXID,
                                'type' : trxType,
                                'value' : trxValue,
                                'from' : trxFrom,
                                'to' : trxTo,
                                'usd' : trxUSD,
                                'rate' : trxRate,
                                'time' : trxDate
                            })
                        }
    
    
                        response.status(200).json({
                            'status' : true,
                            'message' : 'Transaction list fetched',
                            'balance' : balance,
                            'data' : trx
                        })
                    }).catch((e) => {
                        response.status(503).json({
                            'status' : false,
                            'message' : e.message
                        })
                    })
                })
            }).catch((e) => {
                response.status(400).json({
                    'status' : false,
                    'message' : e.message
                })
            })
        }
    })
})



module.exports = router;