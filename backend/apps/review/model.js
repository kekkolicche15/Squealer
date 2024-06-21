const express = require("express");
const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema({
  vip: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  smm: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Smm",
  },
  type: {
    type: Number,
    required: true,
    default: 1,
  },
  text: {
    type: String,
    required: true,
    default: "",
  },
  createAt: {
    type: Date,
    default: Date.now,
  },
});

const Review = mongoose.model("Review", ReviewSchema, "reviews");
module.exports = Review;
