const express = require("express");
const passport = require("passport");
const app = express();
const helmet = require("helmet");
const cors = require("cors");
const { rateLimit } = require("express-rate-limit");
const config = require("../config");
const session = require("express-session"); 
var bodyParser = require('body-parser');

const limitedAccess = rateLimit({
  windowMs: 1 * 60 * 1000, 
  max: 15,
  delayMs: 0,
  statusCode: 500,
  message: "LIMITED ACCESS!",
});

app.use(cors());
app.use(helmet());
app.disable("etag");

app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true },
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true })); 

app.use("/uploads", express.static(config.uploads));
app.use("/documents", express.static(config.documents));

app.use("/auth", limitedAccess, require("./routes/auth"));
app.use("/kegiatan", require("./routes/kegiatan"));

app.get("/", async (req, res) => {
  try {
    return res.status(200).json("berhasil membuka page");
  } catch (error) {
    return res.status(500).json("error");
  }
});

module.exports = app;
