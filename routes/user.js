const { response } = require("express");
var express = require("express");
const { render } = require("../app");
var router = express.Router();
var employerHelpers = require("../helpers/employer-helpers");
var userHelpers = require("../helpers/user-helpers");
const passport    = require('passport')
require('dotenv').config()

let accountSid =  process.env.TWILIO_ACCOUNT_SID
let authToken =  process.env.TWILIO_AUTH_TOKEN
const client = require("twilio")(accountSid,authToken)

const verifyLogin = (req, res, next) => {
  if (req.session.userLoggedIn) {
    next();
  } else {
    res.redirect("/login");
  }
};

/* GET home page. */
router.get("/", async function (req, res, next) {
  if(req.session.user){
    let users = req.session.user
    let jobs = await userHelpers.getAlljobs()
    let companies = await userHelpers.getAllCompanies()
    let category = await userHelpers.getAllCategory()
    let test = await userHelpers.getMachineTest(users._id)
    userHelpers.getAllThecount().then((counts)=>{
    // let notification = await userHelpers.checkNotification(req.session.user._id)
  res.render('user/home',{user:true,search:true,users,jobs,companies,LiveSearch:true,counts,category,test})
  })
  }else{
    res.redirect('/login')
  }
})  

router.get("/login", (req, res) => {
  if(req.session.user){
    res.redirect('/')
  }else{
  res.render('user/login',{log:true,loginErr: req.session.loginErr,userBlock : req.session.userblock})
  req.session.loginErr = false
  req.session.userblock = false
  }
})

router.post('/getNumberOfJobs',(req,res)=>{
  userHelpers.getNumberOfJobs(req.body.companyId).then((count)=>{
    res.json(count)
  })
})

router.post('/login',(req,res)=>{
  userHelpers.doLogin(req.body).then((response)=>{
    if(response.status){
      req.session.userLoggedIn = true
      req.session.user = response.user
      console.log(req.session.user);
      res.redirect('/')
    } else {
      if (response.block) {
        req.session.userblock = response.block;
        res.redirect("/login");
      } else {
        req.session.loginErr = "Invalid username or password";
        res.redirect("/login");
      }
    }
  });
});

router.get("/signup", (req, res) => {
  res.render("user/signup", {nomatch: req.session.nomatch,log:true,formIn:true});
  req.session.nomatch = false;
});   
 
router.post('/signup',(req,res)=>{
    let serviceId =  process.env.TWILIO_SERVICE_ID
    client.verify
      .services(serviceId)
      .verifications.create({ to: req.body.full, channel: "sms" })
      .then((verification) => {
        console.log(verification.status);

data = req.body
res.render('user/signup-code',{log:true,data})
})
})
  
router.post("/signup-code", (req, res) => {
  let serviceId =  process.env.TWILIO_SERVICE_ID
  client.verify
    .services(serviceId)
    .verificationChecks.create({ to: req.body.mobile, code: req.body.token })
    .then((verification_check) => {
      if (verification_check.status !="pending") {
        userHelpers.doSignup(req.body).then((response) => {
          console.log(req.body);
          if (response.status) {
            req.session.userLoggedIn = true;
            req.session.user = response.data;
            console.log(req.session.user);
            res.redirect("/");
          } else if (response.nomatch) {
            req.session.nomatch = response.nomatch;
            res.redirect("/signup");
          } 
        });
      }
    });
});

router.get("/logout", (req, res) => {
  req.session.user = null;
  req.session.userLoggedIn = false;
  res.redirect("/login");
});

router.get('/otp-login',(req,res)=>{
  res.render('user/otp-login',{log:true})
})

router.post("/otp-login", async (req, res) => {
  let user = await userHelpers.getUserDetails(req.body.full);
  if (user != null) {
    let serviceId =  process.env.TWILIO_SERVICE_ID

    client.verify
      .services(serviceId)
      .verifications.create({ to: req.body.full, channel: "sms" })
      .then((verification) => {
        console.log(verification.status);
      });
    id = req.body.full;
    res.render("user/otp-code", {log:true, id });
  } else {
    loginErr = "This user does not have an account";
    res.render("user/otp-login", {log:true, loginErr });
  }
});

