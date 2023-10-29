//'use strict'
const userService = require('../users/user.service');
const apiService = require('./api.service');
 
module.exports = function (app) {

  /**
   * Below API will send all users on date basis
   * required parameters
   * date = 2020-01-06 (YYYY-MM-DD)
   */
  app.get("/apis/users", async function (req, response) {

      let request_query = req;
            
      await apiService.users(request_query).then(function(users){
          response.send(users);
      }).catch(e => {
          response.send({"message": e});
      });
  });
  
  /**
   * Below API will user stats -> no of likes, comments, post, video played on date basis
   * required parameters
   * date = 2020-01-06 (YYYY-MM-DD)
   */
  app.get("/apis/userstats", async function (req, response) {

      let request_query = req;
      
      await apiService.userstats(request_query).then(function(userstats){
          response.send(userstats);
      }).catch(e => {
          response.send({"message": e});
      });
  });
  
  /**
   * Below API will user likes on date basis
   * required parameters
   * date = 2020-01-06 (YYYY-MM-DD)
   */
  app.get("/apis/userlikes", async function (req, response) {

      let request_query = req;
      
      await apiService.userlikes(request_query).then(function(userlikes){
          response.send(userlikes);
      }).catch(e => {
          response.send({"message": e});
      });
  });
  
  /**
   * Below API will user comments on date basis
   * required parameters
   * date = 2020-01-06 (YYYY-MM-DD)
   */
  app.get("/apis/usercomments", async function (req, response) {

      let request_query = req;
      
      await apiService.usercomments(request_query).then(function(usercomments){
          response.send(usercomments);
      }).catch(e => {
          response.send({"message": e});
      });
  });
  
  /**
   * Below API will user posts on date basis
   * required parameters
   * date = 2020-01-06 (YYYY-MM-DD)
   */
  app.get("/apis/userposts", async function (req, response) {

      let request_query = req;
      
      await apiService.userposts(request_query).then(function(userposts){
          response.send(userposts);
      }).catch(e => {
          response.send({"message": e});
      });
  });
  
  /**
   * Below API will user videos on date basis
   * required parameters
   * date = 2020-01-06 (YYYY-MM-DD)
   */
  app.get("/apis/uservideos", async function (req, response) {

      let request_query = req;
      
      await apiService.uservideos(request_query).then(function(uservideos){
          response.send(uservideos);
      }).catch(e => {
          response.send({"message": e});
      });
  });
  
  /**
   * Below API will user items on date basis
   * required parameters
   * date = 2020-01-06 (YYYY-MM-DD)
   */
  app.get("/apis/useritems", async function (req, response) {

      let request_query = req;
      
      await apiService.useritems(request_query).then(function(useritems){
          response.send(useritems);
      }).catch(e => {
          response.send({"message": e});
      });
  });
}
