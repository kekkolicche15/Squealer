const express = require("express");
const router = express.Router();
const SmmController = require("./controller");
const PostController = require(`${global.dirs.apps.be.post}/controller`);
const Auth = require(`${global.dirs.libraries}/auth`);
const path = require("path");
const multer = require("multer");
const { uploadPostAttachment } = require(`${global.dirs.libraries}/utils`);
const UserController = require(`${global.dirs.apps.be.user}/controller`);

router
  .route("/")
  .get(SmmController.searchSmm) //get list of smm sorted by
  .patch(
    Auth.checkRole(global.roles.smm),
    SmmController.editSmm,
  ) //edit smm, pagamento?
    .post(SmmController.becomeSmm) //let a vip become smm, pagamento?
  .delete(
    Auth.checkRole(global.roles.smm),
    SmmController.ceaseSmm,
  ); //let not become smm -> deleting all relationship, if less than a month pay
router
  .route("/:smm/waiting-list/")
    .get(Auth.checkRole(global.roles.smm), SmmController.getW8ingList) // get list of pending vips
    .post(SmmController.sendW8ingList) // send a request for smm to accept, paying monthly
    .delete(SmmController.leaveW8ingList); // withdraw a request for smm to accept, paying monthly

router.get(
  "/managed-vips/",
  Auth.checkRole(global.roles.smm),
  SmmController.getManagedVips,
); // get list of managed vips

router
  .route("/managed-vips/:vip")
    .post(Auth.checkRole(global.roles.smm), SmmController.acceptVip) // accept request
    .delete(Auth.checkRole(global.roles.smm), SmmController.rejectVip); // reject proposal

router
  .route("/manager/:user?")
    .get(SmmController.getManager)
    .delete(SmmController.deleteManager);

router
  .route("/:smm/reviews/")
  .get(SmmController.getReviews)
    .post(SmmController.createReview);

router.patch("/:vip/buy/quota", UserController.buyQuota);
router.patch("/:vip/buy/score", UserController.buyScore);

router
  .route("/:vip?/post/")
    .get(PostController.searchPosts)
    .post(uploadPostAttachment.single("attachment"), PostController.createPost);

router.delete("/:vip?/post/:post", PostController.deletePost);

router.get("/:vip?/post/:post/attachment", PostController.getAttachment);

//i moderatori per visualizzare una risposta non ha bisogno di chiarire l'utente, perche ci accede con il canale del suo vip
router
  .route("/:vip?/post/:post/replies/")
    .get(PostController.getReplies)
    .post(uploadPostAttachment.single("attachment"), PostController.createReply);

router.get("/:vip/post/reactions/", PostController.searchReaction);

router
  .route("/:vip?/post/:post/reactions/:user?/")
    .post(PostController.createPostReaction)
    .patch(PostController.updatePostReaction)
    .delete(PostController.deletePostReaction);

router.get("/:id", SmmController.searchSmmById);

// cosa modificare? getInfo, postcreate, replycreate, searchReactions e altro per bloccare accesso a queste funzionalita' da parte di utenti normali
module.exports = router;
