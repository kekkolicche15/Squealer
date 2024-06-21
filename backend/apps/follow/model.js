const mongoose = require("mongoose");

const FollowSchema = new mongoose.Schema(
  {
    follower: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    followed: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  },
  {
    statics: {
      async follow(follower, followed) {
        return await this.create({
          follower: follower._id,
          followed: followed._id,
        });
      },
      async unfollow(follower, followed) {
        return await this.deleteOne({
          follower: follower._id,
          followed: followed._id,
        });
      },
      async isFollowing(follower, followed) {
        return !!(await this.findOne({
          follower: follower._id,
          followed: followed._id,
        }));
      },
      async getFollowers(user, page = 1) {
        return (
          await this.find({ followed: user._id })
            .sort({ _id: "asc" })
            .skip((page - 1) * global.data.searches.CHUNKSIZE)
            .limit(global.data.searches.CHUNKSIZE)
            .populate("follower", "username")
        ).map((follow) => follow.follower.username);
      },
      async getFollowed(user, page = 1) {
        return (
          await this.find({ follower: user._id })
            .sort({ _id: "asc" })
            .skip((page - 1) * global.data.searches.CHUNKSIZE)
            .limit(global.data.searches.CHUNKSIZE)
            .populate("followed", "username")
        ).map((user) => user.followed.username);
      },
      async deleteAll(user) {
        return {
          followed: await this.deleteMany({ follower: user._id }),
          follower: await this.deleteMany({ followed: user._id }),
        };
      },
    },
  },
);

const Follow = mongoose.model("Follow", FollowSchema, "follows");

module.exports = Follow;
