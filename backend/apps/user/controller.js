const { RequestError, adjustImage } = require(`${global.dirs.libraries}/utils`);
const bcrypt = require("bcryptjs");
const asyncHandler = require("express-async-handler");
const User = require("./model");
const Notification = require(`${global.dirs.apps.be.notification}/model`);
const Auth = require(`${global.dirs.libraries}/auth`);
const Channel = require(`${global.dirs.apps.be.channel}/model`);
const ChannelUser = require(`${global.dirs.apps.be.channelUser}/model`);
const fse = require("fs-extra");
const path = require("path");
const VipSmm = require(`${global.dirs.apps.be.vipSmm}/model`);
const { refreshToken } = require("../../libraries/auth");
const { calcQuotaWithModifiers } = require(`${global.dirs.libraries}/utils`);
const {
  editRefs,
  deleteRefs
} = require(`${global.dirs.libraries}/refHandler`);
const sgMail = require("@sendgrid/mail");
const { get } = require("lodash");
sgMail.setApiKey(global.data.email.KEY);

const validFields = [
  ["username", "role", "defaultImage"],
  ["bio", "followerCount", "followedCount", "creationDate", "email"],
  ["quotas", "score"],
  ["banned"],
];

exports.createUser = asyncHandler(async (req, res, _) => {
  if (!req.body.username) {
    throw new RequestError(400, "user", "MISS_USERNAME");
  }
  if (!new RegExp(global.data.patterns.username).test(req.body.username)) {
    throw new RequestError(400, "user", "BAD_USERNAME");
  }
  if (!req.body.email) throw new RequestError(400, "user", "MISS_EMAIL");
  if (!new RegExp(global.data.patterns.email).test(req.body.email)) {
    throw new RequestError(400, "user", "BAD_EMAIL");
  }
  if (!req.body.password) {
    throw new RequestError(400, "user", "MISS_PASSWORD");
  }
  if (!new RegExp(global.data.patterns.password).test(req.body.password)) {
    throw new RequestError(400, "user", "BAD_PASSWORD");
  }
  const { username, email } = req.body;
  const password = await bcrypt.hash(
    req.body.password,
    global.data.bcrypt.saltRounds
  );
  try {
    const userObj = { username, email, password };
    if (req.file) userObj.propic = req.file.filename;
    const user = await User.create(userObj);
    const emailBody = `<div class=adM></div><div><div class=adM></div><table align=center border=0 cellpadding=0 cellspacing=0 width=600><tr><td style="padding:10px 0"align=center><h1>Conferma Iscrizione</h1><tr><td style="padding:40px 30px"bgcolor=#ecf0f1><p>Grazie per aver scelto di iscriverti su Squealer! Per completare la tua iscrizione, clicca sul pulsante di conferma qui sotto:<p><a href="${global.data.externalLink}/verified?code=${user.activation}"target=_blank style="display:inline-block;padding:10px 20px;background-color:#3498db;color:#fff;text-decoration:none;border-radius:5px">Conferma Iscrizione</a><p>Se il pulsante di conferma non funziona, puoi copiare e incollare il seguente URL nel tuo browser:<p><a href=${global.data.externalLink}/verified?code=${user.activation} target=_blank>${global.data.externalLink}/verified?code=${user.activation}</a></table></div>`;
    try {
      await sgMail.send({
        to: email,
        from: "squealer222314@gmail.com",
        subject: global.strings[req.lan]["email"]["CONFIRMATION"],
        html: emailBody,
      });
    } catch (e) {
      console.error("Errore nell'invio dell'email:", e);
    }
  } catch (e) {
    if (req.file) {
      await fse.delete(
        `${global.data.uploads.users.path}/${req.file.filename}`
      );
    }
    if (e.name === "MongoServerError" && e.code === 11000) {
      throw new RequestError(409, "user", "USERNAME_EMAIL");
    }
    throw new RequestError(500, "user", "REGISTRATION");
  }
  return res
    .status(201)
    .json({ message: global.strings[req.lan]["201"].user.SIGNUP });
});

