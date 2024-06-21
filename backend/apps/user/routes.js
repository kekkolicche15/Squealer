const express = require("express");
const router = express.Router();

const UserController = require("./controller");
const FollowController = require(`${global.dirs.apps.be.follow}/controller`);
const BlockController = require(`${global.dirs.apps.be.block}/controller`);
const Auth = require(`${global.dirs.libraries}/auth`);

const { uploadUserPicture } = require(`${global.dirs.libraries}/utils`);

router
  .route("/")
  .get(Auth.optionalToken, UserController.searchUsers)
  .post(uploadUserPicture.single("image"), UserController.createUser)
  .delete(Auth.requireToken, UserController.deleteUser);

router
  .route("/quotaExtra")
  .get(Auth.requireToken, UserController.getDebt)
  .post(Auth.requireToken, UserController.changeStateDebt);

router.get("/:user?/info", Auth.optionalToken, UserController.getInfo);

router.get("/:user?/picture/preview", Auth.optionalToken, UserController.getUserPicturePreview);
router.get("/:user?/picture", Auth.optionalToken, UserController.getUserPicture);

router.get("/reset/:email/", UserController.requestPwdReset);
router.post("/reset/", UserController.performPwdReset);

router
  .route("/edit/pic")
  .patch(
    Auth.requireToken,
    uploadUserPicture.single("image"),
    UserController.editUserPicture,
  )
  .delete(Auth.requireToken, UserController.deleteUserPicture);

router.patch("/edit", Auth.requireToken, UserController.editUser);

router
  .route("/session")
  .post(UserController.login)
  .patch(UserController.genAuthToken)
  .delete(Auth.requireToken, UserController.logout);

router.get("/:user?/channels/joined/", Auth.optionalToken, UserController.getChannels);

router.get("/channels/waited/", Auth.optionalToken, UserController.getW8edChannels);

router.get("/:user?/channels/owned/", Auth.optionalToken, UserController.getOwnedChannels);

router.get("/:user?/channels/moderated?", Auth.optionalToken, UserController.getModeratedChannels);

router.get("/blocked/", Auth.optionalToken, BlockController.getBlocked);

router.get("/hasblocked/:user", Auth.optionalToken, BlockController.hasBlocked);

router.get("/isblocked/:user", Auth.optionalToken ,BlockController.isBlocked);

router
  .route("/block/:user")
  .post(Auth.requireToken, BlockController.blockUser)
  .delete(Auth.requireToken, BlockController.unblockUser);

router.get("/:user?/followers",
  Auth.optionalToken,
  FollowController.getFollowerOf,
);

router.get("/:user?/followed/",
  Auth.optionalToken,
  FollowController.getFollowedBy,
);

router.get("/:follower/isfollowing/:followed", Auth.optionalToken, FollowController.isFollowerOf);

router.post("/follow/:user", Auth.requireToken, FollowController.followUser);

router.delete("/follow/:user/:self?",
  Auth.requireToken,
  FollowController.unfollowUser,
);

router.patch("/buy/quota", Auth.requireToken, UserController.buyQuota);
router.patch("/buy/score", Auth.requireToken, UserController.buyScore);

router
  .route("/buy/vip")
  .post(Auth.requireToken, UserController.becomeVip)
  .delete(
    Auth.requireToken,
    Auth.checkRole(global.roles.vip),
    UserController.ceaseVip,
  );

module.exports = router;
