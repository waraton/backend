require("dotenv").config();
//html sanitizer
const sanitizeHTML = require("sanitize-html");
//access the env file
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { escapeXML } = require("ejs");
const cookieParser = require("cookie-parser");
const express = require("express");
const db = require("better-sqlite3")("myDb.db");
db.pragma("journal_mode = WAL");

//db setup
const createTables = db.transaction(() => {
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username STRING NOT NULL UNIQUE,
      password STRING NOT NULL UNIQUE
    )
  `
  ).run();

  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS myPosts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      createDate TEXT,
      title STRING NOT NULL,
      body TEXT NOT NULL,
      authorId INTEGER,
      FOREIGN KEY (authorId) REFERENCES users (id)
    )
  `
  ).run();
});
createTables();

const myApp = express();

myApp.set("view engine", "ejs");
myApp.use(express.urlencoded({ extended: false }));
myApp.use(express.static("public"));
myApp.use(cookieParser()); //parse the cookies
myApp.use(function (req, res, next) {
  res.locals.errors = [];

  // decode cookie?
  try {
    const decoded = jwt.verify(req.cookies.myAppCookie, process.env.JWTSECRET);
    req.user = decoded;
  } catch (err) {
    req.user = false;
  }

  //send data global and call next
  res.locals.user = req.user;
  console.log(req.user);
  next();
});

myApp.get("/", (req, res) => {
  if (req.user) {
    const ourStatement = db.prepare('SELECT * FROM myPosts WHERE authorId = ?')
    const posts = ourStatement.all(req.user.userid)
    return res.render("dashboard", {posts});
  } else {
    res.render("home");
  }
});

//logout of your account
myApp.get("/logout", (req, res) => {
  res.clearCookie("myAppCookie");
  res.redirect("/");
});

myApp.get("/login", (req, res) => {
  res.render("login");
});

// check if logged in middle ware
function mustBeLoggedIn(req, res, next) {
  if (req.user) {
    return next();
  }
  return res.redirect("/");
}

//shared validation
function sharedValidation(req) {
  const errors = [];

  if (typeof req.body.title !== "string") req.body.title = "";
  if (typeof req.body.body !== "string") req.body.body = "";

  // trim  and or sanitize html
  req.body.title = sanitizeHTML(req.body.title.trim(), {
    allowedTags: [],
    allowedAttributes: {},
  });
  req.body.body = sanitizeHTML(req.body.body.trim(), {
    allowedTags: [],
    allowedAttributes: {},
  });

  if (!req.body.title || !req.body.body)
    errors.push("You must provide a title / body text");

  return errors;
}

//create posts
myApp.get("/create-post", mustBeLoggedIn, (req, res) => {
  res.render("create-post");
});

myApp.post("/create-post", mustBeLoggedIn, (req, res) => {
  const errors = sharedValidation(req);

  if (errors.length) {
    return res.render("create-post", { errors });
  }

  //save into database
  const ourStatement = db.prepare(
    "INSERT INTO myPosts (createDate,title,body,authorId) VALUES (?,?,?,?)"
  );
  const result = ourStatement.run(
    new Date().toISOString(),
    req.body.title,
    req.body.body,
    req.user.userid
  );
  // redirects to new route
  const getPostStatement = db.prepare("SELECT * FROM myPosts WHERE ROWID = ?");
  const realPost = getPostStatement.get(result.lastInsertRowid);

  res.redirect(`/post/${realPost.id}`);
});
myApp.get("/post/:id", (req, res) => {
  const ourStatement = db.prepare(
    "SELECT myPosts.*,users.username FROM myPosts INNER JOIN users ON myPosts.authorId =users.id WHERE myPosts.id = ?"
  );
  const post = ourStatement.get(req.params.id);

  if (!post) {
    return res.redirect("/");
  }
  res.render("single-post", { post });
});

