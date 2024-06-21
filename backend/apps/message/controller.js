const asyncHandler = require("express-async-handler");
const Message = require("./model");
const { RequestError, generateFilename } = require(
  `${global.dirs.libraries}/utils`,
);
const User = require(`${global.dirs.apps.be.user}/model`);
const path = require("path");
const fse = require("fs-extra");

exports.createMessage = asyncHandler(async (req, res, _) => {
  let user1 = req.user;

  const user2 = await User.findOne({
    username: req.params.utente,
  });

  const contentType = req.file ? req.file.mimetype.split("/")[0] : "text";

  if ((!req.body.content && contentType === "text") || !contentType) {
    throw new RequestError(400, "format", "BAD_FORMAT");
  }
  if (!user2) {
    throw new RequestError(404, "message", "USER");
  }

  if (user1.username === user2.username) {
    throw new RequestError(409, "message", "SELF");
  }

  var filename;

  if (req.file) filename = path.basename(req.file.path);
  else filename = "";

  Message.create({
    sender: user1,
    receiver: user2,
    contentType: contentType,
    content: req.body.content || null,
    filename: filename,
  });

  return res
    .status(200)
    .json({ response: global.strings[req.lan]["201"].message.CREATE });
});

exports.getChat = asyncHandler(async (req, res, _) => {
  if (!req.params.utente) {
    throw new RequestError(400, "format", "BAD_FORMAT");
  }
  const sender = req.user;

  const receiver = await User.findOne({
    username: req.params.utente,
  });

  if (sender.username === receiver.username) {
    throw new RequestError(409, "message", "SELF");
  }

  const filter = {
    $or: [
      { sender: sender, receiver: receiver },
      { sender: receiver, receiver: sender },
    ],
  };
  var risultato = await Message.find(filter)
    .populate("sender", { username: 1 })
    .select("content createdAt contentType filename")
    .sort({ createdAt: 1 })
    .skip(((req.query.page || 1) - 1) * global.data.searches.CHUNKSIZE_MESSAGES)
    .limit(global.data.searches.CHUNKSIZE_MESSAGES)
    .lean();
  for (var i = 0; i < risultato.length; i++) {
    const day = String(risultato[i].createdAt.getDate()).padStart(2, "0");
    const month = String(risultato[i].createdAt.getMonth() + 1).padStart(
      2,
      "0",
    );
    const year = risultato[i].createdAt.getFullYear();
    const hours = String(risultato[i].createdAt.getHours()).padStart(2, "0");
    const minutes = String(risultato[i].createdAt.getMinutes()).padStart(
      2,
      "0",
    );
    const seconds = String(risultato[i].createdAt.getSeconds()).padStart(
      2,
      "0",
    );
    risultato[i]["date"] = `${day}/${month}/${year}`;
    risultato[i]["time"] = `${hours}:${minutes}:${seconds}`;
  }

  return res.status(200).json(risultato);
});
/*
exports.deleteMessage = asyncHandler(async (req, res, _) => {
    if (!req.params.message) {
        throw new RequestError(400, "format", "BAD_FORMAT");
    }
    const message = await Message.findOne({ _id: req.params.message });
    await fse.remove(
        `${global.data.uploads.messages.path}/${message.filename}`
    );

    await Message.deleteOne({ _id: req.params.message });

    return res.status(200).json(global.strings[req.lan]["200"].message.DELETED);
});
*/
exports.getAllChats = asyncHandler(async (req, res, _) => {
  const user = req.user;

  const users = await Message.distinct("sender", {
    receiver: user,
  }).exec();

  const senders = await Message.distinct("receiver", {
    sender: user,
  }).exec();

  let allUsers = [...users, ...senders];

  let usernames = [];
  for (const el of allUsers) {
    const user = await User.findById(el);
    usernames.push(user.username);
  }
  usernames.filter((el) => el !== user.username);
  const setUsers = [...new Set(usernames)];

  //const users = await Message.getUsers(user);
  const page = req.query.page || 1;
  const filter = req.query.name || "";

  var result = [];

  for (const username of setUsers) {
    const utente2 = await User.findOne({
      username: username,
    });

    result.push(await Message.lastMessage(user, utente2));
  }
  if (filter.length > 0) {
    //sort in base al nome
    var Filtered = result.filter((el) => {
      return el.utente.includes(filter);
    });
    result = Filtered;
  } else {
    //sort in base dando priorita' agli amici piu' stretti
    result.sort((a, b) => {
      if (b.areClosedFriends && !a.areClosedFriends) {
        return 1;
      } else if (a.areClosedFriends && !b.areClosedFriends) {
        return -1;
      } else return 0;
    });
  }

  //sistema di paging
  result = result.slice(
    (page - 1) * global.data.searches.CHUNKSIZE_ALLCHATS,
    global.data.searches.CHUNKSIZE_ALLCHATS * page,
  );

  return res.status(200).json(result);
});

exports.getAttachment = asyncHandler(async (req, res, _) => {
  const message = await Message.findById(req.params.message);
  return res.sendFile(
    path.join(global.data.uploads.messages.path, message.filename),
  );
});

exports.getLastPage = asyncHandler(async (req, res, _) => {
  if (!req.params.utente) {
    throw new RequestError(400, "format", "BAD_FORMAT");
  }
  const sender = req.user;

  const receiver = await User.findOne({
    username: req.params.utente,
  });

  if (sender.username === receiver.username) {
    throw new RequestError(409, "message", "SELF");
  }

  const filter = {
    $or: [
      { sender: sender, receiver: receiver },
      { sender: receiver, receiver: sender },
    ],
  };
  // global.data.searches.CHUNKSIZE_MESSAGES
  var risultato = await Message.find(filter)
    .populate("sender", { username: 1 })
    .select("content createdAt contentType filename")
    .sort({ createdAt: 1 })
    .lean();

  const numberPages = Math.ceil(
    risultato.length / global.data.searches.CHUNKSIZE_MESSAGES,
  );

  return res.status(200).json(numberPages);
});
