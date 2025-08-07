const { escapeXML } = require('ejs')
const express = require('express')
const myApp = express()

myApp.set("view engine", 'ejs')
myApp.use(express.static("public"))

myApp.get('/', (req,res)=>{
  res.render('home')
})

myApp.listen(3000)