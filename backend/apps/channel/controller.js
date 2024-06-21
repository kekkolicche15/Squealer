const User = require(`${global.dirs.apps.be.user}/model`);
const Post = require(`${global.dirs.apps.be.post}/model`);
const ChannelUser = require(`${global.dirs.apps.be.channelUser}/model`);
const asyncHandler = require("express-async-handler");
const _ = require("lodash");
const Channel = require("./model");
const fse = require("fs-extra");
const {
  RequestError,
  adjustImage
} = require(`${global.dirs.libraries}/utils`);
const {
  editRefs,
  deleteRefs
} = require(`${global.dirs.libraries}/refHandler`);
const path = require("path");

const validFields = [
  ["name", "query", "defaultImage"],
  [
    "description",
    "privacy",
    "userCount",
    "creationDate",
    "temporary",
    "official",
  ],
  ["moderators", "owner", "popularity"],
  ["query"],
];

const fields2pop = new Set(["moderators", "owner"]);
const fields2calc = new Set(["userCount", "popularity"]);

const editable = ["name", "description", "privacy"];

exports.searchChannels = asyncHandler(async (req, res, _) => {

  const query = {};
  const fields = new Set(["name"]);
  const toPopulate = [];
  if (req.query.name) {
    query.name = { $regex: `^${decodeURIComponent(req.query.name)}`, $options: "i" };
  }
  if (req.query.description) {
    query.bio = { $regex: decodeURIComponent(req.query.bio), $options: "i" };
  }
  if (req.user?.role === "mod" && req.query.view === "mod") {
    validFields.flatMap((arr) => arr).reduce((s, e) => s.add(e), fields);
    fields.delete("userCount");
    toPopulate.push("moderators", "owner");
  }

  var models = [];
  var count;
  if (req.query.user) {
    const [tmpCount, tmpModels] = await Promise.all([
      Channel.countDocuments(query),
      Channel.find(query).sort({ _id: "asc" }),
    ]);
    count = tmpCount;
    const user = await User.findOne({
      username: req.query.user,
    });

    const maxReturn = 3;
    var i = 0;
    for (var j = 0; j < tmpModels.length && models.length < maxReturn; j++) {
      if (
        (await tmpModels[j].isWritableBy(user)) ||
        tmpModels[j].name[0] === "#"
      ) {
        models.push(tmpModels[j]);
        i++;
      }
    }
  } else {
    const [tmpCount, tmpModels] = await Promise.all([
      Channel.countDocuments(query),
      Channel.find(query)
        .sort({ _id: "asc" })
        .skip(
          ((req.query.page || 1) - 1) *
            global.data.searches.CHUNKSIZE_PROFILES_CHANNELS,
        )
        .limit(global.data.searches.CHUNKSIZE_PROFILES_CHANNELS)
        .populate(toPopulate.join(" ")),
    ]);
    count = tmpCount;
    models = tmpModels;
  }
  const channels = [];
  const promises = [];
  if (toPopulate.length > 0) {
    models.forEach((model) => {
      const channel = model.toJSON();
      channel.owner = model.owner?.username || undefined;
      channel.moderators = model.moderators.map(
        (mod) => mod?.username || undefined,
      );
      promises.push(model.getPopularity());
      channels.push(channel);
    });
    (await Promise.all(promises)).forEach((res, index) => {
      channels[index].popularity = res;
    });
  } else channels.push(...models);

  return await res.status(200).json({
      count,
      page: await Promise.all(channels.map(async (channel) => {
        const channelData = {};
        for (const prop of fields) {
            if (prop === "defaultImage") {
              if (channel.temporary) {
                const post = await Post.findOne({
                  channel: channel._id,
                  contentType: "image",
                });
                channelData[prop] = post
                  ? post.filename === global.data.uploads.posts.default
                  : true;
              } else {
                channelData[prop] = channel.picture === global.data.uploads.channels.default;
              }
            } else {
              channelData[prop] = channel[prop];
            }
        }
        return channelData;
      })),
  });
});

