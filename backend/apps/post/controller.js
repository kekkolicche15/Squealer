const asyncHandler = require("express-async-handler");
const Post = require("./model");
const { RequestError, generateFilename, calcPop } = require(
  `${global.dirs.libraries}/utils`,
);
const Notification = require(`${global.dirs.apps.be.notification}/model`);
const Channel = require(`${global.dirs.apps.be.channel}/model`);
const ChannelUser = require(`${global.dirs.apps.be.channelUser}/model`);
const User = require(`${global.dirs.apps.be.user}/model`);
const Reaction = require(`${global.dirs.apps.be.reaction}/model`);
const path = require("path");
const fse = require("fs-extra");
const VipSmm = require("../vipSmm/model");

exports.createPost = asyncHandler(async (req, res, _) => {
  let user = req.user;
  if (req.params.vip) {
    const vip = await User.findOne({ username: req.params.vip, role: "vip" });
    if (!vip) throw new RequestError(404, "user", "MISS-VIP");
    const vipsmm = await VipSmm.findOne({ smm: req.user._id, vip: vip._id });
    if (!vipsmm) throw new RequestError(409, "user", "NOT-SMM");
    user = vip;
  }
  if ((!req.body.content && !req.file) || (!req.body.channels && !req.body.location)) {
    throw new RequestError(400, "format", "BAD_FORMAT");
  }
  if (req.body.channels && !Array.isArray(req.body.channels)) {
    req.body.channels = req.body.channels.split(",");
  }

  if (!req.body.channels) req.body.channels = [];
  if (req.body.error) throw req.body.error;
  const contentType = req.file ? req.file.mimetype.split("/")[0] : "text";
  const quotaUsed =
    (req.body?.content?.length || 0) + global.data.uploads[contentType].cost;
  await user.updateQuota();
  if (user.quotas.values.some((quota) => quotaUsed > quota)) {
    throw new RequestError(409, "post", "BAD_QUOTA");
  }
  const TCNames = req.body.channels.filter((c) => c.startsWith("#"));
  const TCStatus = await Promise.all(
    TCNames.map((c) => Channel.findOne({ name: c })),
  );
  const TCPromises = [];
  for (let i = 0; i < TCNames.length; i++) {
    if (!TCStatus[i]) {
      TCPromises.push(
        Channel.create({
          name: TCNames[i],
          temporary: true,
          description: `Canale temporaneo ${TCNames[i]}`
        }),
      );
    }
  }
  const TCResults = await Promise.all(TCPromises);
  await Promise.all(TCResults.map(c => c.addMember(user)));
  const TempChannels = [];
  for (let i = 0; i < TCNames.length; i++) {
    TempChannels.push(TCStatus[i] ? TCStatus[i] : TCResults.pop());
  }
  const channelsAll = await Channel.find({
    name: { $in: req.body.channels.filter((c) => !c.startsWith("#")) },
  });
  const isMember = await Promise.all(
    channelsAll.map((channel) => channel.isMember(user)),
  );
  // parte canali con geolocalizzazione
  let geoChannels = [];
  if (req.body.location)
    geoChannels = await Channel.find({
      name: encodeURIComponent(req.body.location.toUpperCase()),
      privacy: "public",
      official: true
    });

  if (geoChannels.length === 0 && req.body.location) {
    geoChannels = [await Channel.create({
      name: encodeURIComponent(req.body.location.toUpperCase()),
      description: `Canale geolocalizzato ${req.body.location.toUpperCase()}`,
      privacy: "public",
      official: true,
      query: `?location=${encodeURIComponent(req.body.location)}`
    })];
  }
  const channels = [
    ...channelsAll.filter((channel, index) => isMember[index] && channel),
    ...TempChannels,
  ];
  if (channels.length === 0) {
    throw new RequestError(404, "channel", "CHANNEL");
  }
  const filenames = [];
  const promises = [];
  if (req.file) {
    filenames.push(path.basename(req.file.path));
    for (let i = 1; i < channels.length; i++) {
      const newFilename = generateFilename(filenames[0]);
      filenames.push(newFilename);
      promises.push(
        fse.promises.link(
          req.file.path,
          `${global.data.uploads.posts.path}/${newFilename}`,
        ),
      );
    }
  }
  const references = await (async (content) => {
    const references = {};
    const matches = content.matchAll(new RegExp(global.data.patterns.reference, 'g'));
    for (const match of matches) {
      if (match[0][1] === "c") {
        const channel = await Channel.findOne({ name: match[1] });
        if (channel) references[match[0]] = `/channel/${encodeURIComponent(channel.name)}`;
      }
      else {
        const user = await User.findOne({ username: match[1] });
        if (user) references[match[0]] = `/user/${user.username}`;
      }
    }
    return references;
  })(req.body.content);
  
  const posts = await Promise.all([
    ...promises,
    Post.insertMany(
      channels.map((channel, index) => ({
        author: user._id,
        channel: channel._id,
        content: req.body.content,
        filename: filenames[index] || null,
        location: req.body.location || null,
        references: references,
        contentType,
      })),
    ),
    user.updateOne({
      $set: {
        "quotas.values": user.quotas.values.map((quota) => {
          return quota - quotaUsed;
        }),
      },
    }),
  ]);
  for (const post of posts[0]){
    for (const ref of post.references){
        if(ref[1].includes("/user/")){
            const receiver = await User.findOne({username: ref[1].replace("/user/", "")});
            Notification.sendMention(req.user, receiver, post._id)
        }
    }
    
  }

  return res
    .status(200)
    .json({ response: global.strings[req.lan]["201"].post.POST });
});