// login to your account
myApp.post("/login", (req, res) => {
  let errors = [];
  // ensure inputs are strings
  if (typeof req.body.username !== "string") req.body.username = "";
  if (typeof req.body.password !== "string") req.body.password = "";
  // username validation
  //- password and username not empty
  if (req.body.username.trim() == "" || req.body.password == "") {
    errors = ["Invalid username/password!"];
  }

  // errors length check
  if (errors.length) {
    return res.render("login", { errors });
  }
  // lookUp user in the db
  const UserRequiringAccess = db.prepare(
    "SELECT * FROM users WHERE USERNAME = ?"
  );
  const userInQuestion = UserRequiringAccess.get(req.body.username);

  if (!userInQuestion) {
    errors = ["Invalid username/password!!!"];
    return res.render("login", { errors });
  }
  // decrypt password and compare
  const matchOrNot = bcrypt.compareSync(
    req.body.password,
    userInQuestion.password
  );
  // match password
  if (!matchOrNot) {
    errors = ["Invalid username/password!!!"];
    return res.render("login", { errors });
  } else {
    // if true match and give cookie
    const secretValueToken = jwt.sign(
      {
        exp: Math.floor(Date.now() / 1000) * 60 * 60,
        school: "lire",
        likes: "css",
        program: "JavaScript, Phyton",
        userid: userInQuestion.id,
        name: userInQuestion.username,
      },
      process.env.JWTSECRET
    );
    res.cookie("myAppCookie", secretValueToken, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 1000 * 3600,
      /* a 1 day lifespan cookie accessible from server sent over https */
    });
    res.redirect("/");
  }
});
// create an account
myApp.post("/register", (req, res) => {
  const errors = [];
  // ensure inputs are not empty
  if (typeof req.body.username !== "string") req.body.username = "";
  if (typeof req.body.password !== "string") req.body.password = "";
  req.body.username.trim();
  // username validation
  if (!req.body.username) errors.push("You must provide a username.");
  if (req.body.username && req.body.username.length < 3)
    errors.push("You must provide a username with at least 3 characters");
  if (req.body.username && req.body.username.length > 10)
    errors.push("You must provide a username with at most 10 characters");
  if (req.body.username && !req.body.username.match(/^[a-zA-Z0-9]+$/))
    errors.push(
      "You must provide a username with only alphanumeric characters and no special signs"
    );
  // check usage of username in the db
  const checkStatement = db.prepare("SELECT * FROM users WHERE USERNAME = ? ");
  const usernameCheck = checkStatement.get(req.body.username);
  if (usernameCheck) errors.push("Username is already taken!!");

  // password validation
  if (!req.body.password) errors.push("You must provide a password.");
  if (req.body.password && req.body.password.length < 6)
    errors.push("You must provide a password with at least 6 characters");
  if (req.body.password && req.body.password.length > 70)
    errors.push("You must provide a password with at most 70 characters");
  //errors check if any in the array
  if (errors.length) {
    return res.render("home", { errors });
  }
  // save sign up info to database
  /* ! encrypt password */
  const salt = bcrypt.genSaltSync(10);
  req.body.password = bcrypt.hashSync(req.body.password, salt);

  const ourStatement = db.prepare(
    "INSERT INTO users (username,password) VALUES (?,?)"
  );
  const result = ourStatement.run(req.body.username, req.body.password);
  // look up user
  const lookUpStatement = db.prepare("SELECT * FROM users WHERE ROWID = ?");
  const theUser = lookUpStatement.get(result.lastInsertRowid);

  // log user in by giving them a cookie

  // generate a long cookie value using jwt
  const secretValueToken = jwt.sign(
    {
      exp: Math.floor(Date.now() / 1000) * 60 * 60,
      school: "lire",
      likes: "css",
      program: "JavaScript, Phyton",
      userid: theUser.id,
      name: theUser.username,
    },
    process.env.JWTSECRET
  );
  res.cookie("myAppCookie", secretValueToken, {
    httpOnly: true,
    secure: false,
    sameSite: "strict",
    maxAge: 1000 * 3600,
    /* a 1 day lifespan cookie accessible from server sent over https */
  });
  res.redirect("/");
});

/*
 * validation: 36 min
 * cookies: 51 min
 * com9onents in one 9lace
 */

myApp.listen(3000);