exports.requestPwdReset = asyncHandler(async (req, res, _) => {
  const user = await User.findOne({ email: req.params.email });
  if (!user) throw new RequestError(404, "user", "USER");
  const passwdReset = `${Date.now()}${Math.round(Math.random() * 1e9)}`;
  await user.updateOne({ passwdReset });
  const bodyEmail = `<div id=":5r" class="a3s aiL"><div class="adM"></div><div><div class="adM"></div><table width="600" cellspacing="0" cellpadding="0" border="0" align="center"><tbody><tr><td style="padding:10px 0" align="center"><h1>Ripristino Password</h1></td></tr><tr><td style="padding:40px 30px" bgcolor="#ecf0f1"><p>Hai richiesto di reimpostare la password del tuo account.</p><p>Per procedere con il ripristino della password, clicca sul pulsante qui sotto:</p><p><a href="${global.data.externalLink}/recover?code=${passwdReset}" style="display:inline-block;padding:10px 20px;background-color:#3498db;color:#fff;text-decoration:none;border-radius:5px" target="_blank">Ripristina Password</a></p><p>Se il pulsante di ripristino non funziona, puoi copiare e incollare il seguente URL nel tuo browser:</p><p><a href="${global.data.externalLink}/recover?code=${passwdReset}" target="_blank">${global.data.externalLink}/recover?code=${passwdReset}</a></p><p>Se non hai richiesto il ripristino della password, puoi ignorare questa email.</p></td></tr></tbody></table></div></div>`;
  try {
    await sgMail.send({
      to: user.email,
      from: "squealer222314@gmail.com",
      subject: global.strings[req.lan]["email"]["RESTORE"],
      html: bodyEmail,
    });
  } catch (e) {
    console.error("Errore nell'invio dell'email:", e);
  }
  return res.status(200).json({
    message: global.strings[req.lan]["200"].user.PASSWORD_RESET_REQUEST,
  });
});

exports.performPwdReset = asyncHandler(async (req, res, _) => {
  const user = await User.findOne({ passwdReset: req.body.code });
  if (!user) throw new RequestError(404, "reset", "NO_CODE");
  if (!new RegExp(global.data.patterns.password).test(req.body.password)) {
    throw new RequestError(409, "user", "BAD_PASSWORD");
  }
  await user.updateOne({"password": await bcrypt.hash(
      req.body.password,
      global.data.bcrypt.saltRound
  )});
  return res
    .status(201)
    .json(global.strings[req.lan][200].user.PASSWORD_RESET_CONFIRM);
});

exports.searchUsers = asyncHandler(async (req, res, _) => {
  const query = { activation: null };
  const fields = new Set(["username"]);
  if (req.query.username) {
    query.username = { $regex: `^${req.query.username}`, $options: "i" };
  }
  if (req.query.bio) {
    query.bio = { $regex: req.query.bio, $options: "i" };
  }
  if (req.user?.role === "mod") {
    if (req.query.role) {
      const roles = req.query.role.split(",");
      query.role = { $in: roles };
    }
    if (req.query.banned === "banned") {
      query.$or = [
        { banned: { $gte: new Date() } },
        { banned: { $exists: false } },
      ];
    } else if (req.query.banned === "notbanned") {
      query.$or = [{ banned: { $lt: new Date() } }, { banned: null }];
    }
    if (req.query?.view === "mod") {
      validFields.flatMap((arr) => arr).reduce((s, e) => s.add(e), fields);
    } else if (req.query.fields) {
      req.query.fields.split.forEach((e) => fields.add(e));
    }
  }
  const [count, result] = await Promise.all([
    User.countDocuments(query),
    User.find(query)
      .sort({ _id: "asc" })
      .skip(
        ((req.query.page || 1) - 1) *
          global.data.searches.CHUNKSIZE_PROFILES_CHANNELS
      )
      .limit(global.data.searches.CHUNKSIZE_PROFILES_CHANNELS),
  ]);
  return res.status(200).json({
    count,
    page: result.map((user) =>
      [...fields].reduce((acc, prop) => {
        if (prop === "defaultImage") {
          acc[prop] = user.propic === global.data.uploads.users.default;
        } else acc[prop] = user[prop];
        return acc;
      }, {})
    ),
  });
});

