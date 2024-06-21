const express = require("express");
const router = express.Router();
const path = require("path");
const { RequestError } = require(`${global.dirs.libraries}/utils`);
const fse = require("fs-extra");
const Auth = require(`${global.dirs.libraries}/auth`);
const asyncHandler = require("express-async-handler");
const User = require(`${global.dirs.apps.be.user}/model`);

router.use((req, _, next) => {
  if (req.headers["accept-language"] === "en") req.lan = "en";
  else req.lan = "it";
  for (const key in req.params) {
    req.params[key] = decodeURIComponent(req.params[key]);
  }
  for (const key in req.query) {
    if (key !== "location") req.query[key] = decodeURIComponent(req.query[key]);
    else req.query[key] = encodeURIComponent(req.query[key]);
  }
  if (
    req.query.page !== undefined &&
    (isNaN(parseInt(req.query.page)) || req.query.page <= 0)
  ) {
    throw new RequestError(400, "format", "BAD_PAGE");
  }

  next();
});

router.get("/favicon", (_, res) => {
  res.sendFile(path.join(global.dirs.root, "public", "favicon.ico"));
});

router.get("/smm/", (_, res) => {
  res.sendFile(path.join(global.dirs.apps.fe.smm, "index.html"));
});

router.get("/smm/:file/", async (req, res) => {
  if (await fse.pathExists(path.join(global.dirs.apps.fe.smm, req.params.file)))
    res.sendFile(path.join(global.dirs.apps.fe.smm, req.params.file));
  else
    res.sendFile(path.join(global.dirs.apps.fe.smm, "index.html"));
});

router.get("/smm/:file1/:file2/", async (req, res) => {
    res.sendFile(path.join(global.dirs.apps.fe.smm, "index.html"));
});

router.get("/smm/:file1/:file2/:file3/", async (req, res) => {
    res.sendFile(path.join(global.dirs.apps.fe.smm, "index.html"));
});

router.get("/smm/:file1/:file2/:file3/:file4/", async (req, res) => {
    res.sendFile(path.join(global.dirs.apps.fe.smm, "index.html"));
});

router.get("/smm/:file1/:file2/:file3/:file4/:file5/", async (req, res) => {
    res.sendFile(path.join(global.dirs.apps.fe.smm, "index.html"));
});

router.get("/mod/", (_, res) => {
  res.sendFile(path.join(global.dirs.apps.fe.mod, "users.html"));
});

router.get("/mod/components/:file", (req, res) => {
  res.sendFile(
    path.join(
      global.dirs.apps.fe.mod,
      "assets",
      "components",
      `${req.params.file}.js`
    )
  );
});

router.get("/mod/js/:file", (req, res) => {
  res.sendFile(
    path.join(global.dirs.apps.fe.mod, "assets", "js", `${req.params.file}.js`)
  );
});

router.get("/mod/:file", (req, res) => {
  res.sendFile(path.join(global.dirs.apps.fe.mod, `${req.params.file}.html`));
});

router.get("/", (_, res) => {
  res.sendFile(path.join(global.dirs.apps.fe.user, "index.html"));
});

router.get("/:file", async (req, res, next) => {
  if (req.params.file === "verified") {
    try {
      await User.activateAccount(req.query.code);
    } catch (e) {
      return res.redirect("/notfound");
    }
  } else if (
    req.params.file === "recover" &&
    (!req.query.code || !(await User.findOne({ passwdReset: req.query.code })))
  ) return res.redirect("/notfound");
  res.sendFile(path.join(global.dirs.apps.fe.user, "index.html"));
});

router.get("/app/:file", (req, res) => {
  res.sendFile(path.join(global.dirs.apps.fe.user, req.params.file));
});

router.use("/api/user/",
  require(path.join(global.dirs.apps.be.user, "routes"))
);
router.use("/api/general/",
  require(path.join(global.dirs.apps.be.general, "routes"))
);
router.use("/api/channel/",
  require(path.join(global.dirs.apps.be.channel, "routes"))
);

router.use("/api/post/",
  require(path.join(global.dirs.apps.be.post, "routes"))
);
router.use("/api/notification/",
  require(path.join(global.dirs.apps.be.notification, "routes"))
);
router.use("/api/message/",
  require(path.join(global.dirs.apps.be.message, "routes"))
);
router.use("/api/mod",
  Auth.requireToken,
  Auth.checkRole(global.roles.mod),
  require(path.join(global.dirs.apps.be.mod, "routes"))
);
router.use("/api/smm",
  Auth.requireToken,
  Auth.checkRole(global.roles.vip),
  require(path.join(global.dirs.apps.be.smm, "routes"))
);

router.use(
  asyncHandler((req, res, _next) => {
    res.sendFile(path.join(global.dirs.apps.fe.user, "index.html"));
    // throw new RequestError(404, "misc", "BAD_ROUTE");
  })
);

router.use(async function (err, req, res, _) {
  console.error(err);
  res.locals.message = err.message;
  res.locals.error = err;
  const status = isNaN(parseInt(err.code)) ? 500 : err.code;
  const error =
    global.strings[req.lan]?.[err.code?.toString()]?.[err.mod]?.[err.str] ||
    global.strings[req.lan]["500"].misc.GENERIC_ERROR;
  console.error(`${req.method} ${req.url} ${status} ${error}`);
  if (req.file) await fse.unlink(req.file.path);
  try{
    return res.status(status).json({ error });
  }
  catch(e){
    return res.status(500).json({ error });
  }
});

module.exports = router;