exports.searchPosts = asyncHandler(async (req, res, _) => {
  let user = req.user;
  if (req.params.vip && req.user.username !== req.params.vip) {
    const vip = await User.findOne({ username: req.params.vip, role: "vip" });
    if (!vip) throw new RequestError(404, "user", "MISS-VIP");
    const vipsmm = await VipSmm.findOne({
      smm: req.user._id,
      vip: vip._id,
      status: "accepted",
    });
    if (!vipsmm) throw new RequestError(404, "user", "MISS-USER");
    user = vip;
  }
  //if (!user) throw new RequestError(404, "user", "USER");
  const searchQuery = {};
  if (req.query.id) searchQuery._id = req.query.id;
  else if (req.query.type === "replies") {
    searchQuery.parent = { $ne: null };
  } else if (req.query.type === "post") {
    searchQuery.parent = null;
  }
  if (req.query.location) {
    // if (!global.provinces.includes(req.query.location)) {
    //   throw new RequestError(400, "format", "BAD_LOCATION");
    // } else
    searchQuery.location = req.query.location;
  }
  const [author, channel] = await Promise.all([
    req.query.author
      ? User.findOne({ username: req.query.author })
      : Promise.resolve(undefined),
    req.query.channel
      ? Channel.findOne({ name: req.query.channel })
      : Promise.resolve(undefined),
  ]);
  if (req.query.author) searchQuery.author = author?._id ?? undefined;
  if (req.query.channel) searchQuery.channel = channel?._id ?? undefined;
if (req.query.popularity) {
    req.query.popularity = req.query.popularity.split(",");
    if (!Array.isArray(req.query.popularity)) {
      req.query.popularity = [req.query.popularity];
    }
    const popFields = req.query.popularity.filter((e) =>
      Post.schema.path("popularity").enumValues.includes(e),
    );
    if (popFields.length === 0) {
      throw new RequestError(400, "format", "POPULARITY");
    }
    searchQuery.popularity = { $in: popFields };
  }
  if (req.query.attachment) {
    if (!["text", "image", "video", "any"].includes(req.query.attachment)) {
      throw new RequestError(400, "format", "ATTACHMENT");
    }
    if (req.query.attachment === "any") {
      searchQuery.contentType = { $in: ["image", "video"] };
    } else searchQuery.contentType = req.query.attachment;
  }
  const createdAt = {};
  if (req.query.notafter) {
    const maxDate = new Date(req.query.notafter);
    if (!maxDate) throw new RequestError(400, "format", "BEFORE");
    maxDate.setHours(23, 59, 59, 999);
    createdAt.$lte = maxDate;
  }
  if (req.query.notbefore) {
    const minDate = new Date(req.query.notbefore);
    if (!minDate) throw new RequestError(400, "format", "AFTER");
    minDate.setHours(23, 59, 59, 999);
    createdAt.$gte = minDate;
  }
  const fields2pop = [
    {
      path: "channel",
      select: "_id banlist name privacy",
    },
    {
      path: "author",
      select: "username",
    },
  ];
  if (req.query.parent === "true") {
    let popParent = {
      path: "parent",
      select: "-RC -__v -replies -RM -RP",
      match: {"author": user._id},
      populate: [
        {
          path: "author",
          select: "_id username",
        },
        {
          path: "channel",
          select: "_id banlist name",
        },
      ],
    };
    if (req.query.type === "replies") popParent.match = { author: user._id };
    fields2pop.push(popParent);
  }
  if (req.query.replies === "true") {
    fields2pop.push({
      path: "replies",
      sort: { createdAt: "desc" },
      limit: global.data.searches.repliesNo,
    });
  }
  let sortOption = false;
  if (Object.keys(createdAt).length > 0) searchQuery.createdAt = createdAt;
  if (!req.query.sort) sortOption = ["createdAt", -1];
  else if (req.query.sort === "oldest") sortOption = ["createdAt", 1];
  else if (req.query.sort === "popularity") sortOption = ["RP", -1];
  else if (req.query.sort === "unpopularity") sortOption = ["RM", -1];
  else if (req.query.sort === "controversiality") sortOption = ["RC", -1];
  else throw new RequestError(400, "format", "SORT");
  let foundPosts = await Post.find(searchQuery)
    .populate(fields2pop)
    .select("-RC -__v");
  foundPosts =
    req.query.type === "replies"
      ? foundPosts.filter((post) => post.parent !== null)
      : foundPosts;
  const isChannelReadable = channel ? await channel.isReadableBy(user) : false;
  const isPostAccessible = await Promise.all(
    foundPosts.map((post) => {
      if (isChannelReadable) return true;
      return post.channel.isReadableBy(user);
    }),
  );
  var readablePosts = foundPosts.filter(
      (_, index) => {
        return isPostAccessible[index]
      }
  );
  //se hai fatto il login, togli tutti i post dei canali ufficiali
  if(req.query.Nologin === "false"){
    readablePosts = readablePosts.filter(post => !(post.channel.name === post.channel.name.toUpperCase()));
  }

  const posts = readablePosts
    .sort((a, b) => {
      const [field, ord] = sortOption;
      return ord * (a[field] - b[field]);
    })
    .slice(
      ((req.query.page || 1) - 1) * global.data.searches.CHUNKSIZE,
      (req.query.page || 1) * global.data.searches.CHUNKSIZE,
    );
  const pops = posts.map((post) =>
    calcPop(post.RP, post.RM, (post.views + 1) * 0.25),
  );
  let parentPops = [];
  if (req.query.parent === "true")
    parentPops = posts.map((post) =>
      post.parent !== null
        ? calcPop(
            post.parent.RP,
            post.parent.RM,
            (post.parent.views + 1) * 0.25,
          )
        : null,
    );
  const updates = [];
  const reactions = [];
  const parentReactions = [];
  for (let i = 0; i < posts.length; i++) {
    updates.push({
      updateOne: {
        filter: { _id: posts[i]._id },
        update: {
          $inc: { views: 1 },
          $set: { popularity: pops[i] },
        },
      },
    });
    if (req.query.parent === "true" && parentPops[i] !== null) {
      updates.push({
        updateOne: {
          filter: { _id: posts[i].parent._id },
          update: {
            $inc: { views: 1 },
            $set: { popularity: parentPops[i] },
          },
        },
      });
    }
    if (user) reactions.push(Reaction.findOne({post: posts[i]._id, user: user._id}));
    if (req.query.parent === "true")
      parentReactions.push(
        Reaction.findOne({
          post: posts[i].parent?._id,
          user: user._id,
        }),
      );
    const query = { post: posts[i]._id };
    if (user) query.user = user._id;
    reactions.push(Reaction.findOne(query));
  }
  await Post.bulkWrite(updates);
  let userReactions = [];
  if (user)
    userReactions = await Promise.all(reactions);
  let parentUserReactions = [];
  if (req.query.parent === "true")
    parentUserReactions = await Promise.all(parentReactions);
  const page = posts.reduce((acc, current, index) => {
    if (current.parent === null && req.query.type === "replies") {
      return acc;
    } else {
      const postJSON = current.toJSON();
      if (user)
        postJSON.userReaction = userReactions[index]?.type || 0;
      postJSON.channel = postJSON.channel.name;
      postJSON.author = postJSON.author.username;
      postJSON.reactions = postJSON.counters;
      let day = String(postJSON.createdAt.getDate()).padStart(2, "0");
      let month = String(postJSON.createdAt.getMonth() + 1).padStart(2, "0");
      let year = postJSON.createdAt.getFullYear();
      let hours = String(postJSON.createdAt.getHours()).padStart(2, "0");
      let minutes = String(postJSON.createdAt.getMinutes()).padStart(2, "0");
      let seconds = String(postJSON.createdAt.getSeconds()).padStart(2, "0");
      postJSON["date"] = `${day}/${month}/${year}`;
      postJSON["time"] = `${hours}:${minutes}:${seconds}`;

      if (postJSON.replies.length === 0) postJSON.replies = undefined;
      if (!postJSON.filename) postJSON.filename = undefined;
      postJSON.RP = undefined;
      postJSON.RM = undefined;
      for (const [key, [a, b]] of Object.entries(postJSON.reactions)) {
        postJSON.reactions[key] = a + b;
      }
      if (postJSON.parent !== null && req.query.parent === "true") {
        postJSON.parent.channel = postJSON.parent.channel.name;
        postJSON.parent.author = postJSON.parent.author.username;
        postJSON.parent.userReaction = parentUserReactions[index]?.type || 0;
        postJSON.parent.reactions = postJSON.parent.counters;
        postJSON.parent.counters = undefined;
        day = String(postJSON.parent.createdAt.getDate()).padStart(2, "0");
        month = String(postJSON.parent.createdAt.getMonth() + 1).padStart(
          2,
          "0",
        );
        year = postJSON.parent.createdAt.getFullYear();
        hours = String(postJSON.parent.createdAt.getHours()).padStart(2, "0");
        minutes = String(postJSON.parent.createdAt.getMinutes()).padStart(
          2,
          "0",
        );
        seconds = String(postJSON.parent.createdAt.getSeconds()).padStart(
          2,
          "0",
        );
        postJSON.parent["date"] = `${day}/${month}/${year}`;
        postJSON.parent["time"] = `${hours}:${minutes}:${seconds}`;
        postJSON.parent.replies = undefined;
        if (!postJSON.parent.filename) postJSON.parent.filename = undefined;
        postJSON.parent.RP = undefined;
        postJSON.parent.RM = undefined;
        for (const [key, [a, b]] of Object.entries(postJSON.parent.reactions)) {
          postJSON.parent.reactions[key] = a + b;
        }
      }
      acc.push(postJSON);
      return acc;
    }
  }, []);
  return res.status(200).json({ count: readablePosts.length, page: page });
});

