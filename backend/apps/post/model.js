const mongoose = require("mongoose");
const fse = require("fs-extra");
const { calcPop } = require(`${global.dirs.libraries}/utils`);
const Reaction = require(`${global.dirs.apps.be.reaction}/model`);

const PostSchema = new mongoose.Schema(
  {
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      ref: "Channel",
    },
    author: {
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
    location: {
      type: String,
      default: null,
    },
    filename: {
      type: String,
      required: () => !!this.content,
      default: null,
    },
    replies: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Post",
      default: [],
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    views: {
      type: Number,
      required: true,
      default: 0,
    },
    counters: {
      type: Map,
      of: [Number],
      default: global.data.misc.reactions.reduce((obj, reaction) => {
        obj[reaction] = [0, 0];
        return obj;
      }, {}),
    },
    popularity: {
      type: String,
      enum: ["normal", "popular", "controversial", "unpopular"],
      default: "normal",
    },
    RP: {
      type: Number,
      default: 0,
    },
    RM: {
      type: Number,
      default: 0,
    },
    RC: {
      type: Number,
      default: 0,
    },
    references: {
      type: Map,
      of: String,
      default: {},
    }
  },
  {
    statics: {
      async getPost(postId) {
        return await this.findById(postId);
      },
      async deleteAllFrom(author) {
        const promises = [];
        for (const post of await this.find({ author: author._id })) {
          promises.push(post.delete());
        }
        await Promise.all(promises);
      },
      async deleteAllIn(channel) {
        const promises = [];
        bulkOps = [];
        for (const post of await this.find({ channel: channel._id })) {
          promises.push(post.delete());
        }
        await Promise.all(promises);
      },
    },
    methods: {
      async delete() {
        const replies = await Promise.all(
          this.replies.map((reply) => Post.findById(reply)),
        );
        await Promise.all([
          this.deleteOne(),
          this.filename
            ? fse.remove(`${global.data.uploads.posts.path}/${this.filename}`)
            : Promise.resolve(undefined),
          Reaction.deleteMany({ post: this._id }),
          ...replies.map((reply) => reply.delete()),
        ]);
      },
      async createReaction(user, author, type) {
        const newRP = this.RP + (type > 0 ? type : 0);
        const newRM = this.RM - (type < 0 ? type : 0);
        await Promise.all([
          author.updateOne({
            $set: {
              "quotas.modifiers": author.quotas.modifiers.map((m) => m + type),
            },
          }),
          this.updateOne({
            $inc: {
              [`counters.${type}.0`]: 1,
            },
            $set: {
              ["RP"]: newRP,
              ["RM"]: newRM,
              ["RC"]: this.RC + Math.abs(type),
              ["popularity"]: calcPop(newRP, newRP, this.views * 0.25),
            },
          }),
          Reaction.create({
            user: user._id,
            post: this._id,
            type: type,
          }),
        ]);
      },
      async deleteReaction(user, author, reaction) {
        const newRP = this.RP - (reaction.type > 0 ? reaction.type : 0);
        const newRM = this.RM + (reaction.type < 0 ? reaction.type : 0);
        await Promise.all([
          author.updateOne({
            $set: {
              "quotas.modifiers": author.quotas.modifiers.map(
                (m) => m - reaction.type,
              ),
            },
          }),
          this.updateOne({
            $inc: {
              [`counters.${reaction.type}.0`]: -1,
            },
            $set: {
              ["RP"]: newRP,
              ["RM"]: newRM,
              ["RC"]: this.RC - Math.abs(reaction.type),
              ["popularity"]: calcPop(newRP, newRP, this.views * 0.25),
            },
          }),
          reaction.deleteOne(),
        ]);
      },
      async updateReaction(user, author, reaction, newtype) {
        const newRP =
          this.RP +
          (newtype > 0 ? newtype : 0) -
          (reaction.type > 0 ? reaction.type : 0);
        const newRM =
          this.RM -
          (newtype < 0 ? newtype : 0) +
          (reaction.type < 0 ? reaction.type : 0);
        await Promise.all([
          author.updateOne({
            $set: {
              "quotas.modifiers": author.quotas.modifiers.map(
                (m) => m + newtype - reaction.type,
              ),
            },
          }),
          this.updateOne({
            $inc: {
              [`counters.${newtype}.0`]: 1,
              [`counters.${reaction.type}.0`]: -1,
            },
            $set: {
              ["RP"]: newRP,
              ["RM"]: newRM,
              ["RC"]: this.RC + Math.abs(newtype - reaction.type),
              ["popularity"]: calcPop(newRP, newRM, this.views * 0.25),
            },
          }),
          reaction.updateOne({
            type: newtype,
            timestamp: Date.now(),
          }),
        ]);
      },
      async addFakeReactions(author, reactions) {
        let newRP = this.RP;
        let newRM = this.RM;
        let newRC = this.RC;
        let counter = 0;
        const $set = {};
        for (const reaction in reactions) {
          counter += reactions[reaction] * reaction;
          if (reaction < 0) newRM -= reactions[reaction] * reaction;
          else newRP += reactions[reaction] * reaction;
          newRC += reactions[reaction] * Math.abs(reaction);
          const newFakeCount = this.counters.get(reaction.toString())[1] + reactions[reaction];
          $set[`counters.${reaction}`] = [this.counters.get(reaction.toString())[0], newFakeCount];
        }
        newRP = Math.max(newRP, 0);
        newRM = Math.max(newRM, 0);
        newRC = Math.max(newRC, 0);
        const popularity = calcPop(newRP, newRM, this.views * 0.25);
        $set["RP"] = newRP;
        $set["RM"] = newRM;
        $set["RC"] = newRC;
        $set["popularity"] = popularity;
        await Promise.all([
          author.updateOne({
            $set: {
              "quotas.modifiers": author.quotas.modifiers.map(
                (m) => m + counter,
              ),
            },
          }),
          this.updateOne({ $set }),
        ]);
        return popularity;
      },
    },
  },
);

const Post = mongoose.model("Post", PostSchema, "posts");
module.exports = Post;
