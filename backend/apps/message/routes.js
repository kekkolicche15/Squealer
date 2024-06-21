const express = require("express");
const router = express.Router();

const MessageController = require("./controller");
const Auth = require(`${global.dirs.libraries}/auth`);
const { uploadMessageAttachment } = require(`${global.dirs.libraries}/utils`);

router.get("/chats", Auth.requireToken, MessageController.getAllChats);

router.route("/:utente").get(Auth.requireToken, MessageController.getChat);

router.get("/:utente/lastPage",
  Auth.optionalToken,
  MessageController.getLastPage,
);

router.get("/:message/attachment",
  Auth.optionalToken,
  MessageController.getAttachment,
);


module.exports = router;
