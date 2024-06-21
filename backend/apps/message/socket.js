const Message = require("./model");
const User = require(`${global.dirs.apps.be.user}/model`);
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const fse = require("fs-extra");
const path = require("path");

chats = {};

const getPageFromIdx = (idx) => {
  const adjIdx = idx + 1;
  const base = Math.ceil(adjIdx / global.data.searches.CHUNKSIZE_MESSAGES);
  return base;
};

exports.handler = async (socket) => {
  await socket.on("authenticate", async (tokenJSON) => {
    const token = tokenJSON.token;
    const tokenInfo = await jwt.verify(token, global.data.jwt.access);
    const user = await User.findOne({ _id: tokenInfo._id });
    if (
      (!user.banned || user.banned <= new Date()) &&
      crypto.createHash("SHA-1").update(user.refreshToken).digest("hex") ===
        tokenInfo.ref
    )
      chats[user._id] = socket;
  });

  // Ricevi un nuovo messaggio e salvalo nel database
  await socket.on("chat message", async (message) => {
    const senderId = (await User.findOne({ username: message.sender }))._id;
    const receiverId = (await User.findOne({ username: message.receiver }))._id;
    const messageData = {
      sender: senderId,
      receiver: receiverId,
      content: message.body.content,
    };
    if (message.body.attachment) {
      const OK_EXT = [
        "apng",
        "avif",
        "gif",
        "jpg",
        "jpeg",
        "png",
        "svg",
        "webp",
        "mp4",
      ];
      if (!OK_EXT.includes(message.body.ext.toLowerCase())) {
        await socket.emit("error message", "tipo non valido");
        return;
      }
      if (message.body.attachment.length > 1048576) {
        await socket.emit("error message", "allegato troppo grande");
        return;
      }
      const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${
        message.body.ext
      }`;
      await fse.writeFile(
        path.join(global.data.uploads.messages.path, filename),
        message.body.attachment,
      );
      messageData.contentType = message.body.ext === "mp4" ? "video" : "image";
      messageData.filename = filename;
    }
    await new Message(messageData).save();
    var risultato = await Message.find({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
    });
    const promises = [
      chats[senderId].emit("reload chat", getPageFromIdx(risultato.length - 1)),
    ];
    if (chats[receiverId])
      promises.push(
        chats[receiverId].emit(
          "reload chat",
          getPageFromIdx(risultato.length - 1),
        ),
      );
    await Promise.all(promises);
  });

  await socket.on("delete message", async (message) => {
    const mes2delete = await Message.findById(message._id);
    const senderId = (await User.findOne({ username: message.sender }))._id;
    const receiverId = (await User.findOne({ username: message.receiver }))._id;

    if (mes2delete.sender.toString() !== senderId.toString()) {
      throw new RequestError(409, "message", "NOT_YOUR_MESSAGE");
    }
    const messages = await Message.find({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
    });
    for (let idx = 0; idx < messages.length; idx++) {
      if (messages[idx]._id == message._id) {
        const promises = [
          messages[idx].delete(),
          chats[senderId].emit("reload chat", getPageFromIdx(idx)),
        ];
        if (chats[receiverId])
          promises.push(
            chats[receiverId].emit("reload chat", getPageFromIdx(idx)),
          );
        await Promise.all(promises);
        return;
      }
    }
  });

  //TODO socket.on('disconnect', () => { ... });
};
