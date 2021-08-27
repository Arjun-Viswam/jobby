const { response } = require("express");
var express = require("express");
const session = require("express-session");
var router = express.Router();
var employerHelpers = require('../helpers/employer-helpers');
const userHelpers = require("../helpers/user-helpers");
const passport    = require('passport')
require('dotenv').config()

let accountSid =  process.env.TWILIO_ACCOUNT_SID
let authToken =  process.env.TWILIO_AUTH_TOKEN
const client = require("twilio")(accountSid,authToken)

const stripe = require("stripe")(process.env.STRIPE_SECRET,{
  apiVersion: '2020-08-27',
  appInfo: { // For sample support and debugging, not required for production:
    name: "stripe-samples/checkout-one-time-payments",
    version: "0.0.1",
    url: "https://github.com/stripe-samples/checkout-one-time-payments"
  }
});

const verifyLogin = (req, res, next) => {
  if (req.session.empLoggedIn) {
    next();
  } else {
    res.redirect("/employer/emp-login");
  }
};

/* GET home page. */

router.get('/',(req,res)=>{
    if(req.session.emp){
      employerHelpers.getEmployerDetails(req.session.emp._id).then(async(employers)=>{
        let jobcount = await employerHelpers.getjobcount(req.session.emp._id)
        let activeCount = await employerHelpers.getActiveCount(req.session.emp._id)
        let expiredCount = await employerHelpers.getExpiredCount(req.session.emp._id)
        let pieChart = [jobcount,activeCount,expiredCount]
        let notes = await employerHelpers.getNotes(req.session.emp._id)
    res.render('employer/dashboard',{employer:true,employers,jobcount,notes,activeCount,expiredCount,pieChart})
  })  
    }else{
        res.redirect('/employer/emp-login')
    }       
})

router.get('/emp-login',(req,res)=>{
    if(req.session.emp){
        res.redirect('/employer')
      }else{
      res.render('employer/emp-login',{log:true,empLoginErr: req.session.empLoginErr,empblock:req.session.userblock})
      req.session.empLoginErr = false
      req.session.userblock = false
    }
})

router.post('/emp-login',(req,res)=>{
    employerHelpers.doEmpLogin(req.body).then((response)=>{
        if(response.status){
            req.session.empLoggedIn = true
            req.session.emp = response.user
            res.redirect('/employer')
          } else {
            if (response.block) {
              req.session.userblock = response.block;
              res.redirect("/employer/emp-login");
            } else {
              req.session.empLoginErr = "Invalid username or password";
              res.redirect("/employer/emp-login");
            }
          }
        });
    });

router.get('/emp-otp-login',(req,res)=>{
     res.render('employer/emp-otp-login',{log:true})
      })

router.post('/emp-otp-login',async(req,res)=>{
    console.log(req.body.full);
    let employer = await employerHelpers.getEmpDetails(req.body.full);
    if (employer != null) {
      let serviceId =  process.env.TWILIO_SERVICE_ID
  
      client.verify
        .services(serviceId)
        .verifications.create({ to: req.body.full, channel: "sms" })
        .then((verification) => {
      id = req.body.full;
      res.render("employer/emp-otp-code", {log:true, id });
    });
    } else {
      empLoginErr = "This user does not have an account";
      res.render("employer/emp-otp-login", {log:true, empLoginErr });
    }
  });

  
  router.post("/emp-otp-code", async (req, res) => {
    let serviceId =  process.env.TWILIO_SERVICE_ID
  
    client.verify
      .services(serviceId)
      .verificationChecks.create({ to: req.body.id, code: req.body.token })
      .then((verification_check) => {
        if (verification_check.status !="pending") {
          employerHelpers.getEmpDetails(req.body.id).then((employer) => {
            req.session.empLoggedIn = true;
            req.session.emp = employer;
            res.redirect("/employer");
          });
        }
      });
  });


