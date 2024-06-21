const mongoose = require("mongoose");
const ChannelUser = require(`${global.dirs.apps.be.channelUser}/model`);
const Post = require(`${global.dirs.apps.be.post}/model`);
const fse = require("fs-extra");

const channelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      default: "Un bel canale",
    },
    privacy: {
      type: String,
      enum: ["public", "private"],
      default: "public",
      required: true,
    },
    picture: {
      type: String,
      default: global.data.uploads.channels.default,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    moderators: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    creationDate: {
      type: Date,
      default: Date.now,
    },
    banlist: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    query: {
      type: String,
      default: function () {
        return `?channel=${encodeURIComponent(this.name)}`;
      },
    },
    temporary: {
      type: Boolean,
      default: false,
    },
    official: {
      type: Boolean,
      default: false,
    },
  },
  {
    methods: {
      isOwner(user) {
        if (!user) return false;
        return this.owner.equals(user._id);
      },

      isMod(user) {
        if (!user) return false;
        return this.moderators.includes(user._id);
      },

      async isMember(user) {
        if (!user) return false;
        return !!(await ChannelUser.findOne({
          channel: this._id,
          user: user._id,
          status: { $ne: "waiting" },
        }));
      },

      async isWaiting(user) {
        if (!user) return false;
        return !!(await ChannelUser.findOne({
          channel: this._id,
          user: user._id,
          status: "waiting",
        }));
      },

      isBanned(user) {
        if (!user) return false;
        return this.banlist.includes(user._id);
      },

      isPublic() {
        return this.privacy === "public";
      },

      async isReadableBy(user) {
        return (
          this.isPublic() ||
          (user &&
            (user.role === "mod" ||
              ((await this.isMember(user)) && !this.isBanned(user))))
        );
      },
      async isWritableBy(user) {
        return user && (await this.isMember(user)) && !this.isBanned(user);
      },

      async addMod(user) {
        if (!user) return false;
        return await this.updateOne({ $push: { moderators: user._id } });
      },

      async removeMod(user) {
        if (!user) return false;
        return await this.updateOne({ $pull: { moderators: user._id } });
      },

      async banUser(user) {
        if (!user) return false;
        return await this.updateOne({ $push: { banlist: user._id } });
      },

      async unbanUser(user) {
        if (!user) return false;
        return await this.updateOne({ $pull: { banlist: user._id } });
      },

      async addMember(user, status = "member") {
        if (!user) return false;
        return await ChannelUser.create({
          channel: this._id,
          user: user._id,
          status,
        });
      },

      async add2W8ingList(user) {
        if (!user) return false;
        return await ChannelUser.create({
          channel: this._id,
          user: user._id,
          status: "waiting",
        });
      },

      async deleteMember(user) {
        if (!user) return false;
        return await ChannelUser.deleteOne({
          channel: this._id,
          user: user._id,
        });
      },

      async getMembers(page = 1) {
        return (
          await ChannelUser.find({
            channel: this._id,
            status: { $ne: "waiting" },
          })
            .sort({ user: "asc" })
            .skip((page - 1) * global.data.searches.CHUNKSIZE)
            .limit(global.data.searches.CHUNKSIZE)
            .populate("user")
        ).map((user) => ({
          username: user.user.username,
          role: user.status,
        }));
      },

      async countMembers() {
        return await ChannelUser.countDocuments({
          channel: this._id,
          status: { $ne: "waiting" },
        });
      },

      async getPopularity() {
        if (this.official) return "Non applicabile";
        const notBefore = new Date();
        notBefore.setDate(notBefore.getDate() - 7);
        const posts = await this.model("Post").find({
          channel: this._id,
          createdAt: { $gte: notBefore },
        });
        const CMChannel = 0.75;
        const popularCount = posts.filter(
          (post) => post.popularity === "popular",
        ).length;
        const unpopularCount = posts.filter(
          (post) => post.popularity === "unpopular",
        ).length;
        const controversialCount = posts.filter(
          (post) => post.popularity === "controversial",
        ).length;
        const totalPosts = posts.length;
        if (popularCount / totalPosts >= CMChannel) {
          return "popular";
        }
        if (unpopularCount / totalPosts >= CMChannel) {
          return "unpopular";
        }
        if (controversialCount / totalPosts >= CMChannel) {
          return "controversial";
        }
        return "normal";
      },

      async delete() {
        const promises = [
          ChannelUser.deleteMany({ channel: this._id }),
          Post.deleteAllIn(this),
        ];
        if (this.picture !== global.data.uploads.channels.default) {
          promises.push(
            fse.remove(
              `${global.data.uploads.channels.path}/small/${this.picture}`,
            ),
            fse.remove(
              `${global.data.uploads.channels.path}/big/${this.picture}`,
            ),
          );
        }
        await Promise.all(promises);
        await this.deleteOne();
      },
    },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

const Channel = mongoose.model("Channel", channelSchema, "channels");
module.exports = Channel;