exports.getChannel = asyncHandler(async (req, res, _) => {
  const fields = new Set();
  if (req.query.view) {
    if (req.query.view === "minimal") {
      validFields[0].reduce((s, e) => s.add(e), fields);
    } else if (req.query.view === "extended") {
      validFields
        .flatMap((arr, idx) => (idx < 2 ? arr : []))
        .reduce((s, e) => s.add(e), fields);
    } else if (req.query.view === "full") {
      validFields
        .flatMap((arr, idx) => (idx < 3 ? arr : []))
        .reduce((s, e) => s.add(e), fields);
    } else if (req.query.view === "mod" && req.user?.role === "mod") {
      validFields.flatMap((arr) => arr).reduce((s, e) => s.add(e), fields);
    }
  }
  if (req.query.field) {
    req.query.field = req.query.field.split(",");
    if (!Array.isArray(req.query.field)) req.query.field = [req.query.field];
    req.query.field
      .filter((v) => validFields.flatMap((arr) => arr).includes(v))
      .reduce((s, e) => s.add(e), fields);
  }
  if (fields.size === 0) throw new RequestError("404", "format", "NONE");
  const channelMO = await Channel.findOne({
    name: decodeURIComponent(req.params.channel),
  }).populate([...fields].filter((x) => fields2pop.has(x)));
  if (!channelMO) throw new RequestError("404", "channel", "CHANNEL");
  const channelL = channelMO.toJSON();
  const channel = {};
  const [userCount, popularity] = await Promise.all([
    fields.has("userCount")
      ? channelMO.countMembers()
      : Promise.resolve(undefined),
    fields.has("popularity")
      ? channelMO.getPopularity()
      : Promise.resolve(undefined),
  ]);
  new Set(
    [...fields].filter((x) => !fields2pop.has(x) && !fields2calc.has(x)),
  ).forEach((field) => {
    channel[field] = channelL[field];
  });
  if (userCount !== undefined) channel.userCount = userCount;
  if (popularity !== undefined) channel.popularity = popularity;
  if (decodeURIComponent(req.params.channel[0]) !== "#") {
    if (fields.has("owner")) channel.owner = channelL?.owner?.username;
    if (fields.has("moderators")) {
      channel.moderators = channelL.moderators.map((mod) => mod.username);
    }
    if (fields.has("defaultImage")) {
      if (channel.temporary) {
        const post = await Post.findOne({
          channel: channel._id,
          contentType: "image",
        });
        channel.defaultImage = post
          ? post.filename === global.data.uploads.posts.default
          : true;

      } 
      else {
          channel.defaultImage =
            channelMO.picture === global.data.uploads.channels.default;

        }
    }
  }
  return res.status(200).json(channel);
});

exports.getChannelMembers = asyncHandler(async (req, res, _) => {
  const channel = await Channel.findOne({ name: decodeURIComponent(req.params.channel) });
  if (!channel) throw new RequestError("404", "channel", "CHANNEL");
  return res.status(200).json(await channel.getMembers(req.query.page));
});

exports.createChannel = asyncHandler(async (req, res, _) => {
  const props = {};
  for (field in req.body) {
    if (editable.includes(field)) props[field] = req.body[field];
  }
  if (!new RegExp(global.data.patterns.channel).test(props.name)) {
    throw new RequestError("400", "channel", "NAME");
  }
  props.owner = req.user._id;
  if (req.file) props.picture = req.file.filename;
  try {
    (await Channel.create(props)).addMember(req.user, "owner");
  } catch (e) {
    if (e.name === "MongoServerError" && e.code === 11000) {
      throw new RequestError("409", "channel", "NAME");
    }
    throw new RequestError("500", "channel", "CREATION");
  }
  return res.status(201).json(global.strings[req.lan]["201"].channel.CHANNEL);
});

exports.addModerator = asyncHandler(async (req, res, _) => {
  const [channel, target] = await Promise.all([
    Channel.findOne({ name: decodeURIComponent(req.params.channel) }),
    User.findOne({ username: req.params.user }),
  ]);
  if (!channel.isOwner(req.user)) {
    throw new RequestError("401", "channel", "NOT_OWNER");
  }
  if (channel.isMod(target)) {
    throw new RequestError("409", "channel", "MODERATOR");
  }
  if (!(await channel.isMember(target))) {
    throw new RequestError("409", "channel", "NOT_MEMBER");
  }
  await Promise.all([
    channel.updateOne({ $push: { moderators: target._id } }),
    ChannelUser.updateOne(
      { channel: channel._id, user: target._id },
      {
        status: "moderator",
      },
    ),
  ]);
  res.status(200).json(global.strings[req.lan]["200"].channel.MODERATOR);
});

