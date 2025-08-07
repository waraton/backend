const { escapeXML } = require('ejs')
const express = require('express')
const myApp = express()

myApp.set("view engine", 'ejs')
myApp.use(express.urlencoded({extended:false}))
myApp.use(express.static("public"))
myApp.use(function (req,res,next){
  res.locals.errors = []
  next()
})

myApp.get('/', (req,res)=>{
res.render('home')
})
myApp.get('/login', (req,res)=>{
res.render('login')
})
myApp.post('/register',(req,res)=>{
  const errors = []
// ensure inputs are not empty
  if (typeof req.body.username !== 'string') req.body.username = ''
  if (typeof req.body.password !== 'string') req.body.password = ''
  req.body.username.trim()
// username validation
  if (!req.body.username) errors.push('You must provide a username.')
  if (req.body.username && req.body.username.length < 3) errors.push('You must provide a username with at least 3 characters')
  if (req.body.username && req.body.username.length > 10) errors.push('You must provide a username with at most 10 characters')
  if (req.body.username && !req.body.username.match(/^[a-zA-Z0-9]+$/)) errors.push('You must provide a username with only alphanumeric characters and no special signs')
// password validation
  if (!req.body.password) errors.push('You must provide a password.')
  if (req.body.password && req.body.password.length < 6) errors.push('You must provide a password with at least 6 characters')
  if (req.body.password && req.body.password.length > 70) errors.push('You must provide a password with at most 70 characters')
//errors check if any in the array
  if(errors.length){
    return res.render("home", {errors})
  }
  
  res.send('Thaaaaaanks....')
})
  
myApp.listen(3000)