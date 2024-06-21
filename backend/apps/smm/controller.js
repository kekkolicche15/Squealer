const asyncHandler = require("express-async-handler");
const Post = require("./model");
const { RequestError } = require(`${global.dirs.libraries}/utils`);
const Mongoose = require("mongoose");
const User = require(`${global.dirs.apps.be.user}/model`);
const Smm = require("./model");
const VipSmm = require(`${global.dirs.apps.be.vipSmm}/model`);
const Review = require(`${global.dirs.apps.be.review}/model`);
const path = require("path");

const smmFields = ["cost", "description", "maxVipCount"];
const reviewFields = ["type", "text"];
const order = ["ascending", "descending"];

exports.searchSmmById = asyncHandler(async (req, res, next) => {
  const toPopulate = {
    path: "smm",
    select: "username",
  };
  const smm = await Smm.findById({ _id: req.params.id }).populate(toPopulate);
  res.status(200).json({
    id: smm._id,
    username: smm.smm.username,
    cost: smm.cost,
    description: smm.description,
    maxVipCount: smm.maxVipCount,
    currentVipCount: smm.currentVipCount,
    rating: smm.rating,
    reviewCount: smm.reviewCount,
    createdAt: smm.timestamp,
  });
});

exports.searchSmm = asyncHandler(async (req, res, next) => {
  const toMatch = {};
  if (req.query.availability === "available") {
    toMatch.$expr = { $lt: ["$currentVipCount", "$maxVipCount"] };
  }
  if (req.query.availability === "full") {
    toMatch.$expr = { $eq: ["$currentVipCount", "$maxVipCount"] };
  }
  const toPopulate = {
    path: "smm",
    select: "username",
  };
  if (req.query.smm) {
    toPopulate.match = {
      username: { $regex: `^${req.query.smm}`, $options: "i" },
    };
  }
  const toSort = {};
  if (!req.query.sort) toSort.creationDate = req.query.order || "descending";
  if (req.query.sort === "cost") toSort.cost = req.query.order || "descending";
  if (req.query.sort === "rating") {
    toSort.rating = req.query.order || "descending";
  }
  if (req.query.sort === "date") {
    toSort.creationDate = req.query.order || "descending";
  }
  if (req.query.sort === "clients") {
    toSort.currentVipCount = req.query.order || "descending";
  }

  const Tmpsmms = await Smm.find(toMatch).populate(toPopulate).sort(toSort);

  const smms = Tmpsmms.filter((el) => el.smm !== null);
  const vipSMM = await Promise.all(
    smms.map((tmpSmm) => {
      return VipSmm.findOne({ smm: tmpSmm.smm._id, vip: req.user._id });
    }),
  );

  if (smms.length === 0) throw new RequestError(404, "smm", "SMM");
  const listSMM = smms.map((smm, index) => ({
    id: smm._id,
    username: smm.smm.username,
    cost: smm.cost,
    description: smm.description,
    maxVipCount: smm.maxVipCount,
    currentVipCount: smm.currentVipCount,
    rating: smm.rating,
    reviewCount: smm.reviewCount,
    createdAt: smm.timestamp,
    requestStatus: vipSMM[index]?.status,
  }));
  const limited = listSMM.slice(
    ((req.query.page || 1) - 1) * global.data.searches.CHUNKSIZE,
    (req.query.page || 1) * global.data.searches.CHUNKSIZE,
  );
  res.status(200).json({ count: listSMM.length, page: limited });
});

exports.editSmm = asyncHandler(async (req, res, next) => {
  const smm = await Smm.findOne({ smm: req.user._id });
  if (!smm) throw new RequestError(404, "smm", "SMM");
  const toUpdate = {};
  for (const field in req.body) {
    if (smmFields.includes(field)) toUpdate[field] = req.body[field];

    if (field === "maxVipCount" && req.body.maxVipCount < smm.currentVipCount) {
      throw new RequestError(400, "smm", "BAD_FORMAT");
    }
  }
  const updatedSmm = await smm.updateOne(toUpdate);
  res.status(200).json(updatedSmm);
});

