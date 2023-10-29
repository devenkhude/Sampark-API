const config = require('../config.json');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../_helpers/db');
const commonmethods = require('../_helpers/commonmethods');
const update_user_points = commonmethods.update_user_points;
const resize_image = commonmethods.resize_image;
const get_current_user = commonmethods.get_current_user;
const update_social_hours = commonmethods.update_social_hours;
const create_notification = commonmethods.create_notification;
const User = db.User;
const State = db.State;
const District = db.District;
const Block = db.Block;
const Cluster = db.Cluster;
const Designation = db.Designation;
const socket = require('socket.io-client')(config.assetHost);

const { promisify } = require('util');
const url = require('url');
const http = require('http');
const https = require('https');
const path = require('path')
const isBase64 = require('is-base64');
const Hashtag = db.Hashtag;
const Caricature = db.Caricature;

module.exports = {
    getStates,
    getDistricts, 
    getBlocks,
    getClusters,
    getDesignations,
    createState,
    createDistrict, 
    createBlock,
    createCluster,
    createBulk,
    getHashtags,
    getCaricatures
};

async function getDesignations() {
    const designations = await Designation.find();
    return designations;
}

async function getStates() {
    const states = await State.find({is_active: true}).sort({name: 1}).select("id name code short_name capital is_active");    
    return states;
}

async function getDistricts(state_id) {
    let query = {};
    
    if (state_id == "") {
      throw new Error("Kindly provide State to get districts")
    }
    query["state_id"] = state_id;
    query["is_active"] = true;
    
    const districts = await District.find(query).sort({name: 1}).select("id name code state_id sf_district_id is_active"); 
    return districts;
}

async function getBlocks(district_id) {
    let query = {};
    
    if (district_id == "") {
      throw new Error("Kindly provide District to get blocks")
    }
    query["district_id"] = district_id;
    query["is_active"] = true;
    
    const blocks = await Block.find(query).sort({name: 1}).select("id name state_id district_id sf_block_id is_active"); 
    return blocks;
}

async function getClusters(block_id) {
    let query = {};
    
    if (block_id == "") {
      throw new Error("Kindly provide Block to get clusters")
    }
    query["block_id"] = block_id;
    query["is_active"] = true;
    
    const clusters = await Cluster.find(query).sort({name: 1}).select("id name code sf_cluster_id state_id district_id block_id is_active"); 
    return clusters;
}

async function createState(req) {
    let masterParam = req.body;
    if (await State.findOne({ code: masterParam.code })) {
        throw new Error('State is already created');
    }
    
    const master = new State(masterParam);
    await master.save();
}

async function createDistrict(req) {
    let masterParam = req.body;
    if (await District.findOne({ code: masterParam.code })) {
        throw new Error('District is already created');
    }
    const state = await State.findOne({ code: masterParam.state })
    if (state) {
      masterParam.state_id = state;
      const master = new District(masterParam);
      await master.save();
    }
}

async function createBlock(req) {
    let masterParam = req.body;
    if (await District.findOne({ code: masterParam.code })) {
        throw new Error('District is already created');
    }
    const state = await State.findOne({ code: masterParam.state })
    if (state) {
      masterParam.state_id = state;
      const master = new District(masterParam);
      await master.save();
    }
}

async function createCluster(req) {
    let masterParam = req.body;
    if (await District.findOne({ code: masterParam.code })) {
        throw new Error('District is already created');
    }
    const state = await State.findOne({ code: masterParam.state })
    if (state) {
      masterParam.state_id = state;
      const master = new District(masterParam);
      await master.save();
    }
}

async function createBulk(req) {
    //var masterParam = req.body;
    const url = 'http://sfactivity.samparksmartshala.org/api/accounts/allclusters.json';
    http.get(url, function(res){
        let body = '';

        res.on('data', function(chunk){
            body += chunk;
        });

        res.on('end', function(){
            const fbResponse = JSON.parse(body);
            const states = fbResponse.states
            processArray(states)
        });
    }).on('error', function(e){
    });
}