router.post("/otp-code", async (req, res) => {
  let serviceId =  process.env.TWILIO_SERVICE_ID

  client.verify
    .services(serviceId)
    .verificationChecks.create({ to: req.body.id, code: req.body.token })
    .then((verification_check) => {
      if (verification_check.status !="pending") {
        userHelpers.getUserDetails(req.body.id).then((user) => {
          req.session.userLoggedIn = true;
          req.session.user = user;
          res.redirect("/");
        });
      }
    });
});


router.get('/profile',verifyLogin,async(req,res)=>{
  let skills = await userHelpers.getSkills(req.session.user._id)
  let users = await userHelpers.getUserData(req.session.user._id)
  let  language = await userHelpers.getLanguage(req.session.user._id)
  res.render('user/profile',{user:true,users,skills,language})
})

router.get('/edit-profile/:id',async(req,res)=>{
  let users = await userHelpers.getUserData(req.params.id)
  res.render('user/edit-profile',{user:true,formIn:true,users})
})

router.post('/sasi',async(req,res)=>{
  let userId = req.body.user
  let users = await userHelpers.getUserData(userId)
  res.json(users)
})


router.post('/edit-profile/:id',(req,res)=>{
  userHelpers.updateProfile(req.body,req.params.id).then(()=>{
    if(req.files){
      let image = req.files.image2;
      userHelpers.addProfileImage(req.params.id)
    image.mv("./public/profile-photos/" + req.params.id + ".jpg");
      }
  })
  res.redirect('/profile')
})

router.get('/emp-profileview/:id',verifyLogin,async(req,res)=>{
  let users = req.session.user
    let skills = await employerHelpers.getSkills(req.params.id)
    let language = await employerHelpers.getLanguage(req.params.id)
  userHelpers.getCompanyDetails(req.params.id).then((company)=>{ 
    res.render('user/emp-profileview',{user:true,company,skills,language,users})
  })
})

router.get('/postedjob/:id',verifyLogin,async(req,res)=>{
  let users = req.session.user
  let jobs = await userHelpers.getTheJobs(req.params.id)
  userHelpers.getCompanyDetails(req.params.id).then((company)=>{
  res.render('user/company-jobs',{user:true,company,jobs,users})
})
})

router.get('/job-singleview/:id',verifyLogin,async(req,res)=>{
  let users = req.session.user
  let singleView = await userHelpers.getSingleJob(req.params.id)
  res.render('user/job-singleview',{user:true,singleView,users})
})

router.get('/apply/:id',verifyLogin,async(req,res)=>{
  let jobId = req.params.id
  let users = req.session.user
  let user = req.session.user._id
  let userDetails = await userHelpers.getUserData(user)
  res.render('user/applyjob',{user:true,userDetails,formIn:true,jobId,users})
})


router.post('/applyjob',(req,res)=>{
  console.log(req.body);
  userHelpers.applyjob(req.body).then(()=>{
    let resume = req.files.resume
    resume.mv('./public/resume/' + req.body.userId + '.pdf')
    res.redirect('/')
  })
})

router.get('/getnotification',verifyLogin,async(req,res)=>{
  let Notifications = await userHelpers.getNotifications(req.session.user._id)
  res.render('user/notification',{user:true,Notifications})
})

router.get('/user_message/:id',verifyLogin,(req,res)=>{
  let employers = {}
   employers._id = req.session.user._id
   console.log(employers._id);
  let candidates = {}
  candidates.userId =  req.params.id
  console.log(candidates.userId);
  res.render('employer/message',{employers,candidates})
})

router.get('/auth/github',
  passport.authenticate('github'));

  router.get('/auth/github/callback', 
  passport.authenticate('github', { failureRedirect: '/login' }),
  function(req, res) {
    let user = req.user
      req.session.user = user
      req.session.userLoggedIn = true;
      res.redirect('/');
  });

  router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

router.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    let user = req.user
      req.session.user = user
      req.session.userLoggedIn = true;
    res.redirect('/');
  });