router.get('/emp-signup',(req,res)=>{
    res.render('employer/emp-signup',{log:true})
})


router.post('/emp-signup',(req,res)=>{
      let serviceId =  process.env.TWILIO_SERVICE_ID
  
      client.verify
        .services(serviceId)
        .verifications.create({ to: req.body.full, channel: "sms" })
        .then((verification) => {
          console.log(verification.status);
  })
  data = req.body
  res.render('employer/emp-signup-code',{log:true,data})
  })
    
  router.post("/emp-signup-code", (req, res) => {
    let serviceId =  process.env.TWILIO_SERVICE_ID
    client.verify
      .services(serviceId)
      .verificationChecks.create({ to: req.body.mobile, code: req.body.token })
      .then((verification_check) => {
        if (verification_check.status !="pending") {
          employerHelpers.doEmpSignup(req.body).then((response) => {
            if (response.status) {
              console.log(response);
              req.session.empLoggedIn = true;
              req.session.emp = response.data;
              res.redirect("/employer");
            } else if (response.nomatch) {
              req.session.nomatch = response.nomatch;
              res.redirect("/employer/emp-signup");
            } 
          });
        }else{
          req.session.nomatch = response.nomatch;
          res.redirect("/employer/emp-signup");
        }
      });
  });
 
  router.get("/emp-logout", (req, res) => {
    req.session.emp = null;
    req.session.empLoggedIn = false;
    res.redirect("/employer/emp-login");
  });

router.get('/dashboard',verifyLogin,async(req,res)=>{
  let employers = await employerHelpers.getEmployerDetails(req.session.emp._id)
  let jobcount = await employerHelpers.getjobcount(req.session.emp._id)
    res.render('employer/dashboard',{employer:true,employers,jobcount})
})

router.get('/emp-profile',verifyLogin,async(req,res)=>{
  let employers = await employerHelpers.getEmployerDetails(req.session.emp._id)
  let skills = await employerHelpers.getSkills(req.session.emp._id)
  let language = await employerHelpers.getLanguage(req.session.emp._id)
    res.render('employer/emp-profile',{employer:true,employers,skills,language})
})

router.get('/emp-edit-profile/:id',async(req,res)=>{
  let employers = await employerHelpers.getEmployerDetails(req.params.id)
  let skills = await employerHelpers.getSkills(req.params.id)
  res.render('employer/emp-edit-profile',{employer:true,formIn:true,employers,skills})
})

router.post('/emp-edit-profile/:id',(req,res)=>{
  employerHelpers.addProfile(req.body,req.params.id).then(()=>{
    console.log(req.files,req.params.id);
    if(req.files){
      let image = req.files.image1;
      employerHelpers.addProfileImage(req.params.id, req.body)
    image.mv("./public/profile-photos/" + req.params.id + ".jpg");
      }
    res.redirect('/employer/emp-profile')
  })
})

router.get('/postjob',verifyLogin,async(req,res)=>{
  let employers = await employerHelpers.getEmployerDetails(req.session.emp._id)
  let category = await employerHelpers.getCategories()
  res.render('employer/postjob',{employer:true,formIn:true,employers,category})
})

