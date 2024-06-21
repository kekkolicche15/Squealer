const mongoose = require("mongoose");
// const User = require(`${global.dirs.apps.be.user}/model`);
const Notification = require(`${global.dirs.apps.be.notification}/model`);
const fse = require("fs-extra");

const MessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    contentType: {
      type: String,
      enum: ["text", "image", "video"],
      default: "text",
    },
    content: {
      type: String,
      required: function () {
        this.filename;
      },
      default: null,
    },
    filename: {
      type: String,
      required: () => !!this.content,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    statics: {
      async lastMessage(utente1, utente2) {
        const filter = {
          $or: [
            { sender: utente1, receiver: utente2 },
            { sender: utente2, receiver: utente1 },
          ],
        };

        let find = await Message.findOne(filter)
          .sort({ createdAt: -1 })
          .populate("sender receiver", { username: 1 });

        var utente;
        if (find.receiver._id.toString() == utente1._id.toString()) {
          utente = find.sender.username;
        } else {
          utente = find.receiver.username;
        }
        const areClosedFriends = await Notification.checkAreFriends(
          utente1,
          utente2,
        );

        const day = String(find.createdAt.getDate()).padStart(2, "0");
        const month = String(find.createdAt.getMonth() + 1).padStart(2, "0");
        const year = find.createdAt.getFullYear();
        const hours = String(find.createdAt.getHours()).padStart(2, "0");
        const minutes = String(find.createdAt.getMinutes()).padStart(2, "0");
        const seconds = String(find.createdAt.getSeconds()).padStart(2, "0");

        result = {
          _id: find._id,
          utente: utente,
          filename: find.filename,
          contentType: find.contentType,
          content: find.content,
          createdAt: find.createdAt,
          date: `${day}/${month}/${year}`,
          time: `${hours}:${minutes}:${seconds}`,
          areClosedFriends: !!areClosedFriends,
        };
        return result;
      } /*
            async getUsers(user) {
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
                return [...new Set(usernames)];
            },*/,
      async deleteAllFrom(user) {
        const promises = [];
        const filter = {
          $or: [{ sender: user._id }, { receiver: user._id }],
        };
        for (const message of await this.find(filter)) {
          promises.push(message.delete());
        }
        await Promise.all(promises);
      },
    },
    methods: {
      async delete() {
        if (this.filename) {
          await fse.remove(
            `${global.data.uploads.messages.path}/${this.filename}`,
          );
        }
        await this.deleteOne();
      },
    },
  },
);

const Message = mongoose.model("Message", MessageSchema, "messages");
module.exports = Message;