exports.removeModerator = asyncHandler(async (req, res, _) => {
  const [channel, target] = await Promise.all([
    Channel.findOne({ name: decodeURIComponent(req.params.channel) }),
    User.findOne({ username: req.params.user }),
  ]);
  if (!channel.isOwner(req.user)) {
    throw new RequestError("401", "channel", "NOT_OWNER");
  }
  if (!channel.isMod(target)) {
    throw new RequestError("409", "channel", "NOT_MODERATOR");
  }
  await Promise.all([
    await channel.updateOne({ $pull: { moderators: target._id } }),
    ChannelUser.updateOne(
      { channel: channel._id, user: target._id },
      {
        status: "member",
      },
    ),
  ]);
  res.status(200).json(global.strings[req.lan]["200"].channel.NOT_MODERATOR);
});

exports.banUser = asyncHandler(async (req, res, _) => {
  const [channel, target] = await Promise.all([
    Channel.findOne({ name: decodeURIComponent(req.params.channel) }),
    User.findOne({ username: req.params.user }),
  ]);
  const promises = [];
  if (!channel.isOwner(req.user) && !channel.isMod(req.user)) {
    throw new RequestError("403", "user", "AUTHORIZATION");
  }
  if (channel.isBanned(target)) throw new RequestError("409", "user", "BAN");
  if (channel.isOwner(target)) {
    throw new RequestError("403", "channel", "BAN_OWNER");
  }
  if (!channel.isOwner(req.user) && channel.isMod(target)) {
    throw new RequestError("403", "channel", "BAN_MOD");
  }
  if (target.role === "mod") {
    throw new RequestError("403", "channel", "BAN_ADMIN");
  }
  promises.push(channel.banUser(target), channel.deleteMember(target));
  if (channel.isMod(target)) promises.push(channel.removeMod(target));
  await Promise.all(promises);
  res.status(200).json(global.strings[req.lan]["200"].channel.BAN);
});

exports.unbanUser = asyncHandler(async (req, res, _) => {
  const [channel, target] = await Promise.all([
    Channel.findOne({ name: decodeURIComponent(req.params.channel) }),
    User.findOne({ username: req.params.user }),
  ]);
  if (!channel.isOwner(req.user) && !channel.isMod(req.user)) {
    throw new RequestError("403", "user", "AUTHORIZATION");
  }
  if (!channel.isBanned(target)) {
    throw new RequestError("409", "channel", "NOT_BANNED");
  }
  await channel.unbanUser(target);
  res.status(200).json(global.strings[req.lan]["200"].channel.UNBAN);
});

exports.getBanned = asyncHandler(async (req, res, _) => {
  res.status(200).json(
    await Channel.findOne({ name: decodeURIComponent(req.params.channel) }).populate({
      path: "banlist",
      select: "username",
    }),
  );
});

exports.joinChannel = asyncHandler(async (req, res, _) => {
  const channel = await Channel.findOne({ name: decodeURIComponent(req.params.channel) });
  if (!channel) throw new RequestError("404", "channel", "CHANNEL");
  if (channel.isBanned(req.user)) {
    throw new RequestError("401", "channel", "BANNED");
  }
  if (await channel.isMember(req.user)) {
    throw new RequestError("409", "channel", "MEMBER");
  }
  if (await channel.isWaiting(req.user)) {
    throw new RequestError("409", "channel", "WAITING");
  }
  if (!channel.isPublic()) {
    await channel.add2W8ingList(req.user);
    return res.status(200).json(global.strings[req.lan]["200"].channel.WAITING);
  }
  await channel.addMember(req.user);
  return res.status(200).json(global.strings[req.lan]["200"].channel.JOINED);
});