exports.getAttachment = asyncHandler(async (req, res, _) => {
  const post = await Post.findById(req.params.post);
  let user = req.user;
  if (req.params.vip) {
    const vip = await User.findOne({ username: req.params.vip, role: "vip" });
    if (!vip) throw new RequestError(404, "user", "MISS-VIP");
    const vipsmm = await VipSmm.findOne({ smm: req.user._id, vip: vip._id });
    if (!vipsmm) throw new RequestError(409, "user", "NOT-SMM");
    user = vip;
  }
  if (!post) throw new RequestError(404, "post", "POST");
  const channel = await Channel.findById(post.channel);
  if (!channel.isReadableBy(user)) {
    throw new RequestError(403, "user", "AUTHORIZATION");
  }
  if (post.contentType === "text") {
    throw new RequestError(404, "file", "FILE");
  }
    try{
      return res.sendFile(path.join(global.data.uploads.posts.path, post.filename));
    }
    catch (e) {
      throw new RequestError(404, "attachment", "ATTACHMENT");
    }
});

exports.deletePost = asyncHandler(async (req, res, _) => {
  const post = await Post.findById(req.params.post);
  if (!post) throw new RequestError(404, "post", "POST");
  let user = req.user;
  if (req.params.vip) {
    const vip = await User.findOne({ username: req.params.vip, role: "vip" });
    if (!vip) throw new RequestError(404, "user", "MISS-VIP");
    const vipsmm = await VipSmm.findOne({ smm: req.user._id, vip: vip._id });
    if (!vipsmm) throw new RequestError(409, "user", "NOT-SMM");
    user = vip;
  }
  const [parent, channel] = await Promise.all([
    post.parent ? Post.findById(post.parent) : null,
    Channel.findById(post.channel),
  ]);
  if (
    ![post.author, channel.owner, ...channel.moderators].some((id) =>
      id.equals(user._id),
    )
  ) {
    throw new RequestError(401, "user", "AUTHORIZATION");
  }
  await Notification.deleteOne({relatedPost: post._id});
  
  //elimino la notifica pure

  await Promise.all([
    parent !== null
      ? parent.updateOne({ $pull: { replies: post._id } })
      : Promise.resolve(undefined),
    post.delete(),
  ]);
  if (channel.temporary && !(await Post.findOne({ channel: channel._id }))) {
    await Channel.findByIdAndDelete(channel._id);
  }
  return res.status(200).json(global.strings[req.lan]["200"].post.DELETE);
});

