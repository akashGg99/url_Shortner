require('dotenv').config()

const express = require('express');
const mongoose = require('mongoose');
const router = require('./router/routes')
const path = require("path");
const urlModel = require('./model/urlModel');
const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: false}));  //for ejs form parsing


mongoose.set('strictQuery', true);
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true
})
.then(() => (console.log("mongoDb is connected.")))
.catch(err => console.log(err))


app.set("view engine","ejs")    //declaring template engine
app.set('views',path.resolve("./src/views"))     //mvc views,seting path to ejs files using inbuilt path



app.use('/url', router);

//homepage
app.get('/', async (req,res)=>{
    return res.render("homePage")
}); 


app.listen((process.env.PORT || 3000), function () {
    console.log("express is running on port", process.env.PORT)
});    