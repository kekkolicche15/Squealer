const asyncHandler = require("express-async-handler");
const { RequestError } = require(`${global.dirs.libraries}/utils`);
const User = require(`${global.dirs.apps.be.user}/model`);
const Notification = require("./model");
const Follow = require(`${global.dirs.apps.be.follow}/model`);

exports.sendNotification = asyncHandler(async (req, res, next) => {
  const msg = req.body.msg;
  if (!msg || !req.params.utente) {
    throw new RequestError(400, "format", "BAD_FORMAT");
  }

  const sender = req.user;

  const receiver = await User.findOne({
    username: req.params.utente,
  });

  if (
    !(await Follow.isFollowing(sender, receiver)) ||
    !(await Follow.isFollowing(receiver, sender))
  ) {
    //vi dovete seguire a vicenda
    throw new RequestError(403, "notification", "FOLLOW");
  }

  if (sender.username === receiver.username) {
    //non puoi inviare notifiche a te stesso
    throw new RequestError(409, "notification", "SELF");
  }

  const notification1 = await Notification.findOne({
    sender: sender,
    receiver: receiver,
  });
  const notification2 = await Notification.findOne({
    sender: receiver,
    receiver: sender,
  });

  if (notification1 || notification2) {
    //siete gia' amici piu' stretti
    if (
      notification1?.type === "fulfilled" ||
      notification2?.type === "fulfilled"
    ) {
      throw new RequestError(409, "notification", "ALREADY_CLOSE_FRIENDS");
    } else if (
      notification1?.type === "PendingRequest" ||
      notification2?.type === "PendingRequest"
    ) {
      throw new RequestError(409, "notification", "ALREADY_SENT");
    }
  }

  Notification.create({
    sender: sender,
    receiver: receiver,
    type: "PendingRequest",
    content: msg,
  });

  return res.status(200).json({
    response: global.strings[req.lan]["201"]["notification"]["SENDED"],
  });
});

exports.acceptRequest = asyncHandler(async (req, res, next) => {
  if (!req.params.utente) {
    throw new RequestError(404, "notification", "USER");
  }

  const sender = await User.findOne({
    username: req.params.utente,
  });

  const notification = await Notification.findOne({
    sender: sender,
    receiver: req.user,
  });

  if (!notification) {
    //non ci sono notifiche in sospeso da accettare
    throw new RequestError(409, "notification", "NO_PENDING");
  }

  const update = {
    $set: { type: "fulfilled", areClosedFriends: true },
  };

  await Notification.updateOne(
    {
      sender: sender,
      receiver: req.user,
    },
    update
  );

  return res.status(200).json({
    response: global.strings[req.lan]["200"]["notification"]["CREATED"],
  });
});

exports.removeNotificationOrFriendship = asyncHandler(
  async (req, res, next) => {
    if (!req.params.utente) {
      throw new RequestError(404, "notification", "USER");
    }

    const sender = await User.findOne({
      username: req.params.utente,
    });
    const receiver = req.user;


    await Notification.removeNotificationOrFriendship(sender, receiver, req.query.content);

    return res.status(200).json({ response: "fatto" });
  }
);

exports.deleteAll = asyncHandler(async (req, res, next) => {
  const receiver = req.user;

  const risultato = await Notification.deleteMany({
    receiver: receiver,
  });

 

  return res.status(200).json({ response: "fatto" });
});

exports.getPendingNotifications = asyncHandler(async (req, res, _) => {
  const risultato = await Notification.find({
    type: { $in: ["PendingRequest", "mention"] },
    receiver: req.user,
  })
    .populate("sender", { username: 1 })
    .select("content receiver relatedPost")
    .sort({ sendedAt: -1 })
    .skip(((req.body.page || 1) - 1) * global.data.searches.CHUNKSIZE)
    .limit(global.data.searches.CHUNKSIZE);
  if (!risultato) throw new RequestError(409, "notification", "NO_PENDING");

  return res.status(200).json(risultato);
});

exports.check = asyncHandler(async (req, res, _) => {
  const sender = await User.findOne({
    username: req.params.utente,
  });

  if (!sender) throw new RequestError(404, "notification", "USER");

  const receiver = req.user;

  if (sender.username === receiver.username) {
    throw new RequestError(409, "notification", "SELF");
  }

  const risultato = await Notification.checkAreFriends(sender, receiver);

  if (risultato) {
    return res.status(200).json({ response: risultato.areClosedFriends });
  } else {
    return res.status(200).json({
      response: false,
    });
  }
});

exports.getCloseFriends = asyncHandler(async (req, res, _) => {
  const result = await Notification.find({ type: "fulfilled" })
    .populate("sender receiver", { username: 1 })
    .select("areClosedFriends");

  const finalResult = result.map((el) => {
    if (el.sender.username !== req.user.username) {
      return {
        friend: el.sender,
      };
    } else {
      return {
        friend: el.receiver,
      };
    }
  });

  return res.status(200).json(finalResult);
});