router.get('/auth/linkedin',
  passport.authenticate('linkedin', { state: 'user'  }))


router.get('/auth/linkedin/callback', 
passport.authenticate('linkedin', { failureRedirect: '/login'}),
function(req, res) {
  let user = req.user
    req.session.user = user
    req.session.userLoggedIn = true;
  res.redirect('/');
});

router.post("/usersociallink",verifyLogin,(req,res)=>{
  let userId = req.session.user._id
  userHelpers.insertUserSocialLink(req.body,userId).then(()=>{
    res.redirect('/profile')
  })
})

router.post('/SaveJob',verifyLogin,(req,res)=>{
  let userId = req.session.user._id
  userHelpers.saveJob(req.body.Id,userId).then(()=>{
    res.json({status:true})
  })
})

router.get('/getSavedJobs',verifyLogin,async(req,res)=>{
  let userId = req.session.user._id
  let savedcompany = await userHelpers.getSavedCompanies(userId)
  let users = await userHelpers.getUserData(req.session.user._id)
  let savedjobs= await userHelpers.getSavedJobs(userId)
    res.render('user/savedjob',{user:true,users,savedjobs,savedcompany})
  })

router.post('/SaveCompany',verifyLogin,async(req,res)=>{
  let userId = req.session.user._id
  userHelpers.saveCompany(req.body.Id,userId).then(()=>{
    res.json({status:true})
  })
})

router.get('/deleteSavedCompany/:id',(req,res)=>{
  let Id = req.params.id
  userHelpers.deleteSavedCompany(Id).then(()=>{
    res.redirect('/getSavedJobs')
  })
})

router.get('/deleteSavedJob/:id',(req,res)=>{
  let Id = req.params.id
  userHelpers.deleteSavedJob(Id).then(()=>{
    res.redirect('/getSavedJobs')
  })
})

router.post('/UserSearch',verifyLogin,(req,res)=>{
  let users = req.session.user
  let search1 = req.body.Search1
  let search2 = req.body.Search2
  let search3 = req.body.Search3
  console.log(search1,search2,search3);
  userHelpers.userSearch(search1,search2,search3).then((userSearch)=>{
    res.render("user/searchHome",{user:true,userSearch,search:true,users})
  })
})

router.get('/appliedjobs',verifyLogin,async(req,res)=>{ 
  let users = await userHelpers.getUserData(req.session.user._id)
  userHelpers.appliedJobs(req.session.user._id).then((jobs)=>{
    res.render('user/appliedjob',{user:true,users,jobs})
  })
})

router.get('/jobs',verifyLogin,async(req,res)=>{
  let users = req.session.user
  let jobs = await userHelpers.getAlljobs()
  res.render('user/jobs',{user:true,jobs,users,JobsOnly:true,LiveSearch:true})
})

router.get('/companies',verifyLogin,async(req,res)=>{
  let users = req.session.user
  let companies =  await userHelpers.getAllCompanies()
  res.render('user/companies',{user:true,users,companies,JobsOnly:true,LiveSearch:true})
})

router.get('/categoryView/:category',verifyLogin,(req,res)=>{
  let users = req.session.user
  userHelpers.getCategoryJobs(req.params.category).then((jobs)=>{
    res.render('user/category',{user:true,jobs,users})
  })
})

router.get('/machine-test/:id',verifyLogin,(req,res)=>{
  let users = req.session.user
  userHelpers.getSingleMachineTest(req.params.id).then((tests)=>{
    res.render('user/machine-test',{user:true,tests,users})
  })
})

router.post("/changeStatusMT",(req,res)=>{
  userHelpers.changeStatusMT(req.body.id).then(()=>{
    res.json({status:true})
  })
})

router.post('/saveAnswers',verifyLogin,(req,res)=>{
  userHelpers.saveAnswers(req.body,req.session.user._id).then(()=>{
    let answerkey = req.files.answerkey
    answerkey.mv('./public/answerkey/' + req.session.user._id + req.body.jobId + '.pdf')
    res.redirect('/')
  })
})

module.exports = router;
