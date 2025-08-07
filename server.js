const { escapeXML } = require('ejs')
const express = require('express')
const myApp = express()

myApp.set("view engine", 'ejs')
myApp.use(express.urlencoded({extended:false}))
myApp.use(express.static("public"))

myApp.get('/', (req,res)=>{
res.render('home')
})
myApp.get('/login', (req,res)=>{
res.render('login')
})
myApp.post('/register',(req,res)=>{
  console.log(req.body);
  res.send('Thaaaaaanks....')
})
  
myApp.listen(3000)