const express = require("express");
const router = express.Router();

const Auth = require(`${global.dirs.libraries}/auth`);
const ChannelController = require("./controller");
const { uploadChannelPicture } = require(`${global.dirs.libraries}/utils`);

router
  .route("/")
  .post(
    Auth.requireToken,
    uploadChannelPicture.single("image"),
    ChannelController.createChannel,
  )
  .get(Auth.optionalToken, ChannelController.searchChannels);

router
  .route("/:channel")
  .get(Auth.optionalToken, ChannelController.getChannel)
  .patch(Auth.requireToken, ChannelController.editChannel)
  .delete(Auth.requireToken, ChannelController.deleteChannel);

router.get("/:channel/picture/preview",
  Auth.optionalToken,
  ChannelController.getChannelPicturePreview,
);
router
  .route("/:channel/picture")
  .get(Auth.optionalToken, ChannelController.getChannelPicture)
  .patch(
    Auth.requireToken,
    uploadChannelPicture.single("image"),
    ChannelController.editChannelPicture,
  )
  .delete(Auth.requireToken, ChannelController.deleteChannelPicture);

router.get("/:channel/members/", ChannelController.getChannelMembers);

router
  .route("/:channel/waiting/")
  .get(Auth.optionalToken, ChannelController.getW8ingList)
  .delete(Auth.requireToken, ChannelController.leaveW8ingList);

router
  .route("/:channel/waiting/:user")
  .post(Auth.requireToken, ChannelController.acceptUser)
  .delete(Auth.requireToken, ChannelController.rejectUser);

router
  .route("/:channel/moderators/:user")
  .post(Auth.requireToken, ChannelController.addModerator)
  .delete(Auth.requireToken, ChannelController.removeModerator);

router
  .route("/:channel/ban/:user")
  .post(Auth.requireToken, ChannelController.banUser)
  .delete(Auth.requireToken, ChannelController.unbanUser);

router.get("/:channel/banned/", Auth.requireToken, ChannelController.getBanned);

router.post("/:channel/join/",
  Auth.requireToken,
  ChannelController.joinChannel,
);

router.delete("/:channel/leave/",
  Auth.requireToken,
  ChannelController.leaveChannel,
);

router
  .route("/:channel/members/:user")
  .get(Auth.requireToken, ChannelController.isMember)
  .delete(Auth.requireToken, ChannelController.removeMember);

module.exports = router;
