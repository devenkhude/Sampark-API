const config = require('../config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../_helpers/db');
const commonmethods = require('../_helpers/commonmethods');
const get_current_user = commonmethods.get_current_user;
const uploadToS3 = commonmethods.uploadToS3;
const Scertsolution = db.Scertsolution;

module.exports = {
    getAll,
    getById,
    create,
    update,
    edit,
    delete: _delete
};

async function getAll() {
    //limit(6).
    //scertsolutions = await Scertsolution.find(query).populate('subject','name').populate('department','name').select('-hash');
    scertsolutions = await Scertsolution.find().sort('createdDate desc');
    
    scertsolutionList = [];
    for(var i = 0; i < scertsolutions.length;i++){
      
      scertsolution = {};
      scertsolution['id'] = scertsolutions[i]['id'];    
      scertsolution['name'] = scertsolutions[i]['name'];    
      scertsolution['states'] = scertsolutions[i]['states'];    
      scertsolution['doc_url'] = config.repositoryHost+scertsolutions[i]['doc_url'];    
            
      scertsolutionList.push(scertsolution);
    }
    return scertsolutionList;
    //return await Scertsolution.find(query).populate('subject','name').populate('department','name').select('-hash');
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
    scertsolution = await Scertsolution.findById(id).select('-hash');
    scertsolutiondetail = {};
    scertsolutiondetail['states'] = scertsolution['states'];    
    scertsolutiondetail['id'] = scertsolution['id'];
    scertsolutiondetail['name'] = scertsolution['name'];  
    scertsolutiondetail['doc_url'] = config.repositoryHost+scertsolution['doc_url'];      
    return scertsolutiondetail;
}

async function create(req) {
    let current_user = get_current_user(req);
    let updatedAt = new Date();
    // validate
    let scertsolutionParam = req.body
    
    scertsolutionParam.createdBy = current_user;
    scertsolutionParam.updatedBy = current_user;
    scertsolutionParam.states = scertsolutionParam.states.split(",");
    const scertsolutionDetail = new Scertsolution(scertsolutionParam);
    scertsolutionDetail.doc_url = "test.pdf";
    try {
      if (await scertsolutionDetail.save()) {
        if (!req.files || Object.keys(req.files).length === 0) {
          throw "No File Uploaded"
        }

        let pdf = req.files.doc_url;
        let uploadData = await uploadToS3(pdf, "scertsolution");
        scertsolutionDetail.doc_url = uploadData.Key;
        await scertsolutionDetail.save();
        return {success: true}
      }
    } catch (e) {
      throw e;
    }
}

async function edit(id) {
    scertsolution = await Scertsolution.findById(id).select('-hash');
    
    scertsolutiondetail['states'] = scertsolution['states'];    
    scertsolutiondetail['id'] = scertsolution['id'];
    scertsolutiondetail['name'] = scertsolutionDetail['name'];  
    scertsolutiondetail['doc_url'] = config.repositoryHost+scertsolutionDetail['doc_url'];      
    return scertsolutiondetail;
}

async function update(id, req) {
    let current_user = get_current_user(req);
    let updatedAt = new Date();
    let scertsolutionParam = req.body;
    const scertsolution = await Scertsolution.findById(id);
    
    scertsolutionParam.updatedBy = current_user;
    scertsolutionParam.updatedDate = updatedAt;
    
    scertsolutionParam.states = scertsolutionParam.states.split(",");
    if (!scertsolution) {
        throw 'Scertsolution does not exists';
    }

    Object.assign(scertsolution, scertsolutionParam);
    if (req.files && Object.keys(req.files).length === 1) {
      let pdf = req.files.doc_url;
      let uploadData = await uploadToS3(pdf, "scertsolution");
      scertsolution.doc_url = uploadData.Key;
      await scertsolution.save();
    } else {
      await scertsolution.save();
    }
    return {success: true} 
}

async function _delete(id) {
    await Scertsolution.findByIdAndRemove(id);
    return {success: true}
}
