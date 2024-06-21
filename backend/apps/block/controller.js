const asyncHandler = require("express-async-handler");

const Block = require("./model");
const User = require(`${global.dirs.apps.be.user}/model`);
const Follow = require(`${global.dirs.apps.be.follow}/model`);
const { RequestError } = require(`${global.dirs.libraries}/utils`);
const Notification = require(`${global.dirs.apps.be.notification}/model`);

exports.getBlocked = asyncHandler(async (req, res, _) => {
  return res.status(200).json(await Block.getBlocked(req.user, req.query.page));
});

exports.isBlocked = asyncHandler(async (req, res, _) => {
  const user = await User.findOne({
    username: req.params.user,
  });
  if (!user) throw new RequestError("404", "user", "USER");
  return res
    .status(200)
    .json({ response: await Block.hasBlocked(user, req.user) });
});

exports.hasBlocked = asyncHandler(async (req, res, _) => {
  const user = await User.findOne({
    username: req.params.user,
  });
  if (!user) throw new RequestError("404", "user", "USER");
  return res
    .status(200)
    .json({ response: await Block.hasBlocked(req.user, user) });
});

exports.blockUser = asyncHandler(async (req, res, _) => {
  const blocked = await User.findOne({
    username: req.params.user,
  });
  if (!blocked) throw new RequestError("404", "user", "USER");
  if (req.user.equals(blocked)) throw new RequestError("409", "block", "SELF");
  if (await Block.hasBlocked(req.user, blocked)) {
    throw new RequestError("409", "block", "BLOCK");
  }
  if (await Follow.isFollowing(req.user, blocked)) {
    await Follow.unfollow(req.user, blocked);
  }
  if (await Follow.isFollowing(blocked, req.user)) {
    await Follow.unfollow(blocked, req.user);
  }

  await Notification.removeNotificationOrFriendship(blocked, req.user);

  await Block.block(req.user, blocked);
  return res.status(200).json(global.strings[req.lan]["200"].block.BLOCK);
});

exports.unblockUser = asyncHandler(async (req, res, _) => {
  const blocked = await User.findOne({
    username: req.params.user,
  });
  if (!blocked) throw new RequestError("404", "user", "USER");
  if (!(await Block.hasBlocked(req.user, blocked))) {
    throw new RequestError("409", "block", "UNBLOCK");
  }
  await Block.unblock(req.user, blocked);
  return res.status(200).json(global.strings[req.lan]["200"].block.UNBLOCK);
});
