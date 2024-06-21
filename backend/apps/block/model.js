const mongoose = require("mongoose");

const BlockSchema = new mongoose.Schema(
  {
    blocker: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    blocked: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
  },
  {
    statics: {
      async block(blocker, blocked) {
        if (!blocker || !blocked) return false;
        return await this.create({
          blocker: blocker._id,
          blocked: blocked._id,
        });
      },
      async unblock(blocker, blocked) {
        if (!blocker || !blocked) return false;
        return await Block.deleteOne({
          blocker: blocker._id,
          blocked: blocked._id,
        });
      },
      async getBlocked(blocker, page = 1) {
        if (!blocker) return [];
        return (
          await Block.find({ blocker: blocker._id })
            .sort({ _id: "asc" })
            .skip((page - 1) * global.data.searches.CHUNKSIZE)
            .limit(global.data.searches.CHUNKSIZE)
            .populate("blocked")
        ).map((block) => block.blocked.username);
      },
      async hasBlocked(blocker, blocked) {
        if (!blocker || !blocked) return false;
        return !!(await Block.findOne({
          blocker: blocker._id,
          blocked: blocked._id,
        }));
      },
      async deleteAll(user) {
        if (!user) return false;
        const [blocked, blocker] = await Promise.all([
          Block.deleteMany({ blocker: user._id }),
          Block.deleteMany({ blocked: user._id }),
        ]);
        return { blocked, blocker };
      },
    },
  },
);

const Block = mongoose.model("Block", BlockSchema, "blocked");
module.exports = Block;
