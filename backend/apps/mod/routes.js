const express = require("express");
const router = express.Router();
const ModController = require("./controller");
const { uploadChannelPicture } = require(`${global.dirs.libraries}/utils`);
const UserController = require(`${global.dirs.apps.be.user}/controller`);
const ChannelController = require(`${global.dirs.apps.be.channel}/controller`);
const PostController = require(`${global.dirs.apps.be.post}/controller`);

router
  .route("/user/:user")
  .delete(ModController.deleteUser)
  .patch(ModController.editUserInfo);
router.delete("/user/:user/picture", ModController.removeUserPicture);

router.post(`/channel`,
  uploadChannelPicture.single("image"),
  ModController.createOfficialChannel,
);
router
  .route("/channel/:channel")
  .patch(ModController.editChannelInfo)
  .delete(ModController.deleteChannel);
router.delete("/channel/:channel/picture", ModController.removeChannelPicture);

router.patch("/post/:post/views", ModController.editViews);
router.patch("/post/:post/reactions/", ModController.editPostReactions);
router.delete("/post/:post", ModController.deletePost);

router.get("/user", UserController.searchUsers);
router.get("/user/:user/info", UserController.getInfo);

router.get("/channel", ChannelController.searchChannels);
router.get("/channel/:channel", ChannelController.getChannel);

router.get("/post", PostController.searchPosts);

module.exports = router;