router.post('/postjob',verifyLogin,async(req,res)=>{
  req.session.jobDetails = req.body
  let employers = await employerHelpers.getEmployerDetails(req.session.emp._id)
  res.render('employer/plan',{employer:true,formIn:true,employers})
})

 router.post('/ChoosePlan',verifyLogin,async(req,res)=>{
   let planDetails = req.body
   req.session.planDetails = planDetails
   let employers = await employerHelpers.getEmployerDetails(req.session.emp._id)
   let stripePublishableKey = process.env.STRIPE_PUBLISH_KEY
   res.render("employer/checkout",{employer:true,formIn:true,planDetails,stripePublishableKey,employers})
 })

 router.post('/checkout',verifyLogin,async(req,res)=>{
   let employerID = req.session.emp
   let planDetails = req.session.planDetails
   if (req.body.paymentMethod === "razorpay") {
    employerHelpers.generateRazorpay(employerID,planDetails).then((response) => {
         res.json(response);
    })
    } else if (req.body.paymentMethod === "paypal") {
      response.paymentMethod = "paypal"
      response.price = planDetails.price
      res.json(response);
     } else { 
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
            {
                price_data: {
                    currency: "inr",
                    product_data: {
                        name: planDetails.name,
                        images: [],
                    },
                    unit_amount: planDetails.price * 100,
                },
                quantity: 1,
            },
        ],
        mode: 'payment',
        success_url: `http://localhost:5550/employer/success`,
        cancel_url: `http://localhost:5550/employer/failure`,
        
    });console.log(session);
     res.json({ id: session.id })
    }
  });

// router.get("/stripeVerification",(req,res)=>{
//   console.log("sasi dharan");
//   stripe.retrievePaymentIntent('sk_test_51JPhYfSDNOZxdKbLY7t5fAMBRKanw7XWNckuKZNsSw18Rvrwy4OeP8K9LWzKzWlocXU3jvUYdokiZuve4QuDfFeO00O7jRJRjX').then(function(response) {
//     if (response.paymentIntent && response.paymentIntent.status === 'succeeded') {
//       // Handle successful payment here
//       console.log("sssssss");
//     } else {
//       console.log("dddddddd");
//       // Handle unsuccessful, processing, or canceled payments and API errors here
//     }
//   });
// })

  router.post("/verify-payment", (req, res) => {
    let jobDetails = req.session.jobDetails
    let employerID = req.session.emp._id
    let planDetails = req.session.planDetails
    employerHelpers.verifyPayment(req.body,jobDetails,employerID,planDetails).then(() => {  
      employerHelpers.updateOrder(req.body,req.session.emp,planDetails).then(()=>{
        res.json({ status: true });
      })  
      })
      .catch((err) => {
        console.log('erry');
        res.json();
      });
  });

  router.post("/verifyPaypalPayment",(req,res)=>{
    let jobDetails = req.session.jobDetails
    let employerID = req.session.emp._id
    let planDetails = req.session.planDetails
    employerHelpers.verifyPaypalPayment(req.body,jobDetails,employerID,planDetails).then(()=>{
      employerHelpers.updatePaypalOrder(req.body,req.session.emp,planDetails).then(()=>{
      res.json({ status : true})
    })
  })
    .catch((err)=>{
      res.json()
    })
  })

  router.get('/success',(req,res)=>{
    res.render("employer/success")
  })

  router.get('/failure',(req,res)=>{
    res.render("employer/failure")
  })

router.get('/postedjob',verifyLogin,async(req,res)=>{
  let employers = await employerHelpers.getEmployerDetails(req.session.emp._id)
  let jobs = await employerHelpers.getJobs(req.session.emp._id)
  var count=jobs.length;
  res.render('employer/postedjob',{employer:true,employers,jobs, count})
})


router.get('/edit-postedjob/:id',verifyLogin,async(req,res)=>{
  let employers = await employerHelpers.getEmployerDetails(req.session.emp._id)
  employerHelpers.getJobDetails(req.params.id).then((jobs)=>{
    res.render('employer/edit-postedjob',{employer:true,formIn:true,jobs,employers})
  })
})

router.post('/editThePostedjob/:id',(req,res)=>{
  employerHelpers.updatePostedJobs(req.body,req.params.id).then(()=>{
    res.redirect('/employer/postedjob')
  })
})

router.post('/edit-posted',async(req,res)=>{
  let jobId = req.body.job
  let jobs = await employerHelpers.getJobDetails(jobId)
  res.json(jobs)
})

router.get('/delete-postedjob/:id',(req,res)=>{
  employerHelpers.deleteJob(req.params.id).then(()=>{
    res.redirect('/employer/postedjob')
  })
})