exports.getPost = asyncHandler(async (req, res, _) => {
  const post = await Post.findById(req.params.post)
  if (!post) throw new RequestError(404, "post", "POST");
  const author = await User.findById(post.author);
  const channel = await Channel.findById(post.channel);
  if (!channel.isReadableBy(req.user)) {
    throw new RequestError(403, "user", "AUTHORIZATION");
  }
  await post.updateOne({ $inc: { views: 1 } });
  const postJSON = post.toJSON();
  postJSON.channel = channel.name;
  postJSON.author = author.username;
  postJSON.reactions = {};
  for (const [key, [a, b]] of Object.entries(postJSON.counters)) {
    postJSON.reactions[key] = a + b;
  }
  postJSON.counters = undefined;
  let day = String(postJSON.createdAt.getDate()).padStart(2, "0");
  let month = String(postJSON.createdAt.getMonth() + 1).padStart(2, "0");
  let year = postJSON.createdAt.getFullYear();
  let hours = String(postJSON.createdAt.getHours()).padStart(2, "0");
  let minutes = String(postJSON.createdAt.getMinutes()).padStart(2, "0");
  let seconds = String(postJSON.createdAt.getSeconds()).padStart(2, "0");
  postJSON["date"] = `${day}/${month}/${year}`;
  postJSON["time"] = `${hours}:${minutes}:${seconds}`;
  postJSON.parent = undefined;
  postJSON.RP = undefined;
  postJSON.RM = undefined;
  postJSON.replies = undefined;
  if (!postJSON.filename) postJSON.filename = undefined;
  return res.status(200).json(postJSON);
});

