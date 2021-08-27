const { response } = require("express");
var express = require("express");
var router = express.Router();
var adminHelpers = require("../helpers/admin-helpers");
var userHelpers = require("../helpers/user-helpers");
var employerHelpers = require("../helpers/employer-helpers");

const verifyLogin = (req, res, next) => {
  if (req.session.adminloggedIn) {
    next();
  } else {
    res.redirect("/admin");
  }
};

/* GET users listing. */

router.get("/",async(req, res) => {
  let admin = req.session.adminloggedIn;
  if (admin) {
    let employees = await adminHelpers.getEmployees()
    let employers = await adminHelpers.getEmployers()
    let jobCount = await adminHelpers.getJobCount()
    let activeJobs = await adminHelpers.getActiveJobs()
    let expiredJobs = await adminHelpers.getExpiredJobs()
    let jobChart = [jobCount,activeJobs,expiredJobs]
    let applied = await adminHelpers.getApplied()
    let pieChart = [jobCount,applied]
    let planA = await adminHelpers.getPlanA()
    let planB = await adminHelpers.getPlanB()
    let planC = await adminHelpers.getPlanC()
    let plan = [planA,planB,planC]
    console.log(jobChart);
  res.render("admin/adminDashboard",{admin:true,employees,employers,jobCount,jobChart,pieChart,plan})
  } else {
    let adminLoginErr = req.session.adminLoginErr
    res.render("admin/adminlogin",{log:true,adminLoginErr});
    req.session.loginErr = false;
  }
});


router.post("/", (req, res) => {
  adminHelpers.doLogin(req.body).then((response) => {
    console.log(response);
    if (response.status) {
      req.session.adminloggedIn = true;
      req.session.admin = response.admin;
      res.redirect("/admin");
    } else {
      req.session.adminLoginErr = "Invalid username or password";
      res.redirect("/admin");
    }
  });
});

router.get("/adminlogout", (req, res) => {
  req.session.adminloggedIn = false;
  res.redirect("/admin");
});

router.get("/usermanager",verifyLogin,async(req,res)=>{
  let users = await adminHelpers.getAllUsers()
  res.render('admin/usermanager',{admin:true,users})
})


router.get("/companymanager",verifyLogin,async(req,res)=>{
  let companies = await adminHelpers.getAllCompany()
  res.render('admin/companymanager',{admin:true,companies})
})

router.get("/block-company/:id",(req,res)=>{
  adminHelpers.blockCompany(req.params.id).then(()=>{
    res.redirect("/admin/companymanager")
  })
})

router.get("/unblock-company/:id",(req,res)=>{
  adminHelpers.unblockCompany(req.params.id).then(()=>{
    res.redirect("/admin/companymanager")
  })
})

router.get("/block-user/:id",(req,res)=>{
  adminHelpers.blockUser(req.params.id).then(()=>{
    res.redirect("/admin/usermanager")
  })
})

router.get("/unblock-user/:id",(req,res)=>{
  adminHelpers.unblockUser(req.params.id).then(()=>{
    res.redirect("/admin/usermanager")
  })
})

router.get("/report",verifyLogin,(req,res)=>{
  adminHelpers.getReports().then((report)=>{
    res.render("admin/report",{admin:true,report,minJS:true})
  })
})

router.get('/categories',verifyLogin,(req,res)=>{
  adminHelpers.getCategories().then((category)=>{
    res.render('admin/category',{admin:true,category})
  })
})

router.post('/add-category',(req,res)=>{
  adminHelpers.postCategories(req.body).then(()=>{
    res.json({response})
  })
})

router.post("/orderSales",(req,res)=>{
  adminHelpers.getReport(req.body).then((reports)=>{
    res.render('admin/orderReports',{admin:true,reports,minJS:true})
  })
})


module.exports = router;
