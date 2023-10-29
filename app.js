
const compression = require("compression");
const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const jwt = require("./_helpers/jwt");
const deviceHandler = require("./_helpers/device");
const errorHandler = require("./_helpers/error-handler");
const commonMethod = require('./_helpers/commonmethods');

app.use(compression());
app.use(fileUpload());
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(deviceHandler);
app.use(express.static("assets"));
app.use(express.static("uploads"));
app.use(cors());
app.use(jwt());
app.use(errorHandler);

require('./elearnings/courses.js')(app)
require('./elearnings/discussions.js')(app)
require("./scertstreams/scertstreams.js")(app);
require("./streams/streams.js")(app);
require("./users/users.js")(app);
require("./users/useractions.js")(app);
require("./departmentmasters/departmentmasters.js")(app);
require("./videos/videos.js")(app);
require("./users/notifications.js")(app);
require("./broadcast_messages/broadcastmessages.js")(app);
require("./apis/apis.js")(app);

app.use("/whatsapp", require("./whatsapp/api.controller"));
app.use("/videostories", require("./videostories/videostories.controller"));
app.use("/reports", require("./reports/reports.controller"));
app.use("/users", require("./users/users.controller"));
app.use("/useractions", require("./users/useractions.controller"));
app.use("/crons", require("./users/crons.controller"));
app.use("/categories", require("./categories/categories.controller"));
app.use("/videos", require("./videos/videos.controller"));
app.use("/streams", require("./streams/streams.controller"));
app.use("/videolikes", require("./videos/videolikes.controller"));
app.use("/departments", require("./departmentmasters/departmentmasters.controller"));
app.use("/subjects", require("./subjectmasters/subjectmasters.controller"));
app.use("/concepts", require("./conceptmasters/conceptmasters.controller"));
app.use("/documents", require("./documents/documents.controller"));
app.use("/scert_solutions", require("./scert_solutions/scertsolutions.controller"));
app.use("/activities", require("./activities/activities.controller"));
app.use("/masters", require("./masters/masters.controller"));
app.use("/lessons", require("./lessons/lessons.controller"));
app.use("/tv", require("./lessons/tv.controller"));
app.use("/audios", require("./audios/audios.controller"));
app.use("/kits", require("./kits/kits.controller"));
app.use("/scertstreams", require("./scertstreams/scertstreams.controller"));
app.use("/webassessment", require("./webassessments/webassessments.controller"));
app.use("/sparkles", require("./sparkles/sparkle.controller"));
app.use("/digitaldiaries", require("./digital_diaries/digitaldiaries.controller"));

app.use("/assessment", require("./assessments/assessments.controller"));
app.use("/assessmentreport", require("./assessments/assessmentreport.controller"));

app.use((err, req, res, next) => {
    const error = new Error(err);
    if (error) {
        console.error(error.stack);
        // commonMethod.sendEmail(error.name, 500, error.message);
        return res.status(500).json({message: error.message});
    } else {
        return res.status(500).json({message: "Something went wrong"});
    }    
});

const port = process.env.NODE_ENV === 'production' ? (process.env.PORT || 8081) : 8081;
const server = app.listen(port, function (request, response) {
  console.log("Server listening to port : ", port);
});

module.exports = app;