exports.getW8ingList = asyncHandler(async (req, res, _) => {
  const channel = await Channel.findOne({ name: decodeURIComponent(req.params.channel) });
  if (!channel) throw new RequestError("404", "channel", "CHANNEL");
  if (!channel.isOwner(req.user) && !channel.isMod(req.user)) {
    throw new RequestError("403", "user", "AUTHORIZATION");
  }
  if (channel.isPublic()) throw new RequestError("400", "channel", "PRIVATE");
  const w8ingUsers = await ChannelUser.find({
    channel: channel._id,
    status: "waiting",
  })
    .sort({ _id: "asc" })
    .skip(((req.query.page || 1) - 1) * global.data.searches.CHUNKSIZE)
    .limit(global.data.searches.CHUNKSIZE)
    .populate("user");
  return res.status(200).json(w8ingUsers);
});

exports.acceptUser = asyncHandler(async (req, res, _) => {
  const [channel, user] = await Promise.all([
    Channel.findOne({ name: decodeURIComponent(req.params.channel) }),
    User.findOne({ username: req.params.user }),
  ]);
  if (!channel) throw new RequestError("404", "channel", "CHANNEL");
  if (!channel.isOwner(req.user) && !channel.isMod(req.user)) {
    throw new RequestError("403", "user", "AUTHORIZATION");
  }
  if (channel.isPublic()) throw new RequestError("400", "channel", "PRIVATE");
  const request = await ChannelUser.findOne({
    channel: channel._id,
    user: user._id,
  });
  if (!request) throw new RequestError("404", "channel", "WAITING");
  if (request.status !== "waiting") {
    throw new RequestError("409", "channel", "NOT_WAITING");
  }
  await request.updateOne({ status: "member" });
  return res
    .status(200)
    .json({ response: global.strings[req.lan]["200"].channel.MEMBER });
});

exports.rejectUser = asyncHandler(async (req, res, _) => {
  const [channel, user] = await Promise.all([
    Channel.findOne({ name: decodeURIComponent(req.params.channel) }),
    User.findOne({ username: req.params.user }),
  ]);
  if (!channel) throw new RequestError("404", "channel", "CHANNEL");
  if (!channel.isOwner(req.user) && !channel.isMod(req.user)) {
    throw new RequestError("403", "user", "AUTHORIZATION");
  }
  if (channel.isPublic()) throw new RequestError("400", "channel", "PRIVATE");
  const request = await ChannelUser.findOne({
    channel: channel._id,
    user: user._id,
  });
  if (!request) throw new RequestError("404", "channel", "WAITING");
  if (request.status !== "waiting") {
    throw new RequestError("409", "channel", "NOT_WAITING");
  }
  await request.deleteOne();
  return res
    .status(200)
    .json({ response: global.strings[req.lan]["200"].channel.REJECT });
});

exports.leaveChannel = asyncHandler(async (req, res, _) => {
  const channel = await Channel.findOne({
    name: decodeURIComponent(req.params.channe),
  }).populate("moderators");
  if (!channel) throw new RequestError("404", "channel", "CHANNEL");
  if (channel.isOwner(req.user)) {
    if (!channel) throw new RequestError("404", "channel", "CHANNEL");
    const moderators = channel.moderators.map((mod) => mod.username);
    if (moderators.length > 0) {
      const user = await User.findOne({ username: moderators[0] });
      await ChannelUser.deleteOne({
        channel: channel._id,
        user: req.user._id,
      });

      await channel.removeMod(user);
      await ChannelUser.updateOne(
        { channel: channel._id, user: user._id },
        {
          status: "owner",
        },
      );
      await channel.updateOne({
        $set: { owner: user._id },
      });
      return res.status(200).json(global.strings[req.lan]["200"].channel.LEAVE);
    } else throw new RequestError("401", "channel", "OWNER_LEAVE");
  }
  if (!(await channel.isMember(req.user))) {
    throw new RequestError("409", "channel", "NOT_MEMBER");
  }
  await ChannelUser.deleteOne({ channel: channel._id, user: req.user._id });
  return res.status(200).json(global.strings[req.lan]["200"].channel.LEAVE);
});

exports.leaveW8ingList = asyncHandler(async (req, res, _) => {
  const channel = await Channel.findOne({ name: decodeURIComponent(req.params.channel) });
  if (!channel) throw new RequestError("404", "channel", "CHANNEL");
  if (channel.isPublic()) throw new RequestError("400", "channel", "PRIVATE");
  const request = await ChannelUser.findOne({
    channel: channel._id,
    user: req.user._id,
  });
  if (!request || request.status !== "waiting") {
    throw new RequestError("409", "channel", "NOT_WAITING");
  }
  await request.deleteOne();
  return res
    .status(200)
    .json({ response: global.strings[req.lan]["200"].channel.NOT_WAIT });
});

