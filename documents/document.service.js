const config = require('../config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../_helpers/db');
const commonmethods = require('../_helpers/commonmethods');
const get_current_user = commonmethods.get_current_user;
const uploadToS3 = commonmethods.uploadToS3;
const Document = db.Document;

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
    //documents = await Document.find(query).populate('subject','name').populate('department','name').select('-hash');
    documents = await Document.find().sort('createdDate desc');
    
    documentList = [];
    for(var i = 0; i < documents.length;i++){
      
      document = {};
      document['id'] = documents[i]['id'];    
      document['name'] = documents[i]['name'];    
      document['doc_type'] = documents[i]['doc_type'];    
      document['doc_url'] = config.repositoryHost+documents[i]['doc_url'];    
            
      documentList.push(document);
    }
    return documentList;
    //return await Document.find(query).populate('subject','name').populate('department','name').select('-hash');
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
    document = await Document.findById(id).select('-hash');
    documentdetail = {};
    documentdetail['doc_type'] = document['doc_type'];    
    documentdetail['id'] = document['id'];
    documentdetail['name'] = document['name'];  
    documentdetail['doc_url'] = config.repositoryHost+document['doc_url'];      
    return documentdetail;
}

async function create(req) {
    let current_user = get_current_user(req);
    // validate
    let documentParam = req.body
    
    documentParam.createdBy = current_user;
    documentParam.updatedBy = current_user;
    const documentDetail = new Document(documentParam);
    documentDetail.doc_url = "test.pdf";
    try {
      if (await documentDetail.save()) {
        if (!req.files || Object.keys(req.files).length === 0) {
          throw "No File Uploaded"
        }

        let pdf = req.files.doc_url;
        let uploadFolder = documentParam.doc_type;

        let uploadData = await uploadToS3(pdf, uploadFolder);
        documentDetail.doc_url = uploadData.Key;
        await documentDetail.save();
        return {success: true}
      }
    } catch (e) {
      throw e;
    }
}

async function edit(id) {
    document = await Document.findById(id).select('-hash');
    
    documentdetail['doc_type'] = document['doc_type'];    
    documentdetail['id'] = document['id'];
    documentdetail['name'] = documentDetail['name'];  
    documentdetail['doc_url'] = config.repositoryHost+documentDetail['doc_url'];      
    return documentdetail;
}


async function update(id, req) {
    let current_user = get_current_user(req);
    let updatedAt = new Date();
    let documentParam = req.body;
    const document = await Document.findById(id);
    
    if (!document) {
        throw 'Document does not exists';
    }
    documentParam.updatedBy = current_user;
    documentParam.updatedDate = updatedAt;
    documentParam.doc_url = document.doc_url;
    
    Object.assign(document, documentParam);
    
    if (await document.save()) {
      if (req.files && Object.keys(req.files).length === 1) {
        let pdf = req.files.doc_url;
        let uploadFolder = documentParam.doc_type;

        let uploadData = await uploadToS3(pdf, uploadFolder);
        document.doc_url = uploadData.Key;
        await  document.save();
      }
      return {success: true} 
    }
}

async function _delete(id) {
    await Document.findByIdAndRemove(id);
    return {success: true}
}