exports.createReply = asyncHandler(async (req, res, _) => {
  if (!req.body.content && !req.file) {
    throw new RequestError(400, "format", "BAD_FORMAT");
  }
  const contentType = req.file ? req.file.mimetype.split("/")[0] : "text";
  const quotaUsed =
    req.body?.content?.length ?? 0 + global.data.uploads[contentType].cost;
  let user = req.user;
  if (req.params.vip) {
    const vip = await User.findOne({ username: req.params.vip, role: "vip" });
    if (!vip) throw new RequestError(404, "user", "MISS-VIP");
    const vipsmm = await VipSmm.findOne({ smm: req.user._id, vip: vip._id });
    if (!vipsmm) throw new RequestError(409, "user", "NOT-SMM");
    user = vip;
  }
  await user.updateQuota();
  const post = await Post.findById(req.params.post);
  if (!post) throw new RequestError(404, "post", "POST");
  if (user.quotas.values.some((quota) => quotaUsed > quota)) {
    throw new RequestError(409, "post", "BAD_QUOTA");
  }
  if (!post) throw new RequestError(404, "post", "POST");
  const c = await Channel.findById(post.channel);
  if (
      !(await c.isMember(user))
  ) {
    throw new RequestError(403, "channel", "MEMBER");
  }
  const reply = await Post.create({
    author: user._id,
    contentType,
    content: req.body.content,
    filename: req.file ? path.basename(req.file.path) : null,
    parent: req.params.post,
    channel: post.channel,
    location: req.body.location || null,
  });
  await Promise.all([
    post.updateOne({ $push: { replies: reply._id } }),
    user.updateOne({
      $set: {
        "quotas.values": user.quotas.values.map((quota) => quota - quotaUsed),
      },
    }),
  ]);
  return res
    .status(201)
    .json({ response: global.strings[req.lan]["201"].post.REPLY });
});

