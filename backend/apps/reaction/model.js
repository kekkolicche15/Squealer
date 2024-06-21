const express = require("express");
const mongoose = require("mongoose");
const moment = require("moment");
const ReactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Post",
    },
    type: {
      type: Number,
      enum: global.data.misc.reactions,
    },
    createAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    methods: {
      async getReactionDataForMonth(user, startDate, endDate, type) {
        const pipeline = [
          {
            $match: {
              user: user._id,
              createAt: {
                $gte: startDate,
                $lt: endDate,
              },
              type: { $gte: type || 1 },
            },
          },
          {
            $group: {
              _id: {
                year: { $year: "$createAt" },
                month: { $month: "$createAt" },
                day: { $dayOfMonth: "$createAt" },
              },
              totalTypeSum: { $sum: "$type" },
            },
          },
          {
            $project: {
              _id: 0,
              date: {
                $dateFromParts: {
                  year: "$_id.year",
                  month: "$_id.month",
                  day: "$_id.day",
                },
              },
              totalTypeSum: 1,
            },
          },
          {
            $sort: {
              date: 1, // Sort by date in ascending order
            },
          },
        ];
        return await this.aggregate(pipeline);
      },
    },
  },
);

const Reaction = mongoose.model("Reaction", ReactionSchema, "reactions");
module.exports = Reaction;