exports.deleteUser = asyncHandler(async (req, res, _) => {
  await deleteRefs(`!u!${req.user.username}!!`);
  await Notification.deleteAll(req.user.username);
  await req.user.delete();
  return res
    .status(200)
    .json({ response: global.strings[req.lan]["200"].user.DELETE_USER });
});

exports.login = asyncHandler(async (req, res, _) => {
  if (!req.body.username) {
    throw new RequestError(400, "user", "MISS_USERNAME");
  }
  if (!new RegExp(global.data.patterns.username).test(req.body.username)) {
    throw new RequestError(400, "user", "BAD_USERNAME");
  }
  if (!req.body.password) {
    throw new RequestError(400, "user", "MISS_PASSWORD");
  }
  if (!new RegExp(global.data.patterns.password).test(req.body.password)) {
    throw new RequestError(400, "user", "BAD_PASSWORD");
  }
  const { username, password, role } = req.body;
  const user = await User.findOne({ username });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new RequestError(404, "user", "PASSWORD");
  }
  if (user.activation)
    throw new RequestError("403", "user", "USER_NOT_ACTIVATED");
  if (role) {
    if (role === "mod" && user.role !== "mod")
      throw new RequestError(403, "user", "INSUFFICIENT_PERMISSIONS");
    else if (role === "smm" && (user.role === "user" || user.role === "mod"))
      throw new RequestError(403, "user", "INSUFFICIENT_PERMISSIONS");
  }
  if (user.banned && user.banned > new Date()) {
    throw new RequestError(403, "user", "BANNED");
  }
  const { accessToken, refreshToken } = Auth.createTokens({
    _id: user._id,
  });
  await user.updateOne({ refreshToken });
  return res.status(200).json({ accessToken, refreshToken });
});

exports.genAuthToken = asyncHandler(async (req, res, _) => {
  const newToken = await Auth.refreshToken(req.body.token);
  return res.status(200).json(newToken.accessToken);
});

exports.logout = asyncHandler(async (req, res, _) => {
  await req.user.updateOne({
    $unset: { refreshToken: 1 },
  });
  return res.status(200).json(global.strings[req.lan]["200"].user.LOGOUT);
});

exports.getInfo = asyncHandler(async (req, res, _) => {
  if (!req.params.user && !req.user) {
    throw new RequestError(400, "format", "BAD_FORMAT");
  }
  const user = req.params.user
    ? await User.findOne({
        username: req.params.user,
      })
    : req.user;
  if (!user) throw new RequestError(404, "user", "USER");
  const fields = new Set();
  if (req.query.view) {
    if (req.query.view === "minimal") {
      validFields[0].reduce((s, e) => s.add(e), fields);
    } else if (req.query.view === "full") {
      validFields
        .flatMap((arr, idx) => (idx < 2 ? arr : []))
        .reduce((s, e) => s.add(e), fields);
    } else if (
      req.query.view === "self" &&
      (req.user?.equals(user) ||
        req.user?.role === "mod" ||
        (await VipSmm.findOne({
          smm: req.user._id,
          vip: user._id,
          status: "accepted",
        })))
    ) {
      validFields
        .flatMap((arr, idx) => (idx < 3 ? arr : []))
        .reduce((s, e) => s.add(e), fields);
    } else if (req.query.view === "mod" && req.user?.role === "mod") {
      validFields.flatMap((arr) => arr).reduce((s, e) => s.add(e), fields);
    }
  }
  if (req.query.field) {
    if (!Array.isArray(req.query.field)) {
      req.query.field = [...req.query.field.split(",")];
    }
    if (!req.user?.equals(user) && !req.user?.role === "mod") {
      req.query.field
        .filter((v) =>
          validFields.flatMap((arr, idx) => (idx < 2 ? arr : [])).includes(v)
        )
        .reduce((s, e) => s.add(e), fields);
    } else if (req.user?.equals(user) && !req.user?.role === "mod") {
      req.query.field
        .filter((v) =>
          validFields.flatMap((arr, idx) => (idx < 3 ? arr : [])).includes(v)
        )
        .reduce((s, e) => s.add(e), fields);
    } else {
      req.query.field
        .filter((v) => validFields.flatMap((arr) => arr).includes(v))
        .reduce((s, e) => s.add(e), fields);
    }
  }
  if (fields.size === 0) throw new RequestError(400, "user", "NONE");
  if (fields.has("quotas")) await user.updateQuota();
  const fields2pop = [...fields].filter(
    (field) => user[field] === undefined && field !== "defaultImage"
  );
  if (fields2pop.length > 0) await user.populate(fields2pop.join(" "));
  return res.status(200).json(
    [...fields].reduce((acc, prop) => {
      if (prop === "defaultImage") {
        acc[prop] = user.propic === global.data.uploads.users.default;
      } else acc[prop] = user[prop];
      return acc;
    }, {})
  );
});