exports.getReplies = asyncHandler(async (req, res, _) => {
  let user = req.user;
  if (req.params.vip) {
    const vip = await User.findOne({ username: req.params.vip, role: "vip" });
    if (!vip) throw new RequestError(404, "user", "MISS-VIP");
    const vipsmm = await VipSmm.findOne({ smm: req.user._id, vip: vip._id });
    if (!vipsmm) throw new RequestError(409, "user", "NOT-SMM");
    user = vip;
  }
  const post = await Post.findById(req.params.post);
  const count = post.replies.length;
  const repliesMO = await Post.find({ parent: req.params.post })
    .sort({ createdAt: "desc" })
    .skip(((req.query.page || 1) - 1) * global.data.searches.CHUNKSIZE)
    .limit(global.data.searches.CHUNKSIZE)
      .select({RP: 0, RM: 0, RC: 0, __v: 0})
      .populate([
        {
          path: "author",
          select: "_id username",
      },
        {
          path: "channel",
          select: "_id banlist name",
        },
      ])

  // const repliesMO = await Post.findById(req.params.post)
  //   .select("replies")
  //   .populate({
  //     path: "replies",
  //     sort: {createdAt: "asc"},
  //     skip: ((req.query.page || 1) - 1) * global.data.searches.CHUNKSIZE,
  //     limit: global.data.searches.CHUNKSIZE,
  //     select: {
  //       RP: 0,
  //       RM: 0,
  //       RC: 0,
  //       channel: 0,
  //       __v: 0,
  //     },
  //     populate: {
  //       path: "author",
  //       select: {
  //         username: 1,
  //       },
  //     },
  //   });


  const replies = [];
  const userReactions = [];
  for (var i = 0; i < repliesMO.length; i++) {
    const reply = repliesMO[i];
    userReactions.push(Reaction.findOne({ post: reply._id, user: user._id }));
    await Post.updateOne(reply, {
      $inc: { views: 1 },
    });
    const replyJSON = reply.toJSON();
    const day = String(reply.createdAt.getDate()).padStart(2, "0");
    const month = String(reply.createdAt.getMonth() + 1).padStart(2, "0");
    const year = reply.createdAt.getFullYear();
    const hours = String(reply.createdAt.getHours()).padStart(2, "0");
    const minutes = String(reply.createdAt.getMinutes()).padStart(2, "0");
    const seconds = String(reply.createdAt.getSeconds()).padStart(2, "0");
    replyJSON["channel"] = replyJSON["channel"]["name"];
    replyJSON["date"] = `${day}/${month}/${year}`;
    replyJSON["time"] = `${hours}:${minutes}:${seconds}`;
    replyJSON.author = replyJSON.author.username;
    replyJSON.reactions = {};
    for (const [key, [a, b]] of Object.entries(replyJSON.counters)) {
      replyJSON.reactions[key] = a + b;
    }
    replyJSON.counters = undefined;
    replies.push(replyJSON);
  }
  (await Promise.all(userReactions)).forEach((reaction, index) => {
    replies[index].userReaction = reaction?.type || 0;
  });
  return res.status(200).json({ count: count, page: replies });
});

