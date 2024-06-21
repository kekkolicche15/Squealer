const mongoose = require("mongoose");
const Follow = require(`${global.dirs.apps.be.follow}/model`);
const Block = require(`${global.dirs.apps.be.block}/model`);
const Post = require(`${global.dirs.apps.be.post}/model`);
const Channel = require(`${global.dirs.apps.be.channel}/model`);
const ChannelUser = require(`${global.dirs.apps.be.channelUser}/model`);
const Message = require(`${global.dirs.apps.be.message}/model`);
const Smm = require(`${global.dirs.apps.be.smm}/model`);
const VipSmm = require(`${global.dirs.apps.be.vipSmm}/model`);
const fse = require("fs-extra");
const datefns = require("date-fns");
const { calcQuotaWithModifiers } = require(`${global.dirs.libraries}/utils`);
const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      unique: true,
    },
    creationDate: {
      type: Date,
      default: Date.now,
    },
    role: {
      type: String,
      enum: ["user", "vip", "smm", "mod"],
      default: "user",
    },
    quotas: {
      values: {
        type: [Number],
        default: global.data.quotas.user,
      },
      modifiers: {
        type: [Number],
        default: [0, 0, 0],
      },
      lastUpdate: {
        type: Date,
        default: new Date(),
      },
    },
    bio: {
      type: String,
      default: "Hey, sto usando Squealer (sì, lo so... che originalità...)",
    },
    propic: {
      type: String,
      default: global.data.uploads.users.default,
    },
    refreshToken: {
      type: String,
      required: false,
    },
    score: {
      type: Number,
      default: 0,
    },
    banned: {
      type: Date,
      default: null,
    },
    activation: {
      type: String,
      default: function () {
        return `${Date.now()}${Math.round(Math.random() * 1e9)}`;
      },
    },
    passwdReset: {
      type: String,
      default: null,
    },
    debt: {
      type: Boolean,
      default: false,
    },
  },
  {
    virtuals: {
      followerCount: {
        options: {
          ref: "Follow",
          localField: "_id",
          foreignField: "followed",
          count: true,
        },
      },
      followedCount: {
        options: {
          ref: "Follow",
          localField: "_id",
          foreignField: "follower",
          count: true,
        },
      },
    },
    statics: {
      async activateAccount(code) {
        if (!code) throw new Error();
        const user = await this.findOne({ activation: code });
        if (!user) throw new Error();
        await user.updateOne({ activation: null });
      },
    },
    methods: {
      equals(user) {
        return this._id.equals(user?._id) || false;
      },

      async delete() {
        const [ownedChannels, moderatedChannels] = await Promise.all([
          Channel.find({ owner: this._id }),
          Channel.find({ moderators: { $in: this._id } }),
        ]);
        await Promise.all([
          Message.deleteAllFrom(this),
          Post.deleteAllFrom(this),
        ]);
        const promises = [
          ChannelUser.deleteMany({ user: this._id }),
          Follow.deleteAll(this),
          Block.deleteAll(this),
        ];
        if (this.propic !== global.data.uploads.users.default) {
          promises.push(
            fse.remove(
              `${global.data.uploads.users.path}/small/${this.propic}`,
            ),
            fse.remove(`${global.data.uploads.users.path}/big/${this.propic}`),
          );
        }
        for (const channel of moderatedChannels) {
          promises.push(channel.updateOne({ $pull: { moderators: this._id } }));
        }
        for (const channel of ownedChannels) {
          if (channel.moderators.length === 0) promises.push(channel.delete());
          else {
            promises.push(
              ChannelUser.updateOne(
                {
                  channel: channel._id,
                  user: channel.moderators[0]._id,
                },
                { status: "owner" },
              ),
              channel.updateOne({
                $set: { owner: channel.moderators[0]._id },
                $pop: { moderators: -1 },
              }),
            );
          }
        }
        promises.push(
          Smm.findOneAndDelete({ smm: this._id }),
          VipSmm.deleteMany({
            $or: [{ smm: this._id }, { vip: this._id }],
          }),
          this.deleteOne(),
        );
        await Promise.all(promises);
      },

      async updateQuota(role = this.role) {
        const today = new Date();
        const type = role === "smm" ? "vip" : role;
        toUpdate = {};
        if (datefns.differenceInMonths(this.quotas.lastUpdate, today)) {
          toUpdate["quotas.modifiers[2]"] = 0;
          toUpdate["quotas.values[2]"] = calcQuotaWithModifiers(
            global.data.quotas[type][2],
            this.quotas.modifiers[2],
          );
        }
        if (datefns.differenceInWeeks(this.quotas.lastUpdate, today)) {
          toUpdate["quotas.modifiers[1]"] = 0;
          toUpdate["quotas.values[1]"] = calcQuotaWithModifiers(
            global.data.quotas[type][1],
            this.quotas.modifiers[1],
          );
        }
        if (datefns.differenceInDays(this.quotas.lastUpdate, today)) {
          toUpdate["quotas.modifiers[0]"] = 0;
          toUpdate["quotas.values[0]"] = calcQuotaWithModifiers(
            global.data.quotas[type][0],
            this.quotas.modifiers[0],
          );
        }
        if (Object.keys(toUpdate).length !== 0) {
          toUpdate["quotas.lastUpdate"] = new Date();
          toUpdate.$inc = { score: Math.max(0, this.quotas.modifiers[0]) };
          await this.updateOne(toUpdate);
        }
      },

      isActivated() {
        return this.activation === null;
      },
    },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);
const User = mongoose.model("User", UserSchema, "users");

module.exports = User;