exports.getUserPicturePreview = asyncHandler(async (req, res, _) => {
  if (!req.params && !req.user) {
    throw new RequestError(400, "format", "BAD_FORMAT");
  }
  const user = req.params.user
    ? await User.findOne({
        username: req.params.user,
      })
    : req.user;
  if (!user) throw new RequestError(404, "user", "USER");
  return res.sendFile(
    path.join(global.data.uploads.users.path, "small", user.propic)
  );
});

exports.getUserPicture = asyncHandler(async (req, res, _) => {
  if (!req.params && !req.user) {
    throw new RequestError(400, "format", "BAD_FORMAT");
  }
  const user = req.params.user
    ? await User.findOne({
        username: req.params.user,
      })
    : req.user;
  if (!user) throw new RequestError(404, "user", "USER");
  return res.sendFile(
    path.join(global.data.uploads.users.path, "big", user.propic)
  );
});

exports.editUser = asyncHandler(async (req, res, _) => {
  const fields = {};
  if ("username" in req.body) {
    if (!new RegExp(global.data.patterns.username).test(req.body.username)) {
      throw new RequestError(400, "user", "BAD_USERNAME");
    }
    if (await User.findOne({ username: req.body.username })) {
      throw new RequestError(409, "user", "USERNAME");
    }
    await editRefs(`!u!${req.user.username}!!`, `!u!${req.body.username}!!`);
    fields.username = req.body.username;
  }
  if ("password" in req.body) {
    if (!("currentPassword" in req.body)) {
      throw new RequestError(400, "user", "MISSING_CURRENT_PASSWORD");
    }
    if (!new RegExp(global.data.patterns.password).test(req.body.password)) {
      throw new RequestError(400, "user", "BAD_NEW_PASSWORD");
    }
    if (!(await bcrypt.compare(req.body.currentPassword, req.user.password))) {
      throw new RequestError(403, "user", "PASSWORD");
    }
    fields.password = await bcrypt.hash(
      req.body.password,
      global.data.bcrypt.saltRounds
    );
    fields.$unset = { refreshToken: 1 };
  }
  if ("email" in req.body) {
    if (!new RegExp(global.data.patterns.email).test(req.body.email)) {
      throw new RequestError(400, "user", "BAD_EMAIL");
    }
    if (await User.findOne({ email: req.body.email })) {
      throw new RequestError(409, "user", "EMAIL");
    }
    fields.email = req.body.email;
  }
  if ("bio" in req.body) {
    if (!new RegExp(global.data.patterns.description).test(req.body.bio)) {
      throw new RequestError(400, "user", "BAD_USERNAME");
    }
    fields.bio = req.body.bio;
  }
  if (Object.keys(fields).length === 0) {
    throw new RequestError(400, "user", "NONE");
  }
  await req.user.updateOne(fields);
  return res.status(200).json(global.strings[req.lan]["200"].user.UPDATE);
});