exports.createPostReaction = asyncHandler(async (req, res, _) => {
  if (!req.body.reaction) throw new RequestError(400, "format", "BAD_FORMAT");
  if (!global.data.misc.reactions.includes(parseInt(req.body.reaction))) {
    throw new RequestError(400, "post", "REACTION");
  }
  let user = req.user;
  if (req.params.vip) {
    const vip = await User.findOne({ username: req.params.vip, role: "vip" });
    if (!vip) throw new RequestError(404, "user", "MISS-VIP");
    const vipsmm = await VipSmm.findOne({ smm: req.user._id, vip: vip._id });
    if (!vipsmm) throw new RequestError(409, "user", "NOT-SMM");
    user = vip;
  }
  if (!user) throw new RequestError(404, "user", "USER");
  const [post, reaction] = await Promise.all([
    Post.findById(req.params.post),
    Reaction.findOne({ post: req.params.post, user: user._id }),
  ]);
  if (!post) throw new RequestError(404, "post", "POST");
  if (reaction) {
    throw new RequestError(409, "post", "REACTION");
  }
  const author = await User.findById(post.author);
  await post.createReaction(user, author, req.body.reaction);
  return res.status(201).json(global.strings[req.lan]["201"].post.REACTION);
});

exports.updatePostReaction = asyncHandler(async (req, res, _) => {
  if (!req.body.reaction) throw new RequestError(400, "format", "BAD_FORMAT");
  let user = req.user;
  if (req.params.vip) {
    const vip = await User.findOne({ username: req.params.vip, role: "vip" });
    if (!vip) throw new RequestError(404, "user", "MISS-VIP");
    const vipsmm = await VipSmm.findOne({ smm: req.user._id, vip: vip._id });
    if (!vipsmm) throw new RequestError(409, "user", "NOT-SMM");
    user = vip;
  }
  if (!global.data.misc.reactions.includes(Number(req.body.reaction))) {
    throw new RequestError(400, "post", "REACTION");
  }
  const [post, reaction] = await Promise.all([
    Post.findById(req.params.post),
    Reaction.findOne({ post: req.params.post, user: user._id }),
  ]);
  if (!post) throw new RequestError(404, "post", "POST");
  if (!reaction) throw new RequestError(404, "post", "REACTION");
  const author = await User.findById(post.author);
  if (reaction.type === Number(req.body.reaction)) {
    throw new RequestError(400, "post", "REACTION");
  }
  await post.updateReaction(user, author, reaction, Number(req.body.reaction));
  return res
    .status(200)
    .json(global.strings[req.lan]["200"].post.UPDATE_REACTION);
});

