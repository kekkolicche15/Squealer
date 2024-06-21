const User = require(`${global.dirs.apps.be.user}/model`);
const Channel = require(`${global.dirs.apps.be.channel}/model`);
const ChannelUser = require(`${global.dirs.apps.be.channelUser}/model`);
const VipSmm = require(`${global.dirs.apps.be.vipSmm}/model`);
const Smm = require(`${global.dirs.apps.be.smm}/model`);
const Post = require(`${global.dirs.apps.be.post}/model`);
const bcrypt = require("bcryptjs");
const fse = require("fs-extra");
const {
  RequestError,
  calcPop,
  adjustImage
} = require(`${global.dirs.libraries}/utils`);
const {
  editRefs,
  deleteRefs
} = require(`${global.dirs.libraries}/refHandler`);
const asyncHandler = require("express-async-handler");

exports.deleteUser = asyncHandler(async (req, res, _) => {
  const user = await User.findOne({ username: req.params.user });
  if (!user) throw new RequestError(404, "user", "USER");
  await deleteRefs(`!u!${user.username}!!`);
  await user.delete();
  return res
    .status(200)
    .json({ response: global.strings[req.lan]["200"].mod.USER_DELETED });
});

exports.editUserInfo = asyncHandler(async (req, res, _) => {
  const user = await User.findOne({ username: req.params.user });
  if (!user) throw new RequestError(404, "user", "USER");
  const fields = {};
  if ("username" in req.body) {
    if (!new RegExp(global.data.patterns.username).test(req.body.username)) {
      throw new RequestError(400, "user", "BAD_USERNAME");
    }
    if (await User.findOne({ username: req.body.username })) {
      throw new RequestError(409, "user", "USERNAME");
    }
    await editRefs(`!u!${user.username}!!`, `!u!${req.body.username}!!`);
    fields.username = req.body.username;
  }
  if ("password" in req.body) {
    if (!new RegExp(global.data.patterns.password).test(req.body.password)) {
      throw new RequestError(400, "user", "BAD_NEW_PASSWORD");
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
      throw new RequestError(400, "user", "BAD_BIO");
    }
    fields.bio = req.body.bio;
  }
  if ("dquota" in req.body) {
    if (isNaN(parseInt(req.body.dquota))) {
      throw new RequestError(400, "mod", "BAD_DAILY_QUOTA");
    }
    fields.quotas = { ...user.quotas };
    fields.quotas.values[0] = Math.max(req.body.dquota, 0);
  }
  if ("wquota" in req.body) {
    if (isNaN(parseInt(req.body.wquota))) {
      throw new RequestError(400, "mod", "BAD_WEEKLY_QUOTA");
    }
    if (!fields.quotas) fields.quotas = { ...user.quotas };
    fields.quotas.values[1] = Math.max(req.body.wquota, 0);
  }
  if ("mquota" in req.body) {
    if (isNaN(parseInt(req.body.mquota))) {
      throw new RequestError(400, "mod", "BAD_MONTHLY_QUOTA");
    }
    if (!fields.quotas) fields.quotas = { ...user.quotas };
    fields.quotas.values[2] = Math.max(req.body.mquota, 0);
  }
  if ("score" in req.body) {
    if (isNaN(parseInt(req.body.score))) {
      throw new RequestError(400, "mod", "BAD_SCORE");
    }
    fields.score = Math.max(req.body.score, 0);
  }
  if ("banned" in req.body) fields.banned = req.body.banned;
  if ("role" in req.body) {
      try{
    if (!User.schema.path("role").enumValues.includes(req.body.role)) {
      throw new RequestError(400, "mod", "BAD_ROLE");
    }
    if (user.role === "smm"){
        // l'ex smm perde i vip controllati
        await VipSmm.deleteMany({smm: user._id});
        await Smm.deleteOne({smm: user._id});
    }
    else if (user.role === "vip"){
        // l'ex vip perde il suo smm
        await VipSmm.deleteOne({user: user._id});
    }
    if (req.body.role === "smm") {
      await Smm.create({smm: user._id, cost: 0, description: "Se vi farete gestire da me, mi assicurero' che i proventi derivati dalla vendita dei pandori vengano effettivamente devoluti a chi di dovere", maxVipCount: 100});
    }
      }catch(e){  console.error(e); }
    fields.role = req.body.role;
  }
  if (Object.keys(fields).length === 0) {
    throw new RequestError(400, "user", "NONE");
  }
  await user.updateOne(fields);
  return res
    .status(200)
    .json({ response: global.strings[req.lan]["200"].mod.USER_UPDATED });
});

exports.removeUserPicture = asyncHandler(async (req, res, _) => {
  const user = await User.findOne({ username: req.params.user });
  if (!user) throw new RequestError(404, "user", "USER");
  if (user.propic !== global.data.uploads.users.default) {
    await fse.remove(`${global.data.uploads.users.path}/small/${user.propic}`);
    await fse.remove(`${global.data.uploads.users.path}/big/${user.propic}`);
    await user.updateOne({ propic: global.data.uploads.users.default });
  }
  return res.status(200).json({
    response: global.strings[req.lan]["200"].mod.USER_PICTURE_DELETED,
  });
});

