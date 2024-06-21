const asyncHandler = require("express-async-handler");
const User = require(`${global.dirs.apps.be.user}/model`);
const Follow = require("./model");
const Block = require(`${global.dirs.apps.be.block}/model`);
const { RequestError } = require(`${global.dirs.libraries}/utils`);
const Notification = require(`${global.dirs.apps.be.notification}/model`);

exports.getFollowerOf = asyncHandler(async (req, res, _) => {
  const user = req.params.user
    ? await User.findOne({ username: req.params.user })
    : req.user;
  return res
    .status(200)
    .json({ response: await Follow.getFollowers(user, req.query.page) });
});

exports.getFollowedBy = asyncHandler(async (req, res, _) => {
  const user = req.params.user
    ? await User.findOne({ username: req.params.user })
    : req.user;
  return res
    .status(200)
    .json({ response: await Follow.getFollowed(user, req.query.page) });
});

exports.isFollowerOf = asyncHandler(async (req, res, _) => {
  const follower = req.params.follower
    ? await User.findOne({ username: req.params.follower })
    : req.user;
  const followed = req.params.followed
    ? await User.findOne({ username: req.params.followed })
    : req.user;
  return res
    .status(200)
    .json({ response: await Follow.isFollowing(follower, followed) });
});

exports.followUser = asyncHandler(async (req, res, _) => {
  const followed = await User.findOne({
    username: req.params.user,
  });
  if (req.user.equals(followed)) {
    throw new RequestError(409, "follow", "SELF");
  }
  if (await Block.hasBlocked(req.user, followed)) {
    throw new RequestError(409, "follow", "BLOCK");
  }
  if (await Block.hasBlocked(followed, req.user)) {
    throw new RequestError(409, "follow", "BLOCKED");
  }
  if (await Follow.isFollowing(req.user, followed)) {
    throw new RequestError(409, "follow", "FOLLOWED");
  }
  await Follow.follow(req.user, followed);
  return res.status(200).json(global.strings[req.lan]["200"].follow.FOLLOW);
});

exports.unfollowUser = asyncHandler(async (req, res, _) => {
  const user = await User.findOne({
    username: req.params.user,
  });
  const [follower, followed] =
    req.params.self === "self" ? [user, req.user] : [req.user, user];
  if (!(await Follow.isFollowing(follower, followed))) {
    throw new RequestError(409, "follow", "NOT_FOLLOWED");
  }
  await Follow.unfollow(follower, followed);
  //se tu unfollowi una persona ed eravate amici piu' stretti, questo legame si elimina
  await Notification.removeNotificationOrFriendship(follower, followed);
  return res.status(200).json(global.strings[req.lan]["200"].follow.UNFOLLOW);
});