exports.becomeSmm = asyncHandler(async (req, res, next) => {
  if (await Smm.findOne({ smm: req.user._id })) {
    throw new RequestError(409, "smm", "ALREADY_SMM");
  }
  if (await VipSmm.findOne({ vip: req.user._id, status: "accepted" })) {
    throw new RequestError(409, "smm", "VIP_SMM");
  }
  const toCreate = {};
  for (const field in req.body) {
    if (smmFields.includes(field)) toCreate[field] = req.body[field];

    if (field === "maxVipCount" && req.body.maxVipCount < 1) {
      throw new RequestError(400, "smm", "BAD_FORMAT");
    }
  }
  if (req.user.score < global.data.misc.smmCost) {
    throw new RequestError(409, "smm", "SCORE");
  }
  const toUpdate = {
    $inc: { score: -global.data.misc.vipCost },
    role: "smm",
  };
  await Promise.all([
    Smm.create({ smm: req.user._id, ...toCreate }),
    req.user.updateOne(toUpdate),
  ]);
  res.status(200).json({ message: "SMM created" });
});

exports.ceaseSmm = asyncHandler(async (req, res, next) => {
  await Promise.all([
    Smm.findOneAndDelete({ smm: req.user._id }),
    VipSmm.deleteMany({ smm: req.user._id }),
    Review.deleteMany({ smm: req.user._id }),
  ]);
  await req.user.updateOne({
    role: "vip",
  });
  res.status(200).json({ message: "SMM deleted" });
});

exports.getW8ingList = asyncHandler(async (req, res, next) => {
  const vipSmm = await VipSmm.find({ smm: req.user._id, status: "waiting" })
    .populate({ path: "vip", select: "username" })
    .sort({ _id: "asc" });
  // .skip(((req.query.page || 1) - 1) * global.data.searches.CHUNKSIZE)
  // .limit(global.data.searches.CHUNKSIZE)
  const tmpVipSmm = vipSmm.filter((el) => el.smm !== null);

  if (tmpVipSmm.length === 0) throw new RequestError(404, "smm", "SMM");
  res.status(200).json({
    count: tmpVipSmm.length,
    page: tmpVipSmm
      .map((vm) => ({
        vip: vm.vip.username,
      }))
      .slice(
        ((req.query.page || 1) - 1) * global.data.searches.CHUNKSIZE,
        (req.query.page || 1) * global.data.searches.CHUNKSIZE,
      ),
  });
});
exports.sendW8ingList = asyncHandler(async (req, res, next) => {
  const smmUser = await User.findOne({ username: req.params.smm });
  const [request, smm] = await Promise.all([
    VipSmm.findOne({ vip: req.user._id, smm: smmUser._id }),
    Smm.findOne({ smm: smmUser._id }),
  ]);
  if (req.user.role === "smm") {
    throw new RequestError(409, "smm", "ALREADY_SMM");
  }
  if (request) {
    throw new RequestError(409, "smm", "IN_LIST");
  }
  if (!smm) throw new RequestError(404, "smm", "SMM");
  const vipSmm = await VipSmm.create({
    vip: req.user._id,
    smm: smmUser._id,
    status: "waiting",
  });
  res.status(201).json(vipSmm);
});

exports.leaveW8ingList = asyncHandler(async (req, res, next) => {
  const smmUser = await User.findOne({ username: req.params.smm });
  const vipSmm = await VipSmm.findOne({
    vip: req.user._id,
    smm: smmUser._id,
    status: "waiting",
  });
  if (!vipSmm) throw new RequestError(409, "smm", "NOT_LIST");
  await vipSmm.deleteOne();
  res.status(200).json(vipSmm);
});

exports.getManagedVips = asyncHandler(async (req, res, next) => {
  const vipSmm = await VipSmm.find({ smm: req.user._id, status: "accepted" })
    .sort({ _id: "asc" })
    .skip(((req.query.page || 1) - 1) * global.data.searches.CHUNKSIZE)
    .limit(global.data.searches.CHUNKSIZE)
    .populate({
      path: "vip",
      select: "username",
    });
  //le informazioni del vip li ottengo con una multeplici get su /api/user/:username
  if (vipSmm.length === 0) throw new RequestError(404, "smm", "SMM");
  res.status(200).json(
    vipSmm.map((vip) => ({
      username: vip.vip.username,
    })),
  );
});

