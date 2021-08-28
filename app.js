var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var socketapi = require("./socketapi");

var userRouter = require("./routes/user");
var adminRouter = require("./routes/admin");
var employerRouter = require("./routes/employer");
var hbs = require("express-handlebars");
var session = require("express-session");
var flash = require("connect-flash");

var app = express();
var fileUpload = require("express-fileupload");
var db = require("./config/connection");
var handlebars = require("handlebars");
var moment = require("moment");
var passport = require("passport");
var LinkedInStrategy = require("passport-linkedin-oauth2").Strategy;
var GitHubStrategy = require("passport-github").Strategy;
var GoogleStrategy = require("passport-google-oauth20").Strategy;
const { Strategy } = require("passport");
const userHelpers = require("./helpers/user-helpers");
const collection = require("./config/collection");
const { SafeString } = require("handlebars");
require('dotenv').config()

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");
app.engine(
  "hbs",
  hbs({
    extname: "hbs",
    defaultLayout: "layout",
    layoutsDir: __dirname + "/views/layout/",
    partialsDir: __dirname + "/views/partials/",
  })
);

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(fileUpload());
app.use(
  session({
    secret: "key",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 100000000000000 },
  })
);

db.connect((err) => {
  if (err) console.log("Connection Error" + err);
  else console.log("Database Connected");
});

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use("/", userRouter);
app.use("/admin", adminRouter);
app.use("/employer", employerRouter);

//user side

passport.use(
  new LinkedInStrategy(
    {
      clientID: process.env.LINKED_IN_ID,
      clientSecret: process.env.LINKED_IN_SECRET,
      callbackURL: "http://jobby.arjunviswam.ml/auth/linkedin/callback",
      scope: ["r_emailaddress", "r_liteprofile"],
    },
    function (accessToken, refreshToken, profile, done) {
      // asynchronous verification, for effect...
      process.nextTick(async function () {
        let userData = {};
        userData.firstname = profile.displayName;
        userData.linkedId = profile.id;
        let user = await db
          .get()
          .collection(collection.USER_COLLECTION)
          .findOne({ linkedId: profile.id });
        if (user) {
          return done(null, user);
        } else {
          db.get()
            .collection(collection.USER_COLLECTION)
            .insertOne(userData)
            .then((users) => {
              let user = users.ops[0]
              return done(null, user);
            });
        }
      });
    }
  )
);

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
      callbackURL: "http://jobby.arjunviswam.ml/auth/github/callback",
    },
    async function (accessToken, refreshToken, profile, cb) {
      let userData = {};
      userData.firstname = profile.username;
      userData.githubId = profile.id;
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ githubId: profile.id });
      if (user) {
        return cb(null, user);
      } else {
        db.get()
          .collection(collection.USER_COLLECTION)
          .insertOne(userData)
          .then((users) => {
            let user = users.ops[0]
            let err = null
            return cb(err, user);
          });
      }
    }
  )
);

passport.serializeUser(function (user, cb) {
  cb(null, user);
});

passport.deserializeUser(function (id, cb) {
  cb(null, id);
});

passport.use(
  new GoogleStrategy(
    {
      clientID:
       process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
      callbackURL: "http://jobby.arjunviswam.ml/auth/google/callback",
    },
    async function (accessToken, refreshToken, profile, cb) {
      let userData = {};
      userData.firstname = profile.displayName;
      userData.googleId = profile.id;
      let user = await db
        .get()
        .collection(collection.USER_COLLECTION)
        .findOne({ googleId: profile.id });
      if (user) {
        return cb(null, user);
      } else {
        db.get()
          .collection(collection.USER_COLLECTION)
          .insertOne(userData)
          .then((users) => {
            let user = users.ops[0]
            return cb(null, user);
          });
      }
    }
  )
);

//employer side

// passport.use(new LinkedInStrategy({
//   clientID: "86n67zqy2omotz",
//   clientSecret:"KK0eNA2GbrJgE2Ug",
//   callbackURL: "http://localhost:5550/employer/auth/linkedin/callback",
//   scope: ['r_emailaddress', 'r_liteprofile'],
// }, function(accessToken, refreshToken, profile, done) {
//   // asynchronous verification, for effect...
//   process.nextTick(async function () {
//     let userData = {}
//   userData.companyname = profile.displayName
//   userData.linkedId = profile.id
//   let user = await db.get().collection(collection.EMPLOYER_COLLECTION).findOne({ linkedId : profile.id})
//   if(user){
//     return done(null, user);
//   }else{
//   db.get().collection(collection.EMPLOYER_COLLECTION).insertOne(userData).then((err, user)=>{
//     return done(null, user);
//   })
// }
//   });
// }));

// passport.use(new GitHubStrategy({
//   clientID: "10ced24de3b02b0f02ab",
//   clientSecret: "3eddd2cbb73fcfdc3f6b166f684d7607aff0a72a",
//   callbackURL: "http://localhost:5550/employer/auth/github/callback"
// },
// async function(accessToken, refreshToken, profile, cb) {
//   let userData = {}
//   userData.companyname = profile.username
//   userData.githubId = profile.id
//   let user = await db.get().collection(collection.EMPLOYER_COLLECTION).findOne({ githubId : profile.id})
//   if(user){
//     return cb(null,user)
//   }else{
//   db.get().collection(collection.EMPLOYER_COLLECTION).insertOne(userData).then((err, user)=>{
//     return cb(err,user);
//   })
// }
// }
// ));