router.get('/appliedCandidates/:id',verifyLogin,async(req,res)=>{
  let employers = await employerHelpers.getEmployerDetails(req.session.emp._id)
  req.session.jobId = req.params.id
  employerHelpers.getAppliedCandidates(req.params.id).then((candidates)=>{
    res.render('employer/appliedCandidates',{employer:true,candidates,employers})
  })
})

router.get('/candidateProfile/:id',verifyLogin,async(req,res)=>{
  let employers = await employerHelpers.getEmployerDetails(req.session.emp._id)
  let userProfile = await employerHelpers.getUserprofile(req.params.id)
  res.render('employer/user-profile',{employer:true,formIn:true, userProfile,employers})
})

router.post('/notification',(req,res)=>{
  employerHelpers.sentNotification(req.body).then(()=>{
    employerHelpers.makeAlert(req.body.userId).then(()=>{
      res.redirect(`/employer/appliedCandidates/${req.body.jobId}`)
    })
  })
})

router.get('/message/:id',verifyLogin,async(req,res)=>{
  let employers = {}
  employers._id = req.session.emp._id
  console.log("sasi on fire",employers._id);
 let candidates = {}
 candidates.userId =  req.params.id
  res.render('employer/message',{candidates,employers})
})

router.get('/auth/github',
  passport.authenticate('github'));

  router.get('/auth/github/callback', 
  passport.authenticate('github', { failureRedirect: '/employer/emp-login' }),
  function(req, res) {
    let user = req.user
      req.session.emp = user
      req.session.empLoggedIn = true;
      res.redirect('/employer');
  });


  router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

router.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/employer/emp-login' }),
  function(req, res) {
    
    let user = req.user
    req.session.emp = user
    req.session.empLoggedIn = true;
    res.redirect('/employer');
  });

router.get('/auth/linkedin',
  passport.authenticate('linkedin', { state: 'SOME STATE'  }),
  function(req, res){
    // The request will be redirected to LinkedIn for authentication, so this
    // function will not be called.
  });

router.get('/auth/linkedin/callback', 
passport.authenticate('linkedin', { failureRedirect: '/employer/emp-login'}),
function(req, res) {
  let user = req.user
  req.session.emp = user
  req.session.empLoggedIn = true;
  res.redirect('/employer');
});

router.post("/sociallink",verifyLogin,(req,res)=>{
  let empId = req.session.emp._id
  employerHelpers.insertSocialLink(req.body,empId).then(()=>{
    res.redirect('/employer')
  })
})

router.post('/saveNote',(req,res)=>{
  console.log(req.body);
  employerHelpers.SaveTheNotes(req.body,req.session.emp._id).then(()=>{
    res.redirect('/employer')
  })
})

router.get('/deleteNote/:id',(req,res)=>{
  employerHelpers.deleteNotes(req.params.id).then(()=>{
    res.redirect('/employer')
  })
})

router.get('/machinetest/:id',verifyLogin,async(req,res)=>{
  let userId = req.params.id
  let employers = await employerHelpers.getEmployerDetails(req.session.emp._id)
  res.render('employer/machineTest',{employer:true,employers,userId,formfor:true})
})

router.post('/postMachineTest/:id',verifyLogin,(req,res)=>{
  let userId = req.params.id
  let jobId = req.session.jobId
  let emp = req.session.emp
  employerHelpers.postMachineTest(req.body,userId,emp,jobId).then(()=>{
    res.redirect(`/employer/appliedCandidates/${jobId}`)
  })
})

router.get('/answerkey/:userId/:jobId',verifyLogin,async(req,res)=>{
  let employers = await employerHelpers.getEmployerDetails(req.session.emp._id)
  employerHelpers.getAnswerKeys(req.params.userId,req.params.jobId).then((answerkeys)=>{
    res.render('employer/answerkey',{employer:true,answerkeys,employers})
  })
})

module.exports = router;