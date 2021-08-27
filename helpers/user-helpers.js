var db = require('../config/connection')
var collection = require('../config/collection')
var objectId = require('mongodb').ObjectID
const bcrypt = require('bcrypt')
const { response } = require('../app')
const { JobInstance } = require('twilio/lib/rest/bulkexports/v1/export/job')



module.exports = {
    doSignup: (userData) => {
        return new Promise(async (resolve, reject) => {
            if(userData.password == userData.password2){
                let userDetails = {}
                userData.password = await bcrypt.hash(userData.password, 10)
                userDetails.firstname = userData.firstname
                userDetails.lastname = userData.lastname
                userDetails.email = userData.email
                userDetails.mobile = userData.mobile
                userDetails.password = userData.password
                userDetails.block = userData.block = false
                userDetails.facebook = "https://www.facebook.com/"
                userDetails.twitter = "https://www.twitter.com/"
                userDetails.linkedin = "https://www.linkedin.com/"
                userDetails.github = "https://www.github.com/"
                userDetails.instagram = "https://www.instagram.com/"
                db.get().collection(collection.USER_COLLECTION).insertOne(userDetails).then((data) => {
                    resolve({data:data.ops[0],status:true})
                })
            }else{
                resolve({nomatch:true})
            }
        })
    },
    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let loginstatus = false
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
            if (user) {
                bcrypt.compare(userData.password, user.password).then((status) => {
                    if (status) {
                        if (user.block) {
                            response.block = true
                            resolve(response)
                        } else {
                            response.user = user
                            response.status = true
                            resolve(response)
                        }
                    } else {
                        resolve({ status: false })
                    }
                })
            } else {
                resolve({ status: false })
            }
        })
    },
    getUserDetails: (mobile) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ mobile: mobile })
            resolve(user)
        })
    },
    getUserData: (userId) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id : objectId(userId) })
            resolve(user)
        })
    },  
    updateProfile:(data,userId)=>{
        return new Promise((resolve,reject)=>{ 
            var skills = new Array()   
            let skill = data.skills
            skills = skill.split(",")
            var language = new Array()          
            let lang = data.language 
            language = lang.split(",")    
            db.get().collection(collection.USER_COLLECTION).updateOne({_id : objectId(userId)},
            {
                $set : {
                    firstname : data.firstname,
                    lastname : data.lastname,
                    email : data.email,
                    birthdate : data.birthdate,
                    discription : data.discription,
                    tagline : data.tagline,
                    mobile : data.full,
                    skills : skills,
                    availability : data.availability,
                    experience : data.experience,
                    language : language,
                    location : data.location,
                    link1 : data.link1,
                    link2 : data.link2,
                    link3 : data.link3
                }
            }).then(()=>{
                resolve()
            })
        })
    },
    addProfileImage:(userId)=>{
        return new Promise((resolve,reject)=>{   
            db.get().collection(collection.USER_COLLECTION).updateOne({_id : objectId(userId)},
            {
                $set : {status:true}
                    
            }).then(()=>{
                resolve()
            })
        })
    },
    getSkills : (userId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).findOne({_id : objectId(userId)}).then((user)=>{
                resolve(user.skills)
            })
        })
    },
    getLanguage : (userId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).findOne({_id : objectId(userId)}).then((user)=>{
                resolve(user.language)
            })
        })
    },
    getAlljobs : ()=>{
        return new Promise(async(resolve,reject)=>{
          let jobs = await db.get().collection(collection.JOB_COLLECTION).find({ status : "active"}).toArray()
                for(var i=0; i<jobs.length;i++){
                    let today = new Date()
                    if(today > new Date(jobs[i].expiry)){
                        db.get().collection(collection.JOB_COLLECTION).updateOne({_id : objectId(jobs[i]._id)},
                        {
                            $set : {status: "expired"}
                        }).then(()=>{ 
                            db.get().collection(collection.JOB_COLLECTION).find({ status : "active"}).toArray().then((job)=>{
                                 resolve(job)
                            })
                        })
                    }else{
                        db.get().collection(collection.JOB_COLLECTION).find({ status : "active"}).toArray().then((job)=>{
                             resolve(job)
                        })
                    }
                }
            })
    },
    getAllCompanies : ()=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.EMPLOYER_COLLECTION).find().toArray().then((companies)=>{
                resolve(companies)
            })
        })
    },
    getNumberOfJobs : (companyId)=>{
        return new Promise(async(resolve,reject)=>{
           let jobs = await db.get().collection(collection.JOB_COLLECTION).aggregate({ $match : {empId : companyId}}).toArray()
                resolve(jobs.length)
        })
    },
    getCompanyDetails : (companyId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.EMPLOYER_COLLECTION).findOne({ _id : objectId(companyId)}).then((company)=>{
                resolve(company)
            })
        })
    },
    getTheJobs : (companyId)=>{
        console.log(companyId);
        return new Promise(async(resolve,reject)=>{
            let jobs = await db.get().collection(collection.JOB_COLLECTION).aggregate({ $match : {empId : objectId(companyId)}},
                {
                    $match: { status : "active"}
                },
                {
                    $group:{ _id : null,job : "$job"}
                }).toArray()
                console.log(jobs);
                 resolve(jobs)
         })
    },
    getSingleJob : (jobId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.JOB_COLLECTION).findOne({ _id : objectId(jobId) }).then((data)=>{
                resolve(data)
            })
        })
    },
    applyjob : (data)=>{
        let userApplied = objectId(data.userId)
        return new Promise((resolve,reject)=>{
        var skills = new Array()   
        let skill = data.skills
        skills = skill.split(",")
        var language = new Array()          
        let lang = data.language 
        language = lang.split(",") 
       
            let jobsapplied = {}
             jobsapplied.jobId = objectId(data.jobId) 
             jobsapplied.userId = objectId(data.userId) 
             jobsapplied.firstname = data.firstname
             jobsapplied.lastname = data.lastname
             jobsapplied.address = data.address
             jobsapplied.street = data.street
             jobsapplied.district = data.district
             jobsapplied.postalcode = data.postalcode
             jobsapplied.mobile = data.mobile
             jobsapplied.email = data.email
             jobsapplied.qualification = data.qualification
             jobsapplied.gender = data.gender
             jobsapplied.nationality = data.nationality
             jobsapplied.experience = data.experience
             jobsapplied.language = language
             jobsapplied.skills = skills
             jobsapplied.applied = objectId(data.userId)+objectId(data.jobId)

             db.get().collection(collection.JOBS_APPLIED).insertOne(jobsapplied).then(()=>{
                        db.get().collection(collection.JOB_COLLECTION).updateOne({ _id : objectId(data.jobId)},
                            {
                                $inc : {'applicant': 1}
                            }).then(()=>{
                                db.get().collection(collection.JOB_COLLECTION).updateOne({ _id : objectId(data.jobId)},
                                {
                                    $push : { appliedCandidates : userApplied} 
                                }).then(()=>{
                                    resolve()
                                })
                            }) 
                })               
             })
    },
    getNotifications : (Id)=>{
        return new Promise(async(resolve,reject)=>{
            let notification = await db.get().collection(collection.NOTIFICATION).aggregate({ $match : {userId : objectId(Id)}},
                {
                    $group: {
                        _id:null,
                        userId: "$Id",
                    }
                }).toArray()
            console.log(notification);
            resolve(notification)
        })
    },
    checkNotification : (userId)=>{
        return new Promise(async(resolve,reject)=>{
          let user = await db.get().collection(collection.USER_COLLECTION).findOne({_id : objectId(userId)})
          if(user.notification){
              resolve({status:true})
           }
        })
    },
    insertUserSocialLink : (data,userId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id : objectId(userId)},
            {
                $set : {
                     facebook : data.facebook,
                     twitter : data.twitter,
                     linkedin : data.linkedin,
                     github : data.github,
                     instagram : data.instagram
                }
            }).then(()=>{
                resolve()
            })
        })
    },
    saveJob : (jobId,userId)=>{
        return new Promise(async(resolve,reject)=>{
            let saved = await db.get().collection(collection.SAVED_COLLECTION).findOne({saved : jobId+userId})
            if(saved){
                resolve()
            }else{
           let job = await db.get().collection(collection.JOB_COLLECTION).findOne({_id : objectId(jobId)})
           let savedjob = {}
           savedjob.empId = job.empId,
           savedjob.jobId = objectId(jobId),
           savedjob.userId = objectId(userId)
           savedjob.jobname = job.jobname,
           savedjob.availability = job.availability          
           savedjob.min_salary = job.min_salary
           savedjob.max_salary =  job.max_salary
           savedjob.location =  job.location
           savedjob.Date = job.Date
           savedjob.saved = jobId+userId
           db.get().collection(collection.SAVED_COLLECTION).insertOne(savedjob).then(()=>{
               resolve()
           })
        }
     })
    
    },
    getSavedJobs : (usersId)=>{
        return new Promise(async(resolve,reject)=>{
           let savedjob = await db.get().collection(collection.SAVED_COLLECTION).aggregate({$match : {userId : objectId(usersId)}},
            {
                $group:{ _id : null,savedjob : "$savedjob"}
            }).toArray()
            resolve(savedjob)
        })
    },
    saveCompany : (empId,userId)=>{
        return new Promise(async(resolve,reject)=>{
            let saved = await db.get().collection(collection.SAVE_COMPANY).findOne({saved : empId+userId})
            if(saved){
                resolve()
            }else{
           let employer = await db.get().collection(collection.EMPLOYER_COLLECTION).findOne({_id : objectId(empId)})
           let savedcompany = {}
           savedcompany.empId = objectId(empId),
           savedcompany.userId = objectId(userId)
           savedcompany.companyname = employer.companyname,
           savedcompany.launch_date = employer.launch_date
           savedcompany.location =  employer.location
           savedcompany.saved = empId+userId
           db.get().collection(collection.SAVE_COMPANY).insertOne(savedcompany).then(()=>{
               resolve()
           })
        }
        })
    },
    getSavedCompanies : (usersId)=>{
        return new Promise(async(resolve,reject)=>{
           let savedcompany = await db.get().collection(collection.SAVE_COMPANY).aggregate({$match : {userId : objectId(usersId)}},
            {
                $group:{ _id : null,savedcompany : "$savedcompany"}
            }).toArray()
            resolve(savedcompany)
        })
    },
    deleteSavedCompany : (Id)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.SAVE_COMPANY).removeOne({_id : objectId(Id)}).then(()=>{
                resolve()
            })
        })
    },
    deleteSavedJob : (Id)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.SAVED_COLLECTION).removeOne({_id : objectId(Id)}).then(()=>{
                resolve()
            })
        })
    },
    userSearch : (key1,key2,key3)=>{
        return new Promise(async(resolve,reject)=>{
            db.get().collection(collection.JOB_COLLECTION).createIndex({ jobtype : "text", availability : "text", location : "text"},{ language_override: "dummy" }).then(()=>{
           db.get().collection(collection.JOB_COLLECTION).find({"$text":{$search:"\""+key1+"\"\""+key2+"\"\""+key3+"\""}}).toArray().then((search)=>{
           resolve(search);
        })
        })
        })
    },
    appliedJobs : (userId)=>{
        return new Promise(async(resolve,reject)=>{
            let appliedjobs = await db.get().collection(collection.JOBS_APPLIED).aggregate([{$match : {userId : objectId(userId)}},
            {
                $project:{_id:null,jobId : "$jobId"}
            },
            {
                $lookup: {
                    from: collection.JOB_COLLECTION,
                    localField: 'jobId',
                    foreignField: '_id',
                    as: 'jobs'
                }
            },
            {
                $unwind: "$jobs"
            }
        ]).toArray()
            resolve(appliedjobs)
        })
    },
    getAllThecount : ()=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.JOB_COLLECTION).find().toArray().then((jobs)=>{
                db.get().collection(collection.USER_COLLECTION).find().toArray().then((users)=>{
                    db.get().collection(collection.EMPLOYER_COLLECTION).find().toArray().then((employers)=>{
                        let counts = {}
                        counts.jobslen = jobs.length
                        counts.userslen = users.length
                        counts.employerslen = employers.length
                        console.log(counts);
                        resolve(counts)
                    })
                })
            })
        })
    },
    getAllCategory : ()=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CATEGORY_COLLECTION).aggregate([{ $sample :{size :12}}]).toArray().then((category)=>{
                resolve(category)
            })
        })
    },
    getCategoryJobs : (Category)=>{
        console.log(Category);
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.JOB_COLLECTION).aggregate({ $match : {category : Category}},
                {
                    $group : {_id : null, category : "$category"}
                }).toArray().then((jobs)=>{
                    console.log(jobs);
                    resolve(jobs)
                })
        })
    },
    getMachineTest : (userId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.MACHINE_TEST).aggregate({$match: {userId : objectId(userId)}},
            {
                $match : {status : true}
            },
            {
                $group : {_id : null, test : "$test"}
            }).toArray().then((tests)=>{
                resolve(tests)
            })
        })
    },
    getSingleMachineTest : (testId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.MACHINE_TEST).findOne({_id : objectId(testId)}).then((test)=>{
                resolve(test)
            })
        })
    },
    changeStatusMT : (testId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.MACHINE_TEST).updateOne({_id : objectId(testId)},
            {
                $set : { status:false }
            }).then(()=>{
                resolve({status:true})
            })
        })
            
    },
    saveAnswers : (data,userId)=>{
        return new Promise((resolve,reject)=>{
            let module = {}
            module.userId = objectId(userId)
            module.jobId = objectId(data.jobId) 
            module.question = data.question
            db.get().collection(collection.ANSWER_KEYS).insertOne(module).then(()=>{
                resolve()
            })
        })
    }
}
