//'use strict'
const departmentmasterService = require("./departmentmaster.service");

module.exports = function (app) {
  /**
   * Below API will send all streams data according to the parameters passed in query parameters.
   */
  app.get("/departments/withsubjects", async function (req, response) {
    let departmentmasters = await departmentmasterService
      .getAllWithSubjects()
      .catch((e) => {
        response.send({ message: "Some error occured. Try again later" });
      });
    response.send(departmentmasters);
  });
};
