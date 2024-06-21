const fs = require("fs");
const express = require("express");
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose");
const socketIO = require("socket.io");
const http = require("http");
const schedule = require("node-schedule");
const rootDir = path.dirname(__dirname);
global.dirs = {
  root: rootDir,
  libraries: path.join(__dirname, "libraries"),
  apps: {
    be: {},
    fe: Object.fromEntries(
      ["user", "smm", "mod", "errors"].map((val) => [
        val,
        path.join(
          path.join(rootDir, "frontend"),
          val,
          `${val === "user" || val === "smm" ? "build" : ""}`,
        ),
      ]),
    ),
  },
};

fs.readdirSync(path.join(__dirname, "apps"))
  .filter((item) =>
    fs.statSync(`${path.join(__dirname, "apps")}/${item}`).isDirectory(),
  )
  .forEach(
    (dir) => (global.dirs.apps.be[dir] = path.join(__dirname, "apps", dir)),
  );



global.data = JSON.parse(fs.readFileSync(path.join(__dirname, ".config.json")));
global.strings = { it: {}, en: {} };
global.strings.it = JSON.parse(
  fs.readFileSync(path.join(__dirname, "language", "it.json")),
);
global.strings.en = JSON.parse(
  fs.readFileSync(path.join(__dirname, "language", "en.json")),
);

global.data.uploads.users.path = path.join(rootDir, "public", "users");
global.data.uploads.channels.path = path.join(rootDir, "public", "channels");
global.data.uploads.posts.path = path.join(rootDir, "public", "posts");
global.data.uploads.messages.path = path.join(rootDir, "public", "messages");
global.data.uploads.generals.path = path.join(rootDir, "public", "generals");

global.roles = {
  user: 0,
  vip: 1,
  smm: 2,
  mod: 3,
};

const messageSocket = require(`${global.dirs.apps.be.message}/socket`);
const VipSmm = require(`${global.dirs.apps.be.vipSmm}/model`);
const Smm = require(`${global.dirs.apps.be.smm}/model`);
const User = require(`${global.dirs.apps.be.user}/model`);

schedule.scheduleJob("0 0 1 * *", async () => {
    const vips = await User.find({role: "vip"});
    const updates = [];
    vips.forEach((vip) => {
        if (vip.score >= global.data.misc.MvipCost) {
        updates.push(
          vip.updateOne({
              $inc: {score: -global.data.misc.MvipCost},
          }),
        );
      } else {
            updates.push(vip.updateOne({role: "user"}), vip.updateQuota("user"));
            updates.push(VipSmm.deleteMany({user: vip._id}));
      }
    });
    await Promise.all(updates);
});

schedule.scheduleJob("0 0 1 * *", async () => {
    const smmUsers = await User.find({ role: "smm" });
    const smms = await Promise.all(
      smmUsers.map((smm) => Smm.findOne({ smm: smm._id })),
    );
    const vipSmms = await Promise.all(
      smms.map((smm) =>
        VipSmm.find({ smm: smm.smm }).populate({
          path: "vip",
          select: "score",
        }),
      ),
    );
    const updates = [];
    smms.forEach((smm, index) => {
        if (smmUsers[index].score >= global.data.misc.smmCost) {
        updates.push(
            smmUsers[index].updateOne({
                $inc: {score: -global.data.misc.smmCost},
          }),
        );
        if (vipSmms[index]?.length > 0) {
            vipSmms[index].forEach((vipsmm) => {
                if (vipsmm.vip.score >= smm.cost) {
              updates.push(
                  smmUsers[index].updateOne({
                  $inc: { score: smm.cost },
                }),
                User.findByIdAndUpdate(vipsmm.vip._id, {
                    $inc: {score: -smm.cost},
                }),
              );
            } else {
              updates.push(vipsmm.deleteOne());
            }
          });
        }
      } else {
            updates.push(smmUsers[index].updateOne({role: "vip"}));
        updates.push(VipSmm.deleteMany({ smm: smm._id }));
        updates.push(smm.deleteOne());
      }
    });
    await Promise.all(updates);
});

Date.prototype.getWeekNumber = function () {
  const d = new Date(+this);
  d.setHours(0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  return Math.ceil(((d - new Date(d.getFullYear(), 0, 1)) / 8.64e7 + 1) / 7);
};
const app = express();

app.use(cors());
app.use(express.json());
app.use("/", require("./routes"));

const mongoUri = `mongodb://${global.data.db.user}:${global.data.db.pwd}@${global.data.db.site}/${global.data.db.dbname}?authSource=admin&writeConcern=majority`;
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const server = http.createServer(app);
const io = socketIO(server);

io.on("connection", (socket) => {
  messageSocket.handler(socket);
});

server.listen(8000, function () {
  console.log(
    `App listening on port 8000 started ${new Date().toLocaleString()}`,
  );
});