exports.acceptVip = asyncHandler(async (req, res, next) => {
  const vip = await User.findOne({ username: req.params.vip });
  const [vipSmm, smm] = await Promise.all([
    VipSmm.findOne({ vip: vip._id, smm: req.user._id, status: "waiting" }),
    Smm.findOne({ smm: req.user._id }),
  ]);
  if (!vipSmm) throw new RequestError(404, "smm", "SMM");
  if (!smm) throw new RequestError(404, "smm", "SMM");
  if (smm.currentVipCount >= smm.maxVipCount) {
    throw new RequestError(409, "smm", "SMM_FULL");
  }
  if (vip.score < smm.cost) throw new RequestError(409, "smm", "SCORE");
  await vipSmm.updateOne({ status: "accepted" });
  await Promise.all([
    VipSmm.deleteMany({ vip: vip._id, status: "waiting" }),
    smm.updateOne({ currentVipCount: smm.currentVipCount + 1 }),
    vip.updateOne({ $inc: { score: -smm.cost } }),
    req.user.updateOne({ $inc: { score: smm.cost } }),
  ]);
  res.status(200).json("Vip accepted");
});

exports.rejectVip = asyncHandler(async (req, res, next) => {
  const vip = await User.findOne({ username: req.params.vip });
  const vipSmm = await VipSmm.findOne({
    vip: vip._id,
    smm: req.user._id,
    status: "waiting",
  })
    .sort({ _id: "asc" })
    .skip(((req.query.page || 1) - 1) * global.data.searches.CHUNKSIZE)
    .limit(global.data.searches.CHUNKSIZE);
  if (!vipSmm) throw new RequestError(404, "smm", "SMM");
  await vipSmm.deleteOne();
  res.status(200).json(vipSmm);
});

exports.deleteManager = asyncHandler(async (req, res, next) => {
  const vip = await VipSmm.findOne({ vip: req.user._id, status: "accepted" });
  if (!vip) throw new RequestError(404, "vip", "VIP");
  const smm = await Smm.findOne({ smm: vip.smm });
  if (!smm) throw new RequestError(404, "smm", "SMM");
  await Promise.all([
    VipSmm.deleteOne({ vip: req.user._id, status: "accepted" }),
    smm.updateOne({ currentVipCount: smm.currentVipCount - 1 }),
  ]);
  res.status(200).json("SMM cancellato");
});

exports.getManager = asyncHandler(async (req, res, next) => {
  var user;
  if (req.params.user) {
    user = await User.findOne({ username: req.params.user });
  } else user = req.user;

  const vip = await VipSmm.findOne({ vip: user._id, status: "accepted" });
  if (!vip) throw new RequestError(404, "vip", "VIP");
  let smm = await Smm.findOne({ smm: vip.smm }).populate("smm", {
    username: 1,
  });
  if (!smm) throw new RequestError(404, "smm", "SMM");
  smm = smm.toObject();
  smm.username = smm.smm.username;
  res.status(200).json(smm);
});

exports.getReviews = asyncHandler(async (req, res, next) => {
  const getSmm = await User.findOne({ username: req.params.smm });
  var sort;
  if (req.query.sort === "rating") {
    sort = { type: req.query.order || "descending" };
  } else sort = { createAt: req.query.order || "descending" };
  const reviews = await Review.find({ smm: getSmm._id })
    .sort(sort)
    .skip(((req.query.page || 1) - 1) * global.data.searches.CHUNKSIZE)
    .limit(global.data.searches.CHUNKSIZE)
    .populate("vip", { username: 1 });
  //if (reviews.length === 0) throw new RequestError(404, "smm", "REVIEW");
  res.status(200).json({ reviews });
});

exports.createReview = asyncHandler(async (req, res, next) => {
  const smmUser = await User.findOne({ username: req.params.smm });
  if (!smmUser) throw new RequestError(404, "smm", "SMM");
  const [review, smm, vipSmm] = await Promise.all([
    Review.findOne({ vip: req.user._id, smm: smmUser._id }),
    Smm.findOne({ smm: smmUser._id }),
    VipSmm.findOne({ vip: req.user._id, smm: smmUser._id, status: "accepted" }),
  ]);
  if (!smm) throw new RequestError(404, "smm", "SMM");
  if (!vipSmm) throw new RequestError(409, "smm", "MANAGED");
  const toCreate = {};
  for (const field in req.body) {
    if (reviewFields.includes(field)) toCreate[field] = req.body[field];
  }
  await Promise.all([
    Review.create({ vip: req.user._id, smm: smmUser._id, ...toCreate }),
    smm.updateOne({
      reviewCount: smm.reviewCount + 1,
      totalRating: smm.totalRating + Number(req.body.type),
      rating:
        Math.round(
          ((smm.totalRating + Number(req.body.type)) / (smm.reviewCount + 1)) *
            100,
        ) / 100,
    }),
  ]);
  res.status(201).json("review creato con successo");
});
