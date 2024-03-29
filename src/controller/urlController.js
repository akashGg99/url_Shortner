require('dotenv').config()
const shortid = require('shortid')
const axios = require('axios')
const redis = require("redis");
const { promisify } = require("util");
const urlModel = require('../model/urlModel')

const { isvalidUrl } = require('../validation/validator')


//---------------------------------------------- REDIS CONNECT -------------------------------------------------//

// //1. Connecting to the redis server
// const redisClient = redis.createClient(
//     15685,
//     "redis-15685.c264.ap-south-1-1.ec2.cloud.redislabs.com",
//     { no_ready_check: true }
// );
// redisClient.auth("i1p8kuQ6YeyXnhharB6E2Yef7AhHSBDi", function (err) {
//     if (err) throw err;
// });

// redisClient.on("connect", async function () {
//     console.log("Connected to Redis..");
// });


// //2. Prepare the functions for each command
// const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
// const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

//----------------------------------------------------------------------------------------------------------------//




//---------------------------------------------- URL SHORTEN -------------------------------------------------//
//1.
const shortUrl = async (req, res) => {
    try {
        console.log(req.body.longUrl)
        const bodyData = req.body.longUrl

        if (Object.keys(req.body).length === 0) { return res.status(400).send({ status: false, message: "The body can not be empty." })  }

        if (!bodyData) { return res.status(400).send({ status: false, message: "Please provide longUrl in body." }) }

        if (!isvalidUrl(bodyData)) { return res.status(400).send({ status: false, message: "please enter valid Url." }) }


        // //initially checking cache  for data
        // const checkCacheUnique = await GET_ASYNC(`${bodyData}`)

        // if (checkCacheUnique){
        //     return res.status(200).send({
        //         status: true, message: "The url is already shortened(from cache).", data: JSON.parse(checkCacheUnique) })
        // }

        //DB search for duplicate entries..
        const uniqueCheck = await urlModel.findOne({ longUrl: bodyData }).select({ _id: 0, createdAt: 0, updatedAt: 0, __v: 0 })

        if (uniqueCheck) {
            // await SET_ASYNC(`${bodyData}`, JSON.stringify(uniqueCheck), "EX", 120)
            return res.status(200).send({ status: true, message: "The url is already shortened.", data: uniqueCheck })
        }

        //Axios call checking if it is live url or not....
        const checkingUrl = await axios.get(bodyData)
            // .then(() => bodyData)
            .catch(() => null)

        if (!checkingUrl) { return res.status(400).send({ status: false, message: "Please provide valid longUrl." }) }


        //generating the urlcode & shortUrl...
        let urlCode = shortid.generate()
        let shortUrl = "http://localhost:"+ process.env.PORT + "/url/" + urlCode;           //example: https://lh:3000/url/ebnHT54Rfv

        //creating entry in DB...
        const url = {
            longUrl: bodyData,
            shortUrl: shortUrl,
            urlCode: urlCode
        }
        const urlData = await urlModel.create(url)

        //setting the data in cache also..
        // await SET_ASYNC(`${bodyData}`, JSON.stringify(url), "EX", 120)

        // return res.status(201).send({ status: true, data: url })
        return res.render('homePage',{url:url.shortUrl})         //rendering with ejs, passing url to be rendered as response in ejs

    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

//----------------------------------------------------------------------------------------------------------------//


//------------------------------------------- REDIRECTING URL ---------------------------------------------------//
//2.
const getShortUrl = async (req, res) => {
try {
        urlCode = req.params.urlCode

        if (!urlCode) { return res.status(400).send({ status: false, message: "please provide uriCode in params" })  }

        //intially searching cache storage
        // let cahcedUrlData = await GET_ASYNC(`${urlCode}`)

        // if (cahcedUrlData) { return res.status(302).redirect(cahcedUrlData) } 

        else{ 
            //finding in DB..
            const urlData = await urlModel.findOne({ urlCode })

            if (!urlData) { return res.status(404).send({ status: false, message: "no url found with this urlCode." }) }

            //setting data in cache for future requests..
            const longUrl = urlData.longUrl
            // await SET_ASYNC(`${urlCode}`, (longUrl), "EX", 120)

            return res.status(302).redirect(longUrl)
        }
    } 
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

//------------------------------------------------------------------------------------------------------------------//

module.exports = { shortUrl, getShortUrl }