const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth").OAuth2Strategy;
const { users: User, digital_assets: Asset } = require("../models");
const { encrypt } = require("../utils/token");
const config = require("../../config");

const GOOGLE_CLIENT_ID = config.googleId;
const GOOGLE_CLIENT_SECRET = config.googleSecret;

function generatePassword() {
  var length = 8,
    charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
    retVal = "";
  for (var i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n));
  }
  return retVal;
}

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: `${config.serverDomain}/auth/google/callback`,
    },

    async function (accessToken, refreshToken, profile, done) {
      try {
        let user = await User.findOne({
          where: { email: profile._json.email },
          include: [
            {
              model: Asset,
              required: false,
            },
          ],
        });

        if (user) {
          if (!user.digital_assets.length) {
            await Asset.create({
              url: profile._json.picture,
              user_id: user.id,
            });
          }
        } else {
          const password = generatePassword();
          const createPayload = Object.freeze({
            nama: profile._json.name,
            email: profile._json.email,
            password: encrypt(password),
            provider: 'google',
            digital_assets: {
              url: profile._json.picture,
            },
          });

          await User.create(createPayload, { include: { model: Asset } });
        }

        user = await User.findOne({
          where: { email: profile._json.email },
          include: [
            {
              model: Asset,
              required: false,
            },
          ],
        });

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

module.exports = passport;