exports.removeMember = asyncHandler(async (req, res, _) => {
  const [channel, target] = await Promise.all([
    Channel.findOne({ name: decodeURIComponent(req.params.channel) }),
    User.findOne({ username: req.params.user }),
  ]);
  if (!channel) throw new RequestError("404", "channel", "CHANNEL");
  if (!target) throw new RequestError("404", "user", "USER");
  if (!channel.isOwner(req.user) && !channel.isMod(req.user)) {
    throw new RequestError("403", "user", "AUTHORIZATION");
  }
  if (!(await channel.isMember(target))) {
    throw new RequestError("409", "channel", "NOT_MEMBER");
  }
  if (channel.isOwner(target)) {
    throw new RequestError("403", "channel", "REMOVE_OWNER");
  }
  if (channel.isMod(req.user) && channel.isMod(target)) {
    throw new RequestError("403", "user", "AUTHORIZATION");
  }
  await ChannelUser.deleteOne({ channel: channel._id, user: target._id });
  return res
    .status(200)
    .json(global.strings[req.lan]["200"].channel.REMOVE_USER);
});

exports.isMember = asyncHandler(async (req, res, _) => {
  const [channel, target] = await Promise.all([
    Channel.findOne({ name: decodeURIComponent(req.params.channel) }),
    User.findOne({ username: req.params.user }),
  ]);
  if (!channel) throw new RequestError("404", "channel", "CHANNEL");
  if (!target) throw new RequestError("404", "user", "USER");
  if (!channel.isReadableBy(req.user)) {
    throw new RequestError("403", "user", "AUTHORIZATION");
  }
  const cu = await ChannelUser.findOne({
    channel: channel._id,
    user: target._id,
    status: { $ne: "waiting" },
  });
  return res.status(200).json({ response: cu ? cu.status : false });
});

exports.deleteChannel = asyncHandler(async (req, res, _) => {
  const channel = await Channel.findOne({ name: decodeURIComponent(req.params.channel) });
  if (!channel) throw new RequestError("404", "channel", "CHANNEL");
  if (!channel.isOwner(req.user)) {
    throw new RequestError("401", "channel", "NOT_OWNER");
  }
  await deleteRefs(`!c!${channel.name}!!`);
  await channel.delete();
  return res
    .status(200)
    .json(global.strings[req.lan]["200"].channel.DELETE_CHANNEL);
});

exports.editChannel = asyncHandler(async (req, res, _) => {
  const channel = await Channel.findOne({ name: decodeURIComponent(req.params.channel) });
  if (!channel) throw new RequestError("404", "channel", "CHANNEL");
  if (!channel.isOwner(req.user)) {
    throw new RequestError("401", "channel", "NOT_OWNER");
  }
  const props = {};
  for (field in req.body) {
    if (editable.includes(field)) props[field] = req.body[field];
  }
  if (Object.keys(props).includes("name")) {
    if (!new RegExp(global.data.patterns.channel).test(props.name)) {
      throw new RequestError("400", "channel", "NAME");
    }
    if (await Channel.findOne({ name: props.name })) {
      throw new RequestError("409", "channel", "NAME");
    }
    await editRefs(`!c!${channel.name}!!`, `!c!${req.body.name}!!`);
    if (!channel.official) props["query"] = `channel=${req.body.name}`;
  }
  if (
    Object.keys(props).includes("description") &&
    !new RegExp(global.data.patterns.description).test(props.description)
  ) {
    throw new RequestError("400", "channel", "DESCRIPTION");
  }
  if (Object.keys(props).includes("privacy")) {
    if (!Channel.schema.path("privacy").enumValues.includes(props.privacy)) {
      throw new RequestError("400", "channel", "BAD_PRIVACY");
    }
    if (props.privacy === "public") {
      await ChannelUser.updateMany(
        { channel: channel._id, status: "waiting" },
        { $set: { status: "member" } },
      );
    }
  }
  await channel.updateOne({ $set: props });
  return res.status(200).json(global.strings[req.lan]["200"].channel.EDIT);
});