exports.editUserPicture = asyncHandler(async (req, res, _) => {
  if (!req.file) throw new RequestError(400, "user", "MISS_FILE");
  await adjustImage(
    req.file,
    `${global.data.uploads.users.path}/big/${req.file.filename}`,
    ...global.data.uploads.image.big
  );
  await adjustImage(
    req.file,
    `${global.data.uploads.users.path}/small/${req.file.filename}`,
    ...global.data.uploads.image.small
  );
  await fse.remove(req.file.path);
  if (req.user.propic !== global.data.uploads.users.default) {
    await fse.remove(
      `${global.data.uploads.users.path}/big/${req.user.propic}`
    );
    await fse.remove(
      `${global.data.uploads.users.path}/small/${req.user.propic}`
    );
  }
  await req.user.updateOne({ propic: req.file.filename });
  return res.status(200).json(global.strings[req.lan]["200"].user.PROPIC);
});

exports.deleteUserPicture = asyncHandler(async (req, res, _) => {
  if (req.user.propic !== global.data.uploads.users.default) {
    await fse.remove(
      `${global.data.uploads.users.path}/big/${req.user.propic}`
    );
    await fse.remove(
      `${global.data.uploads.users.path}/small/${req.user.propic}`
    );
  }
  await req.user.updateOne({ propic: global.data.uploads.users.default });
  return res
    .status(200)
    .json(global.strings[req.lan]["200"].user.DELETE_PROPIC);
});

exports.getOwnedChannels = asyncHandler(async (req, res, _) => {
  const user = req.params.user
    ? await User.findOne({ username: req.params.user })
    : req.user;
  return res.status(200).json(
    (
      await Channel.find({ owner: user._id })
        .sort({ name: "asc" })
        .skip(((req.query.page || 1) - 1) * global.data.searches.CHUNKSIZE)
        .limit(global.data.searches.CHUNKSIZE)
    ).map((channel) => channel.name)
  );
});

exports.getModeratedChannels = asyncHandler(async (req, res, _) => {
  const user = req.params.user
    ? await User.findOne({ username: req.params.user })
    : req.user;
  return res.status(200).json(
    (
      await Channel.find({ moderators: { $in: [user._id] } })
        .sort({ name: "asc" })
        .skip(((req.query.page || 1) - 1) * global.data.searches.CHUNKSIZE)
        .limit(global.data.searches.CHUNKSIZE)
    ).map((channel) => channel.name)
  );
});

exports.getChannels = asyncHandler(async (req, res, _) => {
  if (!req.params.user && !req.user) {
    throw new RequestError(400, "format", "BAD_FORMAT");
  }
  const user = req.params.user
    ? await User.findOne({ username: req.params.user })
    : req.user;
  const channelsIds = (
    await ChannelUser.find({ user: user._id, status: "joined" })
      .sort({ channel: "asc" })
      .skip(((req.query.page || 1) - 1) * global.data.searches.CHUNKSIZE)
      .limit(global.data.searches.CHUNKSIZE)
  ).map((obj) => obj.channel);
  return res
    .status(200)
    .json(
      (await Channel.find({ _id: { $in: channelsIds } })).map(
        (channel) => channel.name
      )
    );
});

exports.getW8edChannels = asyncHandler(async (req, res, _) => {
  const channelsIds = (
    await ChannelUser.find({ user: req.user._id, status: "waiting" })
      .sort({ channel: "asc" })
      .skip(((req.query.page || 1) - 1) * global.data.searches.CHUNKSIZE)
      .limit(global.data.searches.CHUNKSIZE)
  ).map((obj) => obj.channel);
  return res
    .status(200)
    .json(
      (await Channel.find({ _id: { $in: channelsIds } })).map(
        (channel) => channel.name
      )
    );
});

exports.buyQuota = asyncHandler(async (req, res, _) => {
  let user = req.user;
  if (req.params.vip) {
    const vip = await User.findOne({ username: req.params.vip, role: "vip" });
    if (!vip) throw new RequestError(404, "user", "MISS-VIP");
    const vipsmm = await VipSmm.findOne({ smm: req.user._id, vip: vip._id });
    if (!vipsmm) throw new RequestError(409, "user", "NOT-SMM");
    user = vip;
  }
  if (!req.query.amount) throw new RequestError(400, "user", "MISS_AMOUNT");
  req.query.amount = parseInt(req.query.amount);
  if (req.query.amount < 0) throw new RequestError(400, "user", "BAD_AMOUNT");
  if (req.query.amount * global.data.misc.scoreQuotaConversion > user.score) {
    throw new RequestError(409, "user", "AMOUNT");
  }
  await user.updateOne({
    $inc: { score: -global.data.misc.scoreQuotaConversion * req.query.amount },
    "quotas.values": user.quotas.values.map(
      (quota) => quota + req.query.amount
    ),
  });
  return res.status(200).json(global.strings[req.lan]["200"].user.QUOTAS);
});

