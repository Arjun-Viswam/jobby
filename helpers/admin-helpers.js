var db = require('../config/connection')
var collection=require('../config/collection')
var objectId=require('mongodb').ObjectID
var bcrypt=require('bcrypt')


module.exports = {

    doLogin: (data)=>{
        return new Promise(async(resolve,reject)=>{
            console.log(data);
            let email = "arjunviswam82@gmail.com"
            let password = "$2b$10$xY17PzqvSJK/eTSArrjvIuKyo3mN24GD4jjMglAxFj5IQ2BRKy.16"
            let loginstatus = false
            let response = {}
            if (email == data.email) {
                console.log("ddddddddd");
                bcrypt.compare(data.password,password).then((status) => {
                    console.log(status);
                    if (status) {
                            response.admin = data
                            response.status = true
                            resolve(response)
                    } else {
                        resolve({ status: false })
                    }
                })
            } else {
                resolve({ status: false })
            }
        })
    },
    getAllUsers : ()=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).find().toArray().then((users)=>{
                resolve(users)
            })
        })
    },
    getAllCompany : ()=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.EMPLOYER_COLLECTION).find().toArray().then((companies)=>{
                resolve(companies)
            })
        })
    },
    blockCompany : (empId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.EMPLOYER_COLLECTION).updateOne({ _id : objectId(empId)},
            {
                $set :{ block : true}
            }).then(()=>{
                resolve()
            })
        })
    },
    unblockCompany : (empId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.EMPLOYER_COLLECTION).updateOne({ _id : objectId(empId)},
            {
                $set :{ block : false}
            }).then(()=>{
                resolve()
            })
        })
    },
    blockUser : (userId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id : objectId(userId)},
            {
                $set :{ block : true}
            }).then(()=>{
                resolve()
            })
        })
    },
    unblockUser : (userId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id : objectId(userId)},
            {
                $set :{ block : false}
            }).then(()=>{
                resolve()
            })
        })
    },
    getReports : ()=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION).find().toArray().then((report)=>{
                resolve(report)
            })
        })
    },
    getCategories : ()=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CATEGORY_COLLECTION).find().toArray().then((category)=>{
                resolve(category)
            })
        })
    },
    getEmployees: ()=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).find().toArray().then((users)=>{
                resolve(users.length)
            })
        })
    },
    getEmployers: ()=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.EMPLOYER_COLLECTION).find().toArray().then((employers)=>{
                resolve(employers.length)
            })
        })
    },
    getJobCount: ()=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.JOB_COLLECTION).find().toArray().then((jobs)=>{
                resolve(jobs.length)
            })
        })
    },
    getActiveJobs : ()=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.JOB_COLLECTION).aggregate({ $match : {status : "active"}},
            {
                $group : { _id : null, job : "$job"}
            }).toArray().then((jobs)=>{
                resolve(jobs.length)
            })
        })
    },
    getExpiredJobs : ()=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.JOB_COLLECTION).aggregate({ $match : {status : "expired"}},
            {
                $group : { _id : null, job : "$job"}
            }).toArray().then((jobs)=>{
                resolve(jobs.length)
            })
        })
    },
    getApplied : ()=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.JOBS_APPLIED).find().toArray().then((jobs)=>{
                resolve(jobs.length)
            })
        })
    },
    postCategories : (data)=>{
        return new Promise((resolve,reject)=>{
            let category = {}
            category.category = data.category
            category.job = parseInt(0)
            db.get().collection(collection.CATEGORY_COLLECTION).insertOne(category).then(()=>{
                resolve()
            })
        })
    },
    getPlanA : ()=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION).aggregate({ $match : {price : "100" }},
            {
                $group : {_id : null, plan : "$plan"}
            }).toArray().then((planA)=>{
                resolve(planA.length)
            })
        })
    },
    getPlanB : ()=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION).aggregate({ $match : {price : "250" }},
            {
                $group : {_id : null, plan : "$plan"}
            }).toArray().then((planB)=>{
                resolve(planB.length)
            })
        })
    },
    getPlanC : ()=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION).aggregate({ $match : {price : "500" }},
            {
                $group : {_id : null, plan : "$plan"}
            }).toArray().then((planC)=>{
                resolve(planC.length)
            })
        })
    },
    getReport:(date)=>{
        console.log(date);
        return new Promise(async(resolve,reject)=>{
            console.log(new Date(date.fromDate+ "T00:00:00.000Z"),new Date(date.toDate+ "T23:59:00.000Z"));
            let report = await db.get().collection(collection.ORDER_COLLECTION).find({Date:{$gte:new Date(date.fromDate+ "T00:00:00.000Z"),$lte:new Date(date.toDate+ "T23:59:00.000Z")}}).toArray()
            console.log(report);
           resolve(report)
        })
    }, 
}