const getPostWithImage = async (channel) => {
    const post = await Post.find({
      channel: channel._id,
      contentType: "image",
    }).sort({ _id: "desc" }).limit(1);
    return post ? post[0] : null
};

exports.getChannelPicturePreview = asyncHandler(async (req, res, _) => {
  const channel = await Channel.findOne({ name: decodeURIComponent(req.params.channel) });
  const newTemporary = req.params.channel.startsWith("#")
  if (!channel && !newTemporary) throw new RequestError("404", "channel", "CHANNEL");
  if (!newTemporary && !(channel?.isReadableBy(req.user))) {
    throw new RequestError("403", "user", "AUTHORIZATION");
  }
  let file = path.join(global.data.uploads.channels.path, "small", "default.jpg");
  if (channel?.temporary) {
    const post = await getPostWithImage(channel);
    file = post ? path.join(global.data.uploads.posts.path, post.filename) : null;
  }
  file =
    file ||
      path.join(global.data.uploads.channels.path, "small", channel?.picture);
  return res.sendFile(path.join(file));
});

exports.getChannelPicture = asyncHandler(async (req, res, _) => {
  const channel = await Channel.findOne({ name: decodeURIComponent(req.params.channel) });
  if (!channel) throw new RequestError("404", "channel", "CHANNEL");
  if (!channel.isReadableBy(req.user)) {
    throw new RequestError("403", "user", "AUTHORIZATION");
  }
  let file = null;
  if (channel.temporary) {
    const post = await getPostWithImage(channel);
    file = post ? path.join(global.data.uploads.posts.path, post.filename) : null;
  }
  file =
    file ||
    path.join(global.data.uploads.channels.path, "big", channel.picture);
  return res.sendFile(path.join(file));
});

exports.editChannelPicture = asyncHandler(async (req, res, _) => {
  if (!req.file) throw new RequestError("404", "file", "FILE");
  if (req.body.error) throw req.body.error;
  const channel = await Channel.findOne({ name: decodeURIComponent(req.params.channel) });
  if (!channel) throw new RequestError("404", "channel", "CHANNEL");
  if (!channel.isOwner(req.user)) {
    throw new RequestError("401", "channel", "NOT_OWNER");
  }
  await adjustImage(
    req.file,
    `${global.data.uploads.channels.path}/big/${req.file.filename}`,
    ...global.data.uploads.image.big,
  );
  await adjustImage(
    req.file,
    `${global.data.uploads.channels.path}/small/${req.file.filename}`,
    ...global.data.uploads.image.small,
  );
  await fse.remove(req.file.path);
  if (channel.picture !== global.data.uploads.channels.default) {
    await fse.remove(
      `${global.data.uploads.channels.path}/big/${channel.picture}`,
    );
    await fse.remove(
      `${global.data.uploads.channels.path}/small/${channel.picture}`,
    );
  }
  await channel.updateOne({ picture: req.file.filename });
  return res
    .status(200)
    .json({ response: global.strings[req.lan]["200"].channel.PICTURE });
});

exports.deleteChannelPicture = asyncHandler(async (req, res, _) => {
  const channel = await Channel.findOne({ name: decodeURIComponent(req.params.channel) });
  if (!channel) throw new RequestError("404", "channel", "CHANNEL");
  if (channel.picture !== global.data.uploads.channels.default) {
    await Promise.all([
      fse.remove(
        `${global.data.uploads.channels.path}/small/${channel.picture}`,
      ),
      fse.remove(`${global.data.uploads.channels.path}/big/${channel.picture}`),
    ]);
  }
  await channel.updateOne({ picture: global.data.uploads.channels.default });
  return res.status(200).json({
    response: global.strings[req.lan]["400"].user.DELETE_PROPIC,
  });
});

exports.getChannelModerators = asyncHandler(async (req, res, _) => {
  const channel = await Channel.findOne({
    name: decodeURIComponent(req.params.channel),
  }).populate("moderators");
  if (!channel) throw new RequestError("404", "channel", "CHANNEL");
  const moderators = channel.moderators.map((mod) => mod.username);
  return res.status(200).json({ moderators });
});