exports.buyScore = asyncHandler(async (req, res, _) => {
  let user = req.user;
  if (req.params.vip) {
    const vip = await User.findOne({ username: req.params.vip, role: "vip" });
    if (!vip) throw new RequestError(404, "user", "MISS-VIP");
    const vipsmm = await VipSmm.findOne({ smm: req.user._id, vip: vip._id });
    if (!vipsmm) throw new RequestError(409, "user", "NOT-SMM");
    user = vip;
  }
  if (!req.query.amount) throw new RequestError(400, "user", "MISS_AMOUNT");
  req.query.amount = parseInt(req.query.amount);
  if (req.query.amount < 0) throw new RequestError(400, "user", "BAD_AMOUNT");
  await user.updateOne({ score: user.score + req.query.amount });
  return res.status(200).json(global.strings[req.lan]["200"].user.SCORE);
});

exports.becomeVip = asyncHandler(async (req, res, _) => {
  if (req.user.score < global.data.misc.vipCost) {
    throw new RequestError(409, "user", "AMOUNT");
  }

  if (req.user.role !== "user") throw new RequestError(409, "user", "VIP");
  const toUpdate = {
    $inc: { score: -global.data.misc.vipCost },
    role: "vip",
    quotas: {
      values: [0, 0, 0],
      modifiers: [0, 0, 0],
      lastUpdate: new Date(),
    },
  };
  global.data.quotas.vip.forEach((value, index) => {
    toUpdate.quotas.values[index] = calcQuotaWithModifiers(
      value,
      req.user.quotas.modifiers[index]
    );
  });
  await req.user.updateOne(toUpdate);
  return res.status(200).json(global.strings[req.lan]["200"].user.VIP);
});

exports.ceaseVip = asyncHandler(async (req, res, _) => {
  const toUpdate = {
    role: "user",
    quotas: {
      values: [0, 0, 0],
      modifiers: [0, 0, 0],
      lastUpdate: new Date(),
    },
  };
  global.data.quotas.user.forEach((value, index) => {
    toUpdate.quotas.values[index] = calcQuotaWithModifiers(
      value,
      req.user.quotas.modifiers[index]
    );
  });
  //TODO se smm togliere tutti gli account gestiti
  await req.user.updateOne(toUpdate);
  return res.status(200).json(global.strings[req.lan]["200"].user.VIP_DISABLE);
});

exports.getDebt = asyncHandler(async (req, res, _) => {
  if (!req.user) {
    throw new RequestError(400, "format", "BAD_FORMAT");
  }
  return res.status(200).json({ response: req.user.debt });
});

exports.changeStateDebt = asyncHandler(async (req, res, _) => {
  if (!req.user) {
    throw new RequestError(400, "format", "BAD_FORMAT");
  }
  if (req.query.debt === "true" && !req.user.debt) {
    await req.user.updateOne({
      debt: true,
      "quotas.values": req.user.quotas.values.map(
        (quota) => quota + global.data.misc.ExtraQuotas
      ),
    });
    return res.status(200).json(global.strings[req.lan]["200"].user.DEBT_ADDED);
  } else if (req.query.debt === "false" && req.user.debt) {
    if (
      global.data.misc.ExtraQuotas * global.data.misc.scoreQuotaConversion >
      req.user.score
    ) {
      throw new RequestError(409, "user", "AMOUNT");
    }
    await req.user.updateOne({
      $inc: {
        score:
          -global.data.misc.scoreQuotaConversion * global.data.misc.ExtraQuotas,
      },
      debt: false,
    });
    return res
      .status(200)
      .json(global.strings[req.lan]["200"].user.DEBIT_DISABLED);
  }
});
