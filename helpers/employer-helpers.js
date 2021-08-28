var db = require("../config/connection");
var collection = require("../config/collection");
var objectId = require("mongodb").ObjectID;
var bcrypt = require("bcrypt");
const { response } = require("express");
const {
  ConferenceList,
} = require("twilio/lib/rest/api/v2010/account/conference");
const Razorpay = require("razorpay");
const { resolve } = require("path");
require("dotenv").config();
var instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

module.exports = {
  checkdata: (userData)=>{
    console.log(userData);
    return new Promise(async(resolve,reject)=>{
    let user = await db.get().collection(collection.EMPLOYER_COLLECTION).findOne({email: userData.email})
    let mobile = await db.get().collection(collection.EMPLOYER_COLLECTION).findOne({mobile : userData.full})
    console.log(user,mobile);
    if(user){
        resolve({existing:true})
    }else if(mobile){
        resolve({mobileExist:true})
    }else if (userData.password != userData.password2) {
      resolve({ nomatch: true });
    }else{
      resolve({status:true})
    }
  })
  },
  doEmpSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
     
        let userDetails = {};
        userData.password = await bcrypt.hash(userData.password, 10);
        userDetails.companyname = userData.companyname;
        userDetails.email = userData.email;
        userDetails.mobile = userData.mobile;
        userDetails.password = userData.password;
        userDetails.block = userData.block = false;
        userDetails.facebook = "https://www.facebook.com/";
        userDetails.twitter = "https://www.twitter.com/";
        userDetails.linkedin = "https://www.linkedin.com/";
        userDetails.github = "https://www.github.com/";
        userDetails.instagram = "https://www.instagram.com/";
        db.get()
          .collection(collection.EMPLOYER_COLLECTION)
          .insertOne(userDetails)
          .then((data) => {
            resolve({ data: data.ops[0], status: true });
          });
    });
  },
  doEmpLogin: (userData) => {
    console.log(userData);
    return new Promise(async (resolve, reject) => {
      let loginstatus = false;
      let response = {};
      let user = await db
        .get()
        .collection(collection.EMPLOYER_COLLECTION)
        .findOne({ email: userData.email });
      console.log(user);
      if (user) {
        bcrypt.compare(userData.password, user.password).then((status) => {
          if (status) {
            if (user.block) {
              response.block = true;
              resolve(response);
            } else {
              response.user = user;
              response.status = true;
              resolve(response);
            }
          } else {
            resolve({ status: false });
          }
        });
      } else {
        resolve({ status: false });
      }
    });
  },
  getEmpDetails: (mobile) => {
    return new Promise(async (resolve, reject) => {
      let employer = await db
        .get()
        .collection(collection.EMPLOYER_COLLECTION)
        .findOne({ mobile: mobile });
      resolve(employer);
    });
  },
  getEmployerDetails: (empId) => {
    return new Promise(async (resolve, reject) => {
      let employers = await db
        .get()
        .collection(collection.EMPLOYER_COLLECTION)
        .findOne({ _id: objectId(empId) });
      resolve(employers);
    });
  },
  addProfile: (data, empId) => {
    return new Promise((resolve, reject) => {
      var skills = new Array();
      let skill = data.skills;
      skills = skill.split(",");
      var language = new Array();
      let lang = data.language;
      language = lang.split(",");
      db.get()
        .collection(collection.EMPLOYER_COLLECTION)
        .updateOne(
          { _id: objectId(empId) },
          {
            $set: {
              companyname: data.companyname,
              email: data.email,
              launch_date: data.launch_date,
              discription: data.discription,
              field: data.field,
              mobile: data.full,
              skills: skills,
              language: language,
              location: data.location,
              link1: data.link1,
              link2: data.link2,
              link3: data.link3,
            },
          }
        )
        .then(() => {
          resolve();
        });
    });
  },
  getSkills: (empId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.EMPLOYER_COLLECTION)
        .findOne({ _id: objectId(empId) })
        .then((data) => {
          resolve(data.skills);
        });
    });
  },
  getLanguage: (empId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.EMPLOYER_COLLECTION)
        .findOne({ _id: objectId(empId) })
        .then((data) => {
          resolve(data.language);
        });
    });
  },
  addProfileImage: (empId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.EMPLOYER_COLLECTION)
        .updateOne(
          { _id: objectId(empId) },
          {
            $set: { status: true },
          }
        )
        .then(() => {
          resolve();
        });
    });
  },
  getJobs: (employerId) => {
    return new Promise(async (resolve, reject) => {
      let jobs = await db
        .get()
        .collection(collection.JOB_COLLECTION)
        .aggregate(
          { $match: { empId: objectId(employerId) } },
          {
            $group: { _id: null, empId: "$employerId" },
          }
        )
        .toArray();
      resolve(jobs);
    });
  },
  getJobDetails: (jobId) => {
    return new Promise(async (resolve, reject) => {
      db.get()
        .collection(collection.JOB_COLLECTION)
        .findOne({ _id: objectId(jobId) })
        .then((jobDetails) => {
          resolve(jobDetails);
        });
    });
  },
  updatePostedJobs: (data, jobId) => {
    var skills = new Array();
    let skill = data.skills;
    skills = skill.split(",");
    var language = new Array();
    let lang = data.language;
    language = lang.split(",");
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.JOB_COLLECTION)
        .updateOne(
          { _id: objectId(jobId) },
          {
            $set: {
              jobname: data.jobname,
              discription: data.discription,
              jobtype: data.jobtype,
              category: data.category,
              availability: data.availability,
              experience: data.experience,
              min_salary: parseInt(data.min_salary),
              max_salary: parseInt(data.max_salary),
              location: data.location,
              language: language,
              skills: skills,
            },
          }
        )
        .then(() => {
          resolve();
        });
    });
  },
  deleteJob: (jobId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.JOB_COLLECTION)
        .removeOne({ _id: objectId(jobId) })
        .then(() => {
          resolve();
        });
    });
  },
  getAppliedCandidates: (jobsId) => {
    return new Promise(async (resolve, reject) => {
      let candidates = await db
        .get()
        .collection(collection.JOBS_APPLIED)
        .aggregate(
          { $match: { jobId: objectId(jobsId) } },
          {
            $group: { _id: null, jobId: "$jobsId" },
          }
        )
        .toArray();
      resolve(candidates);
    });
  },
  getUserprofile: (userId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .findOne({ _id: objectId(userId) })
        .then((user) => {
          resolve(user);
        });
    });
  },
  sentNotification: (data) => {
    console.log(data);
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, "0");
    var mm = String(today.getMonth() + 1).padStart(2, "0");
    var yyyy = today.getFullYear();
    today = yyyy + "-" + mm + "-" + dd;
    return new Promise((resolve, reject) => {
      let details = {};
      details.userId = objectId(data.userId);
      details.jobId = objectId(data.jobId);
      details.companyId = objectId(data.companyId);
      details.companyname = data.companyname;
      details.message = data.message;
      details.date = today;
      db.get()
        .collection(collection.NOTIFICATION)
        .insertOne(details)
        .then((response) => {
          resolve(response);
        });
    });
  },
  makeAlert: (userId) => {
    console.log(userId);
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.USER_COLLECTION)
        .updateOne(
          { _id: objectId(userId) },
          {
            $set: { notification: true },
          }
        )
        .then(() => {
          resolve();
        });
    });
  },
  insertSocialLink: (data, empId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.EMPLOYER_COLLECTION)
        .updateOne(
          { _id: objectId(empId) },
          {
            $set: {
              facebook: data.facebook,
              twitter: data.twitter,
              linkedin: data.linkedin,
              github: data.github,
              instagram: data.instagram,
            },
          }
        )
        .then(() => {
          resolve();
        });
    });
  },
  generateRazorpay: (employer, planDetails) => {
    return new Promise((resolve, reject) => {
      let total = planDetails.price;
      let id = employer._id;
      var options = {
        amount: total * 100, // amount in the smallest currency unit
        currency: "INR",
        receipt: "" + id,
      };
      instance.orders.create(options, function (err, order) {
        (order.paymentMethod = "razorpay"),
          (order.user = employer.companyname),
          (order.email = employer.email),
          (order.mobile = employer.mobile);

        if (err) {
          console.log(err);
        } else {
          resolve(order);
        }
      });
    });
  },
  verifyPayment: (details, data, empId, planDetails) => {
    return new Promise((resolve, reject) => {
      const crypto = require("crypto");
      let hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);

      hmac.update(
        details["payment[razorpay_order_id]"] +
          "|" +
          details["payment[razorpay_payment_id]"]
      );
      hmac = hmac.digest("hex");
      if (hmac == details["payment[razorpay_signature]"]) {
        var skills = new Array();
        let skill = data.skills;
        skills = skill.split(",");
        var language = new Array();
        let lang = data.language;
        language = lang.split(",");
        var today = new Date();
        var dd = String(today.getDate()).padStart(2, "0");
        var mm = String(today.getMonth() + 1).padStart(2, "0");
        var yyyy = today.getFullYear();
        today = dd + "-" + mm + "-" + yyyy;

        let jobDetails = {};
        if (planDetails.price == "100") {
          var expiry = new Date();
          var dd = String(expiry.getDate() + 10).padStart(2, "0");
          var mm = String(expiry.getMonth() + 1).padStart(2, "0");
          var yyyy = expiry.getFullYear();
          expiry = yyyy + "-" + mm + "-" + dd;

          jobDetails.empId = objectId(empId);
          jobDetails.jobname = data.jobname;
          jobDetails.discription = data.discription;
          jobDetails.jobtype = data.jobtype;
          jobDetails.category = data.category;
          jobDetails.availability = data.availability;
          jobDetails.experience = data.experience;
          jobDetails.min_salary = parseInt(data.min_salary);
          jobDetails.max_salary = parseInt(data.max_salary);
          jobDetails.location = data.location;
          jobDetails.language = language;
          jobDetails.skills = skills;
          jobDetails.Date = today;
          jobDetails.paymentMethod = "razorpay";
          jobDetails.plan = planDetails.price;
          jobDetails.applicant = parseInt(0);
          jobDetails.appliedCandidates = [];
          jobDetails.status = "active";
          jobDetails.expiry = expiry;
        } else if (planDetails.price == 250) {
          var expiry = new Date();
          var dd = String(expiry.getDate()).padStart(2, "0");
          var mm = String(expiry.getMonth() + 2).padStart(2, "0");
          var yyyy = expiry.getFullYear();
          expiry = yyyy + "-" + mm + "-" + dd;

          jobDetails.empId = objectId(empId);
          jobDetails.jobname = data.jobname;
          jobDetails.discription = data.discription;
          jobDetails.jobtype = data.jobtype;
          jobDetails.category = data.category;
          jobDetails.availability = data.availability;
          jobDetails.experience = data.experience;
          jobDetails.min_salary = parseInt(data.min_salary);
          jobDetails.max_salary = parseInt(data.max_salary);
          jobDetails.location = data.location;
          jobDetails.language = language;
          jobDetails.skills = skills;
          jobDetails.Date = today;
          jobDetails.paymentMethod = "razorpay";
          jobDetails.plan = planDetails.price;
          jobDetails.applicant = parseInt(0);
          jobDetails.appliedCandidates = [];
          jobDetails.status = "active";
          jobDetails.expiry = expiry;
        } else {
          var expiry = new Date();
          var dd = String(expiry.getDate()).padStart(2, "0");
          var mm = String(expiry.getMonth() + 3).padStart(2, "0");
          var yyyy = expiry.getFullYear();
          expiry = yyyy + "-" + mm + "-" + dd;

          jobDetails.empId = objectId(empId);
          jobDetails.jobname = data.jobname;
          jobDetails.discription = data.discription;
          jobDetails.jobtype = data.jobtype;
          jobDetails.category = data.category;
          jobDetails.availability = data.availability;
          jobDetails.experience = data.experience;
          jobDetails.min_salary = parseInt(data.min_salary);
          jobDetails.max_salary = parseInt(data.max_salary);
          jobDetails.location = data.location;
          jobDetails.language = language;
          jobDetails.skills = skills;
          jobDetails.Date = today;
          jobDetails.paymentMethod = "razorpay";
          jobDetails.plan = planDetails.price;
          jobDetails.applicant = parseInt(0);
          jobDetails.appliedCandidates = [];
          jobDetails.status = "active";
          jobDetails.expiry = expiry;
        }
        db.get()
          .collection(collection.JOB_COLLECTION)
          .insertOne(jobDetails)
          .then(() => {
            db.get()
              .collection(collection.CATEGORY_COLLECTION)
              .updateOne(
                { category: data.category },
                {
                  $inc: { job: 1 },
                }
              )
              .then(() => {
                resolve();
              });
          });
      } else {
        reject();
      }
    });
  },
  verifyPaypalPayment: (details, data, empId, planDetails) => {
    return new Promise((resolve, reject) => {
      if (details["details[status]"] == "COMPLETED") {
        var skills = new Array();
        let skill = data.skills;
        skills = skill.split(",");
        var language = new Array();
        let lang = data.language;
        language = lang.split(",");
        var today = new Date();
        var dd = String(today.getDate()).padStart(2, "0");
        var mm = String(today.getMonth() + 1).padStart(2, "0");
        var yyyy = today.getFullYear();
        today = dd + "-" + mm + "-" + yyyy;

        let jobDetails = {};
        if (planDetails.price == "100") {
          var expiry = new Date();
          var dd = String(expiry.getDate() + 10).padStart(2, "0");
          var mm = String(expiry.getMonth() + 1).padStart(2, "0");
          var yyyy = expiry.getFullYear();
          expiry = dd + "-" + mm + "-" + yyyy;

          jobDetails.empId = objectId(empId);
          jobDetails.jobname = data.jobname;
          jobDetails.discription = data.discription;
          jobDetails.jobtype = data.jobtype;
          jobDetails.category = data.category;
          jobDetails.availability = data.availability;
          jobDetails.experience = data.experience;
          jobDetails.min_salary = parseInt(data.min_salary);
          jobDetails.max_salary = parseInt(data.max_salary);
          jobDetails.location = data.location;
          jobDetails.language = language;
          jobDetails.skills = skills;
          jobDetails.Date = today;
          jobDetails.paymentMethod = "paypal";
          jobDetails.plan = planDetails.price;
          jobDetails.applicant = parseInt(0);
          jobDetails.appliedCandidates = [];
          jobDetails.status = "active";
          jobDetails.expiry = expiry;
        } else if (planDetails.price == 250) {
          var expiry = new Date();
          var dd = String(expiry.getDate()).padStart(2, "0");
          var mm = String(expiry.getMonth() + 2).padStart(2, "0");
          var yyyy = expiry.getFullYear();
          expiry = dd + "-" + mm + "-" + yyyy;

          jobDetails.empId = objectId(empId);
          jobDetails.jobname = data.jobname;
          jobDetails.discription = data.discription;
          jobDetails.jobtype = data.jobtype;
          jobDetails.category = data.category;
          jobDetails.availability = data.availability;
          jobDetails.experience = data.experience;
          jobDetails.min_salary = parseInt(data.min_salary);
          jobDetails.max_salary = parseInt(data.max_salary);
          jobDetails.location = data.location;
          jobDetails.language = language;
          jobDetails.skills = skills;
          jobDetails.Date = today;
          jobDetails.paymentMethod = "paypal";
          jobDetails.plan = planDetails.price;
          jobDetails.applicant = parseInt(0);
          jobDetails.appliedCandidates = [];
          jobDetails.status = "active";
          jobDetails.expiry = expiry;
        } else {
          var expiry = new Date();
          var dd = String(expiry.getDate()).padStart(2, "0");
          var mm = String(expiry.getMonth() + 3).padStart(2, "0");
          var yyyy = expiry.getFullYear();
          expiry = dd + "-" + mm + "-" + yyyy;

          jobDetails.empId = objectId(empId);
          jobDetails.jobname = data.jobname;
          jobDetails.discription = data.discription;
          jobDetails.jobtype = data.jobtype;
          jobDetails.category = data.category;
          jobDetails.availability = data.availability;
          jobDetails.experience = data.experience;
          jobDetails.min_salary = parseInt(data.min_salary);
          jobDetails.max_salary = parseInt(data.max_salary);
          jobDetails.location = data.location;
          jobDetails.language = language;
          jobDetails.skills = skills;
          jobDetails.Date = today;
          jobDetails.paymentMethod = "paypal";
          jobDetails.plan = planDetails.price;
          jobDetails.applicant = parseInt(0);
          jobDetails.appliedCandidates = [];
          jobDetails.status = "active";
          jobDetails.expiry = expiry;
        }
        db.get()
          .collection(collection.JOB_COLLECTION)
          .insertOne(jobDetails)
          .then(() => {
            db.get()
              .collection(collection.CATEGORY_COLLECTION)
              .updateOne(
                { category: data.category },
                {
                  $inc: { job: 1 },
                }
              )
              .then(() => {
                resolve();
              });
          });
      } else {
        reject();
      }
    });
  },
  stripePayment: (planDetails) => {
    return new Promise(async (resolve, reject) => {
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
        mode: "payment",
        success_url: `http://localhost:5550/employer/success`,
        cancel_url: `http://localhhost:5550/employer/failure`,
      });
      resolve(session);
    });
  },
  getjobcount: (empId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.JOB_COLLECTION)
        .aggregate(
          { $match: { empId: objectId(empId) } },
          {
            $group: { _id: null, jobs: "$jobs" },
          }
        )
        .toArray()
        .then((jobs) => {
          resolve(jobs.length);
        });
    });
  },
  SaveTheNotes: (note, empId) => {
    return new Promise((resolve, reject) => {
      let Notes = {};
      Notes.discription = note.discription;
      Notes.priorty = note.priorty;
      Notes.empId = objectId(empId);
      db.get()
        .collection(collection.NOTES_COLLECTION)
        .insertOne(Notes)
        .then(() => {
          resolve();
        });
    });
  },
  getNotes: (empId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.NOTES_COLLECTION)
        .aggregate(
          { $match: { empId: objectId(empId) } },
          {
            $group: { _id: null, notes: "$notes" },
          }
        )
        .toArray()
        .then((notes) => {
          resolve(notes);
        });
    });
  },
  deleteNotes: (noteId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.NOTES_COLLECTION)
        .removeOne({ _id: objectId(noteId) })
        .then(() => {
          resolve();
        });
    });
  },
  getActiveCount: (empId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.JOB_COLLECTION)
        .aggregate(
          { $match: { empId: objectId(empId) } },
          {
            $match: { status: "active" },
          },
          {
            $group: { _id: null, jobs: "$jobs" },
          }
        )
        .toArray()
        .then((jobs) => {
          resolve(jobs.length);
        });
    });
  },
  getExpiredCount: (empId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.JOB_COLLECTION)
        .aggregate(
          { $match: { empId: objectId(empId) } },
          {
            $match: { status: "expired" },
          },
          {
            $group: { _id: null, jobs: "$jobs" },
          }
        )
        .toArray()
        .then((jobs) => {
          resolve(jobs.length);
        });
    });
  },
  updateOrder: (data, employer, plan) => {
    return new Promise((resolve, reject) => {
      let order = {};
      order.employer = employer.companyname;
      order.paymentMethod = data["order[paymentMethod]"];
      order.price = plan.price;
      order.validity = plan.type;
      order.status = "paid";
      order.Date = new Date();

      db.get()
        .collection(collection.ORDER_COLLECTION)
        .insertOne(order)
        .then(() => {
          resolve();
        });
    });
  },
  updatePaypalOrder: (data, employer, plan) => {
    return new Promise((resolve, reject) => {
      let order = {};
      order.employer = employer.companyname;
      order.paymentMethod = data["response[paymentMethod]"];
      order.price = plan.price;
      order.validity = plan.type;
      order.status = "paid";
      order.Date = new Date();

      db.get()
        .collection(collection.ORDER_COLLECTION)
        .insertOne(order)
        .then(() => {
          resolve();
        });
    });
  },
  getCategories: () => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CATEGORY_COLLECTION)
        .find()
        .toArray()
        .then((category) => {
          resolve(category);
        });
    });
  },
  postMachineTest: (data, userId, emp, jobId) => {
    console.log(data);
    return new Promise((resolve, reject) => {
      let module = {};
      module.hour = parseInt(data.hour);
      module.minute = parseInt(data.minutes);
      module.question = data.question;
      module.userId = objectId(userId);
      module.empId = objectId(emp._id);
      module.jobId = objectId(jobId);
      module.companyname = emp.companyname;
      module.status = true;
      db.get()
        .collection(collection.MACHINE_TEST)
        .insertOne(module)
        .then(() => {
          resolve();
        });
    });
  },
  getAnswerKeys: (userId, jobId) => {
    console.log(userId, jobId);
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.ANSWER_KEYS)
        .aggregate(
          { $match: { userId: objectId(userId) } },
          {
            $match: { jobId: objectId(jobId) },
          },
          {
            $group: { _id: null, answer: "$answer" },
          }
        )
        .toArray()
        .then((answers) => {
          console.log(answers);
          resolve(answers);
        });
    });
  },
};
