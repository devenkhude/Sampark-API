const config = require('../config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../_helpers/db');
const commonmethods = require('../_helpers/commonmethods');
const get_current_user = commonmethods.get_current_user;
const uploadToS3 = commonmethods.uploadToS3;
const Kit = db.Kit;
const User = db.User;

module.exports = {
    getAll,
    getById,
    getAllKits,
    create,
    update,
    edit,
    delete: _delete
};

async function getAllKits(user, departmentname, subjectname) {
    var query = {};
    var queryCat = {};
    var kitids = [];
    if (departmentname !== "") {
      query['department'] = departmentname;
    }
    if (subjectname !== "") {
      query['subject'] = subjectname;
    }
    
    var curUser = "";
    if (user !== "") {
      curUser = await User.find({"_id":user});
      if (curUser.length == 1) {
        curUser = curUser[0];
        curUserGroup = curUser.usertype;
        curUserState = curUser.state;
        //query["user_groups"] = curUserGroup;
        //query["states"] = curUserState;
      }
    }
    
    kits = await Kit.find(query).populate('subject','name').populate('department','name').select('id name pdf').sort({sort_order: 1});
    kitList = [];
    
    var fs = require('fs');
    for(var i = 0; i < kits.length;i++){
      
      kit = {};
      
      kit['id'] = kits[i]['id'];
      kit['name'] = kits[i]['name'];
      kit['subject'] = kits[i]['subject'];
      kit['department'] = kits[i]['department'];
      kit['pdf'] = config.repositoryHost+kits[i]['pdf'];    
      
      kitList.push(kit);
    }
    return kitList;
    //return await Kit.find(query).populate('subject','name').populate('department','name').select('-hash');
}

async function getAll() {
    //limit(6).
    //kits = await Kit.find(query).populate('subject','name').populate('department','name').select('-hash');
    kits = await Kit.find().populate('subject','name').populate('department','name').sort('createdDate desc');
    kitList = [];
    for(var i = 0; i < kits.length;i++){
      
      kit = {};
      kit['id'] = kits[i]['id'];    
      kit['name'] = kits[i]['name'];    
      kit['department'] = kits[i]['department'];    
      kit['subject'] = kits[i]['subject'];    
      kit['pdf'] = config.repositoryHost+kits[i]['pdf'];    
            
      kitList.push(kit);
    }
    return kitList;
    //return await Kit.find(query).populate('subject','name').populate('department','name').select('-hash');
}


function randomno(length) {
    var result           = '';
    var characters       = '0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
}

async function getById(id, user) {
    kit = await Kit.findById(id).select('-hash');
    kitdetail = {}; 
    kitdetail['id'] = kit['id'];
    kitdetail['name'] = kit['name'];  
    kitdetail['pdfname'] = kit['pdfname'];  
    kitdetail['pdf'] = config.repositoryHost+kit['pdf'];      
    return kitdetail;
}

async function create(req) {
    let current_user = get_current_user(req);
    let updatedAt = new Date();
    // validate
    let kitParam = req.body
    
    kitParam.createdBy = current_user;
    kitParam.updatedBy = current_user;
    let kitDetail = new Kit(kitParam);
    kitDetail.pdf = "";
    try {

      if (await kitDetail.save()) {
        if (!req.files || Object.keys(req.files).length === 0) {
          throw "No File Uploaded"
        }
        
        let fileKeys = Object.keys(req.files);
        let kitimages = [];
        let promises = [];
        kitDetail.images = kitimages;
              
        for (const item of fileKeys) {
          p = new Promise((resolve, reject) => {
                  if (item == "pdf") {
                    let pdf = req.files[item];
                    uploadToS3(pdf, "kitpdfs").then(response => {
                      kitDetail.pdf = response.Key;
                      resolve(" UPLODAED R : "+item)
                    })
                  } else {
                    let image = req.files[item];
                    uploadToS3(image, "kitimages"+kitDetail.id).then(response => {
                      kitimages.push(response.Key)
                      resolve(" UPLODAED R : "+item)
                    })
                  }
              });
          promises.push(p)
        }
        try {
          await Promise.all(promises)
          kitDetail.images = kitimages;
          kitDetail.save();
        }
        catch (err) {
          
        }
      }
    } catch (e) {
      throw e;
    }
    return {success: true} 
}

async function edit(id) {
    kit = await Kit.findById(id).select('-hash');
    kitdetail = {};  
    kitdetail['images'] = [];  
    kitdetail['id'] = kit['id'];
    kitdetail['name'] = kit['name'];  
    kitdetail['pdfname'] = kit['pdfname'];  
    kitdetail['department'] = kit['department'];  
    kitdetail['subject'] = kit['subject'];  
    kitdetail['concept'] = kit['concept'];  
    kitdetail['pdf'] = config.repositoryHost+kit['pdf']; 
    for (const item of kit['images']) {     
      kitdetail['images'].push(config.repositoryHost+item);  
    }  
    return kitdetail;
}


async function update(id, req) {
    let current_user = get_current_user(req);
    let updatedAt = new Date();
    let kitParam = req.body;
    let kitDetail = await Kit.findById(id);
    
    if (!kitDetail) {
        throw 'Kit does not exists';
    }
    kitParam.updatedBy = current_user;
    kitParam.updatedDate = updatedAt;
    kitParam.pdf = kitDetail.pdf;
    
    Object.assign(kitDetail, kitParam);
    if (await kitDetail.save()) {
      if (req.files && Object.keys(req.files).length > 0) {
        let fileKeys = Object.keys(req.files);
        let kitimages = [];
        let promises = [];
        //kitDetail.images = kitimages;
                          
        for (const item of fileKeys) {
          p = new Promise((resolve, reject) => {
                  if (item == "pdf") {
                    let pdf = req.files[item];
                    uploadToS3(pdf, "kitpdfs").then(response => {
                      kitDetail.pdf = response.Key;
                      resolve(" UPLODAED R : "+item)
                    })
                  } else {
                    let image = req.files[item];
                    uploadToS3(image, "kitimages"+kitDetail.id).then(response => {
                      kitimages.push(response.Key)
                      resolve(" UPLODAED R : "+item)
                    })
                  }
              });
          promises.push(p)
        }
        try {
          await Promise.all(promises)
          if (kitimages.length > 0) {
            kitDetail.images = kitimages;
          }
          kitDetail.save();
          console.log("KIT SAVED")
        }
        catch (err) {
          
        }
      }
      return {success: true} 
    }
}

async function _delete(id) {
    await Kit.findByIdAndRemove(id);
    return {success: true}
}
