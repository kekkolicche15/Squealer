const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require(`${global.dirs.apps.be.user}/model`);
const { RequestError } = require(`${global.dirs.libraries}/utils`);

exports.createTokens = (data) => {
  const refreshData = {
    _id: data._id,
  };
  const refreshToken = jwt.sign(refreshData, global.data.jwt.refresh, {
    expiresIn: global.data.jwt.refreshExpire,
  });
  const refHash = crypto.createHash("SHA-1").update(refreshToken).digest("hex");
  const accessData = {
    ...refreshData,
    ref: refHash,
  };
  const accessToken = jwt.sign(accessData, global.data.jwt.access, {
    expiresIn: global.data.jwt.accessExpire,
  });
  return { accessToken, refreshToken };
};

exports.refreshToken = async (refToken) => {
  if (!refToken || !(await User.findOne({ refreshToken: refToken }))) {
    throw new RequestError(400, "auth", "BAD_TOKEN");
  }
  const refHash = crypto.createHash("SHA-1").update(refToken).digest("hex");
  return jwt.verify(refToken, global.data.jwt.refresh, (err, user) => {
    if (err) throw new RequestError(400, "auth", "BAD_TOKEN");
    const data = {
      _id: user._id,
      ref: refHash,
    };
    return {
      accessToken: jwt.sign(data, global.data.jwt.access, {
        expiresIn: global.data.jwt.accessExpire,
      }),
    };
  });
};

exports.optionalToken = asyncHandler(async (req, _res, next) => {
  const token = (req.headers?.authorization || "")?.split(" ")[1];
  if (!token) {
    next();
    return;
  }
  try {
    const tokenInfo = await jwt.verify(token, global.data.jwt.access);
    const user = await User.findOne({ _id: tokenInfo._id });
    if (user.banned && user.banned > new Date()) {
      throw new RequestError(403, "user", "BANNED");
    }
    const refHash = crypto
      .createHash("SHA-1")
      .update(user.refreshToken)
      .digest("hex");
    if (refHash === tokenInfo.ref) req.user = user;
  } catch (_) {
    throw new RequestError(400, "auth", "BAD_TOKEN");
  }
  next();
});

exports.requireToken = asyncHandler(async (req, _res, next) => {
  const token = (req.headers?.authorization || "")?.split(" ")[1];
  if (!token) throw new RequestError(400, "auth", "BAD_TOKEN");
  try {
    const tokenInfo = await jwt.verify(token, global.data.jwt.access);
    const user = await User.findOne({ _id: tokenInfo._id });
    if (user.banned && user.banned > new Date()) {
      throw new RequestError(403, "user", "BANNED");
    }
    if (
      crypto.createHash("SHA-1").update(user.refreshToken).digest("hex") ===
      tokenInfo.ref
    )
      req.user = user;
    else throw new Error();
  } catch (_) {
    throw new RequestError(400, "auth", "BAD_TOKEN");
  }
  next();
});

exports.checkRole = (role) => {
  return asyncHandler(async (req, _, next) => {
    if (["user", "vip", "smm", "mod"].indexOf(req.user.role) < role) {
      throw new RequestError(403, "user", "AUTHORIZATION");
    } else next();
  });
};
