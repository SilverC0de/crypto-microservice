const express = require("express")
const jwt = require('jsonwebtoken')
const { check, validationResult } = require('express-validator')
const router = express.Router()
const axios = require('axios')

router.use(express.json())
router.use(express.urlencoded({ extended: true }))




//validate input
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


//validate user
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



router.route('/pay').post([

], validateJSON, validateJWT, (request, response) => {
    //check balance and all then send out
    
})


module.exports = router;