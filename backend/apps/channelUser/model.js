const mongoose = require("mongoose");

const ChannelUserSchema = new mongoose.Schema({
  channel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Channel",
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["owner", "moderator", "member", "waiting"],
    required: true,
  },
});

const ChannelUser = mongoose.model(
  "ChannelUser",
  ChannelUserSchema,
  "channel_user",
);

module.exports = ChannelUser;