exports.getPostReaction = asyncHandler(async (req, res, _) => {
  let user = req.user;
  if (req.params.vip) {
    const vip = await User.findOne({ username: req.params.vip, role: "vip" });
    if (!vip) throw new RequestError(404, "user", "MISS-VIP");
    const vipsmm = await VipSmm.findOne({ smm: req.user._id, vip: vip._id });
    if (!vipsmm) throw new RequestError(409, "user", "NOT-SMM");
    user = vip;
  }
  const reaction = await Reaction.findOne({
    post: req.params.post,
    user: user._id,
  }).select("-_id", "-user", "-createdAt");
  if (!reaction) throw new RequestError(404, "post", "REACTION");
  return res.status(200).json(reaction);
});

exports.searchReaction = asyncHandler(async (req, res, _) => {
  let user = req.user;
  if (req.params.vip) {
    const vip = await User.findOne({ username: req.params.vip, role: "vip" });
    if (!vip) throw new RequestError(404, "user", "MISS-VIP");
    const vipsmm = await VipSmm.findOne({ smm: req.user._id, vip: vip._id });
    if (!vipsmm) throw new RequestError(409, "user", "NOT-SMM");
    user = vip;
  }

  const toFind = {};
  const toPop = [
    {
      path: "user",
      select: "_id username",
    },
    {
      path: "post",
      select: "-RC -__v -replies -RM -RP",
      match: { author: user._id },
      populate: [
        {
          path: "author",
          select: "_id username",
        },
        {
          path: "channel",
          select: "_id banlist name",
        },
      ],
    },
  ];
  const TMPreaction = await Reaction.find(toFind)
    .sort("-createAt")
    .populate(toPop);

  const page = TMPreaction.reduce((acc, current) => {
    if (current.post === null) {
      return acc;
    } else {
      const reactionJSON = current.toJSON();
      reactionJSON.user = reactionJSON.user.username;
      reactionJSON.post.author = reactionJSON.post.author.username;
      let day = String(reactionJSON.createAt.getDate()).padStart(2, "0");
      let month = String(reactionJSON.createAt.getMonth() + 1).padStart(2, "0");
      let year = reactionJSON.createAt.getFullYear();
      let hours = String(reactionJSON.createAt.getHours()).padStart(2, "0");
      let minutes = String(reactionJSON.createAt.getMinutes()).padStart(2, "0");
      let seconds = String(reactionJSON.createAt.getSeconds()).padStart(2, "0");
      reactionJSON["date"] = `${day}/${month}/${year}`;
      reactionJSON["time"] = `${hours}:${minutes}:${seconds}`;
      acc.push(reactionJSON);
      return acc;
    }
  }, []);

  if (page.length === 0) throw new RequestError(404, "post", "REACTION");

  return res.status(200).json({
    count: page.length,
    page: page.slice(
      ((req.query.page || 1) - 1) * global.data.searches.CHUNKSIZE,
      (req.query.page || 1) * global.data.searches.CHUNKSIZE,
    ),
  });
});

exports.deletePostReaction = asyncHandler(async (req, res, _) => {
  let user = req.user;
  if (req.params.vip) {
    const vip = await User.findOne({ username: req.params.vip, role: "vip" });
    if (!vip) throw new RequestError(404, "user", "MISS-VIP");
    const vipsmm = await VipSmm.findOne({ smm: req.user._id, vip: vip._id });
    if (!vipsmm) throw new RequestError(409, "user", "NOT-SMM");
    user = vip;
  }
  const [post, reaction] = await Promise.all([
    Post.findById(req.params.post),
    Reaction.findOne({ post: req.params.post, user: user._id }),
  ]);
  if (!post) throw new RequestError(404, "post", "POST");
  if (!reaction) throw new RequestError(404, "post", "REACTION");
  const author = await User.findById(post.author);
  await post.deleteReaction(user, author, reaction);
  return res
    .status(200)
    .json(global.strings[req.lan]["200"].post.DELETE_REACTION);
});
