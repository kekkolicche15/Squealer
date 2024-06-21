const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
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
    areClosedFriends: {
      type: Boolean,
      default: false,
      required: function () {
        return this.type === "fulfilled";
      },
    },
    type: {
      type: String,
      required: true,
      enum: ["PendingRequest", "fulfilled", "mention"],
      default: "PendingRequest",
    },
    content: {
      type: String,
      required: true,
      default: null,
    },
    sendedAt: {
      type: Date,
      default: Date.now,
    },
    relatedPost: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
        default: null,
    }
  },
  {
    statics: {
      async removeNotificationOrFriendship(utente1, utente2, content) {
        const filter = {
            $and: [
              {
                $or: [
                  { sender: utente1, receiver: utente2 },
                  { sender: utente2, receiver: utente1 },
                ],
              },
              { content: content },
            ],
          };
        
        return await Notification.deleteOne(filter);
      },
      async sendMention(sender, receiver, postId) {
        msg = `${sender.username} ti ha menzionato in un post`;

        Notification.create({
            sender: sender,
            receiver: receiver,
            type: "mention",
            content: msg,
            relatedPost: postId,
          });
        
      },
      async checkAreFriends(sender, receiver) {
        const filter = {
          type: "fulfilled",
          $or: [
            { sender: sender, receiver: receiver },
            { sender: receiver, receiver: sender },
          ],
        };

        return await Notification.findOne(filter);
      },
      //da fare quando viene eliminato un utente
      async deleteAll(utente) {

        const filter = {
            $or: [
              { sender: utente },
              { receiver: utente},
            ],
          };

        await Notification.deleteMany(filter);
      
      },
    },
  },
);

const Notification = mongoose.model(
  "Notification",
  NotificationSchema,
  "notifications",
);
module.exports = Notification;