async function processArray(array) {
//socket.emit('adminmessage', { message: "Cluster Data Import Started", user: "Server", time: new Date() });
  for (const item of array) {
    await createData(item);
  }
}

async function createData(masterParam) {
  
    let state_id = "";
    let district_id = "";
    let block_id = "";    
    if (await State.findOne({ code: masterParam.state_code })) {
      const state = await State.findOne({ code: masterParam.state_code });
      state_id = state.id;
      await State.updateOne({code: masterParam.state_code}, {sf_state_id: masterParam.state_id})
    } else {
      const stateParam = {"name": masterParam.state_name, "short_name": masterParam.state_short_name, "code": masterParam.state_code, "sf_state_id": masterParam.state_id}
      const state = new State(stateParam);
      await state.save();
      state_id = state.id;
    }
    
    if (await District.findOne({ name: masterParam.district_name, state_id: state_id })) {
      const district = await District.findOne({ name: masterParam.district_name, state_id: state_id });
      district_id = district.id;
      await District.updateOne({name: masterParam.district_name, state_id: state_id}, {sf_district_id: masterParam.district_id})
    } else {
      const districtParam = {"name": masterParam.district_name, "code": masterParam.district_code, "sf_district_id": masterParam.district_id, "state_id": state_id}
      const district = new District(districtParam);
      await district.save();
      district_id = district.id;
    }
    
    if (await Block.findOne({ name: masterParam.block_name, district_id: district_id})) {
      const block = await Block.findOne({ name: masterParam.block_name, district_id: district_id});
      block_id = block.id
      await Block.updateOne({name: masterParam.block_name, district_id: district_id}, {sf_block_id: masterParam.block_id})
    } else {
      const blockParam = {"name": masterParam.block_name, "code": masterParam.block_code, "sf_block_id": masterParam.block_id, "district_id": district_id, "state_id": state_id}
      const block = new Block(blockParam);
      await block.save();
      block_id = block.id
    }
    
    if (masterParam.cluster_name != "") {
      if (await Cluster.findOne({ name: masterParam.cluster_name, block_id: block_id })) {
        await Cluster.updateOne({name: masterParam.cluster_name, block_id: block_id}, {sf_cluster_id: masterParam.cluster_id})
        return "old"
      } else {
        const clusterParam = {"name": masterParam.cluster_name, "code": masterParam.cluster_code, "sf_cluster_id": masterParam.cluster_id, "block_id": block_id, "district_id": district_id, "state_id": state_id}
        const cluster = new Cluster(clusterParam);
        await cluster.save();
        return cluster.id
      }
    }
}

/*
This API is to get predefined hash tags from master
*/
async function getHashtags() {
  let query = {};
  let finalArray = [];

  //To get active hash tags
  query['isActive'] = true;

  const hashtags = await Hashtag.find(query).sort({ row : 1, name : 1 });

  //Loop through objects
  for (let id in hashtags) {
    //Each hashtag as an object
    let hashObj = {};
    
    hashObj['name'] = '#'+hashtags[id]['name'];
    hashObj['row'] = hashtags[id]['row'];

    //Assign final object to an array
    finalArray.push(hashObj); 
  }
  return finalArray;
}

/*
This API is to get predefined caricatures from master
*/
async function getCaricatures() {
  let query = {};
  let finalArray = [];

  //To get active caricatures
  query['isActive'] = true;

  const caricatures = await Caricature.find(query).sort({ path : 1 });

  //Loop through objects
  for (let id in caricatures) {

    //Each caricature as an object
    let caricatureObj = {};
    
    caricatureObj['fullPath'] = config.repositoryHost + caricatures[id]['path'];
    caricatureObj['caricaturePath'] = caricatures[id]['path'];

    //Assign final object to an array
    finalArray.push(caricatureObj); 
  }
  return finalArray;
}