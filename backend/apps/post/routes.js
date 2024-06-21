const express = require("express");
const router = express.Router();

const PostController = require("./controller");
const Auth = require(`${global.dirs.libraries}/auth`);
const { uploadPostAttachment } = require(`${global.dirs.libraries}/utils`);

router
  .route("/reactions/")
  .get(Auth.requireToken, PostController.searchReaction);

router
  .route("/")
  .get(Auth.optionalToken, PostController.searchPosts)
  .post(
    Auth.requireToken,
    uploadPostAttachment.single("attachment"),
    PostController.createPost,
  );

router.delete("/:post", Auth.requireToken, PostController.deletePost);

router.get("/:post", Auth.optionalToken, PostController.getPost);
router.get("/:post/attachment", Auth.optionalToken, PostController.getAttachment);

//i moderatori per visualizzare una risposta non ha bisogno di chiarire l'utente, perche ci accede con il canale del suo vip
router
  .route("/:post/replies/")
  .get(Auth.optionalToken, PostController.getReplies)
  .post(
    Auth.requireToken,
    uploadPostAttachment.single("attachment"),
    PostController.createReply,
  );

router
  .route("/:post/reactions/:user?/")
  .get(Auth.requireToken, PostController.getPostReaction)
  .post(Auth.requireToken, PostController.createPostReaction)
  .patch(Auth.requireToken, PostController.updatePostReaction)
  .delete(Auth.requireToken, PostController.deletePostReaction);

module.exports = router;
