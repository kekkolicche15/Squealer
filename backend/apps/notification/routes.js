const express = require("express");
const router = express.Router();

const NotificationController = require("./controller");
const Auth = require(`${global.dirs.libraries}/auth`);

router.delete("/", Auth.requireToken, NotificationController.deleteAll);

//in body gli metti in page il numero della pagina
router.get("/pending",
  Auth.optionalToken,
  NotificationController.getPendingNotifications,
);

router.get("/closeFriends",
  Auth.optionalToken,
  NotificationController.getCloseFriends,
);

router
  .route("/:utente")
  .post(Auth.requireToken, NotificationController.sendNotification)
  .patch(Auth.optionalToken, NotificationController.acceptRequest)
  .delete(
    //rimuove la notifica e quindi anche un rapporto di closeFriends se e' presente una notifica fulfilled
    Auth.requireToken,
    NotificationController.removeNotificationOrFriendship,
  )
  .get(
    //controlla se sei amico con utente
    Auth.optionalToken,
    NotificationController.check,
  );

module.exports = router;