exports.createOfficialChannel = asyncHandler(async (req, res, _) => {
  if (
    await Channel.findOne({ name: { $regex: new RegExp(req.body.name, "i") } })
  )
    throw new RequestError(409, "channel", "NAME");
  if (!req.body.query) throw new RequestError(400, "mod", "MISS_QUERY");
  props = {
    name: req.body.name.toUpperCase(),
    description: req.body.description || null,
    type: "public",
    query: req.body.query,
    official: true,
  };
  if (req.file) {
    await adjustImage(
      req.file,
      `${global.data.uploads.channels.path}/big/${req.file.filename}`,
      ...global.data.uploads.image.big
    );
    await adjustImage(
      req.file,
      `${global.data.uploads.channels.path}/small/${req.file.filename}`,
      ...global.data.uploads.image.small
    );
    await fse.remove(req.file.path);
    props.picture = req.file.filename;
  }
  await Channel.create(props);
  return res
    .status(200)
    .json({ response: global.strings[req.lan]["201"].mod.OFFICIAL_CHANNEL });
});

exports.deleteChannel = asyncHandler(async (req, res, _) => {
  const channel = await Channel.findOne({
    name: decodeURIComponent(req.params.channel),
  });
  if (!channel) throw new RequestError(404, "channel", "CHANNEL");
  await deleteRefs(`!c!${channel.name}!!`);
  await channel.delete();
  return res.status(200).json({
    response: global.strings[req.lan]["200"].channel.DELETE_CHANNEL,
  });
});

exports.editChannelInfo = asyncHandler(async (req, res, _) => {
  const channel = await Channel.findOne({
    name: decodeURIComponent(req.params.channel),
  });
  if (!channel) throw new RequestError(404, "channel", "CHANNEL");
  const fields = {};
  if ("name" in req.body) {
    if (!new RegExp(global.data.patterns.channel).test(req.body.name)) {
      throw new RequestError(400, "channel", "NAME");
    }
    if (await Channel.findOne({ name: req.body.name })) {
      throw new RequestError(409, "channel", "NAME");
    }
    if (!channel.official) fields.query = `channel=${req.body.name}`;
    await editRefs(`!c!${channel.name}!!`, `!c!${req.body.name}!!`);
    fields.name = req.body.name;
  }
  if ("description" in req.body) {
    if (
      !new RegExp(global.data.patterns.description).test(req.body.description)
    ) {
      throw new RequestError(400, "channel", "DESCRIPTION");
    }
    fields.description = req.body.description;
  }
  if ("privacy" in req.body) {
    if (!Channel.schema.path("privacy").enumValues.includes(req.body.privacy)) {
      throw new RequestError(400, "channel", "BAD_PRIVACY");
    }
    if (req.body.privacy === "public") {
      await ChannelUser.updateMany(
        { channel: channel._id, status: "waiting" },
        { $set: { status: "member" } }
      );
    }
    fields.privacy = req.body.privacy;
  }
  if ("query" in req.body) {
    if (!new RegExp(global.data.patterns.query).test(req.body.query)) {
        throw new RequestError(400, "channel", "BAD_QUERY");
        }
    fields.query = req.body.query;
  }
  await channel.updateOne(fields);
  return res
    .status(200)
    .json({ response: global.strings[req.lan]["200"].channel.EDIT });
});

exports.removeChannelPicture = asyncHandler(async (req, res, _) => {
  const channel = await Channel.findOne({
    name: decodeURIComponent(req.params.channel),
  });
  if (!channel) throw new RequestError(404, "channel", "CHANNEL");
  if (channel.picture !== global.data.uploads.channels.default) {
    await fse.remove(`${global.data.uploads.channels.path}/${channel.picture}`);
  }
  await channel.updateOne({ picture: global.data.uploads.channels.default });
  return res.status(200).json({
    response: global.strings[req.lan]["200"].mod.CHANNEL_PICTURE_DELETED,
  });
});

exports.editViews = asyncHandler(async (req, res, _) => {
  const post = await Post.findById(req.params.post);
  if (!post) throw new RequestError(404, "post", "POST");
  if (!req.body.views || isNaN(parseInt(req.body.views))) {
    throw new RequestError(400, "mod", "BAD_VIEWS");
  }
  await post.updateOne({ views: parseInt(req.body.views) });
  return res.status(200).json({
    response: global.strings[req.lan]["200"].mod.VIEWS,
    popularity: calcPop(post.RP, post.RM, parseInt(req.body.views) * 0.25),
  });
});

exports.editPostReactions = asyncHandler(async (req, res, _) => {
  const post = await Post.findById(req.params.post);
  if (!post) throw new RequestError(404, "post", "POST");
  const author = await User.findById(post.author);
  const reactions = Object.keys(req.body.reactions)
    .filter(
      (key) =>
        global.data.misc.reactions.includes(parseInt(key)) &&
        !isNaN(req.body.reactions[key])
    )
    .reduce((obj, key) => {
      obj[key] = parseInt(req.body.reactions[key]);
      return obj;
    }, {});
  return res.status(200).json({
    response: global.strings[req.lan]["200"].mod.REACTIONS_UPDATED,
    popularity: await post.addFakeReactions(author, reactions),
  });
});

exports.deletePost = asyncHandler(async (req, res, _) => {
  const post = await Post.findById(req.params.post);
  if (!post) throw new RequestError(404, "post", "POST");
  const [parent, channel] = await Promise.all([
    post.parent ? Post.findById(post.parent) : Promise.resolve(undefined),
    Channel.findById(post.channel),
    post.delete(),
  ]);
  if (parent) await parent.updateOne({ $pull: { replies: req.post.post } });
  if (channel.temporary && !(await Post.findOne({ channel: channel._id }))) {
    await Channel.findByIdAndDelete(channel._id);
  }
  return res.status(200).json({
    response: global.strings[req.lan]["200"].post.DELETE,
  });
});