//   passport.serializeUser(function (user, cb) {
//   cb(null, user);
// });

// passport.deserializeUser(function (id, cb) {
//   cb(null, id);
// });

// passport.use(new GoogleStrategy({
//   clientID: "456302544556-gom956k9qc0idda7d21akktm814o64ua.apps.googleusercontent.com",
//   clientSecret: "e1VFgyLl4lYxRyGdBTd0_SXs",
//   callbackURL: "http://localhost:5550/employer/auth/google/callback"
// },
// async function(accessToken, refreshToken, profile, cb) {
//   console.log(profile);
//   let userData = {}
//   userData.companyname = profile.displayName
//   userData.googleId = profile.id
//   let user = await db.get().collection(collection.EMPLOYER_COLLECTION).findOne({ googleId : profile.id})
//   if(user){
//     return cb(null,user)
//   }else{
//   db.get().collection(collection.EMPLOYER_COLLECTION).insertOne(userData).then((err, user)=>{
//     return cb(err,user);
//   })
// }
// }
// ));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

handlebars.registerHelper("inc", function(value, options)
{
    return parseInt(value) + 1;
});

handlebars.registerHelper("formatDate", function (date, format) {
  if (moment) {
    format = moment[format] || format;
    return moment(date).format(format);
  } else {
    return datetime;
  }
});

handlebars.registerHelper("each_upto", function (ary, max, options) {
  if (!ary || ary.length == 0) return options.inverse(this);

  var result = [];
  for (var i = 0; i < max && i < ary.length; ++i)
    result.push(options.fn(ary[i]));
  return result.join("");
});

handlebars.registerHelper("button", function (jobId, applicant, user) {
  if (user && applicant[0]) {
    for(var i=0; i<applicant.length; i++){
      if(user == applicant[i]){
        var btn = ` <a class="link-j1" style="color: green"  title="Apply Now"  >APPLIED </a>`;
        return new handlebars.SafeString(btn);
      }else {
            var btn = ` <a href="/apply/${jobId}" class="link-j1" title="Apply Now"  >APPLY NOW</a>`;
            return new handlebars.SafeString(btn);
     }
    } 
  } 
  else {
    var btn = ` <a href="/apply/${jobId}" class="link-j1" title="Apply Now"  >APPLY NOW</a>`;
    return new handlebars.SafeString(btn);
  }
});

handlebars.registerHelper("viewthejob", function (jobId, applicant, user) {
  console.log(jobId, applicant, user);
  if (user && applicant[0]) {
    for(var i=0; i<applicant.length; i++){
      if(user == applicant[i]){
        var btn = ` <a style="color: white" >APPLIED </a>`;
        return new handlebars.SafeString(btn);
      }else {
            var btn = `<a style="color: white;" href="/apply/${jobId}">APPLY NOW</a>`;
            return new handlebars.SafeString(btn);
     }
    } 
  } 
  else {
    var btn = `<a style="color: white;" href="/apply/${jobId}">APPLY NOW</a>`;
    return new handlebars.SafeString(btn);
  }
});

handlebars.registerHelper("jobview", function (jobId, applicant, user) {
  if (user && applicant[0]) {
    for(var i=0; i<applicant.length; i++){
      if(user == applicant[i]){
        var btn = ` <a ><button class="apled_btn60">APPLIED</button></a>`;
        return new handlebars.SafeString(btn);
      }else {
            var btn = `<a href="/apply/${jobId}"><button class="apled_btn60">APPLY</button></a>`;
            return new handlebars.SafeString(btn);
     }
    } 
  } 
  else {
    var btn = `<a href="/apply/${jobId}"><button class="apled_btn60">APPLY</button></a>`;
    return new handlebars.SafeString(btn);
  }
});

handlebars.registerHelper("priorty", function(priority){
  console.log(priority);
  if(priority == "Medium priorty"){
    var btn = `<div class="priorty priorty_medium">Medium Priorty</div>`;
    return new handlebars.SafeString(btn);
  }else if(priority == "Low priorty"){
    var btn = `<div class="priorty priorty_low">Low Priorty</div> `;
    return new handlebars.SafeString(btn);
  }else{
    var btn = `<div class="priorty">High Priorty</div> `;
    return new handlebars.SafeString(btn);
  }
})

handlebars.registerHelper("statuscheck", function(status,empId,candidates){
  if(status == "active"){
    var btn = `<a href="/employer/appliedCandidates/${empId}"><button class="apled_btn60"><span class="badge badge-light" >${candidates}</span>APPLIED CANDIDATES</button></a> <a href="/employer/edit-postedjob/${empId}" class="delete_icon1"><i class="far fa-edit"></i></a>`
    return new handlebars.SafeString(btn)
  }else{
    var btn = `<button class="apled_btn60"><span class="badge badge-light" ></span>EXPIRED</button>`
    return new handlebars.SafeString(btn)
  }
})

handlebars.registerHelper("category", function(count){
  if(count == "0"){
    var btn = ` <p>No Jobs</p>`
    return new handlebars.SafeString(btn)
  }else{
    var btn = ` <p>${count} Jobs</p>`
    return new handlebars.SafeString(btn)
  }
})

module.exports = { app, socketapi };
