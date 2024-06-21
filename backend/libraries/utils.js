const sharp = require("sharp");
const multer = require("multer");

class RequestError extends Error {
  constructor(code, mod, str) {
    super();
    this.code = code;
    this.mod = mod;
    this.str = str;
  }
}
exports.RequestError = RequestError;

exports.sendResponse = (res, status, content) => {
  return res
    .status(status)
    .json(typeof content === "object" ? content : { response: content });
};

exports.generateFilename = (name) => {
  const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  return `${uniqueName}.${name.split(".").pop()}`;
};

exports.adjustImage = async (
  data,
  output,
  maxWidth = 1024,
  maxHeight = 1024,
) => {
  const { width: inputWidth, height: inputHeight } = await sharp(
    data.path,
  ).metadata();
  const aspectRatio = inputWidth / inputHeight;
  const newWidth = Math.round(Math.max(maxWidth, aspectRatio * maxWidth));
  const newHeight = Math.round(Math.max(maxHeight / aspectRatio, maxHeight));
  const input = await sharp(data.path)
    .resize({
      width: newWidth,
      height: newHeight,
      fit: sharp.fit.inside,
    })
    .toBuffer();
  const left = Math.max(0, Math.floor((newWidth - maxHeight) / 2));
  const top = Math.max(0, Math.floor((newHeight - maxHeight) / 2));
  await sharp(input)
    .extract({
      top,
      left,
      width: maxHeight,
      height: maxHeight,
    })
    .toFile(output);
};

exports.uploadUserPicture = multer({
  storage: multer.diskStorage({
    destination: global.data.uploads.users.path,
    filename: (_, file, cb) => {
      cb(null, exports.generateFilename(file.originalname));
    },
  }),
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      req.body.error = new RequestError(400, "file", "BAD_TYPE");
    } else if (
      req.headers["content-length"] > global.data.uploads.image.maxSize
    )
      req.body.error = new RequestError(400, "file", "BAD_SIZE");
    cb(null, !req.body.error);
  },
});

exports.uploadChannelPicture = multer({
  storage: multer.diskStorage({
    destination: global.data.uploads.channels.path,
    filename: (_, file, cb) => {
      cb(null, exports.generateFilename(file.originalname));
    },
  }),
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      req.body.error = new RequestError(400, "file", "BAD_TYPE");
    } else if (
      req.headers["content-length"] > global.data.uploads.image.maxSize
    )
      req.body.error = new RequestError(400, "file", "BAD_SIZE");
    cb(null, !req.body.error);
  },
});

exports.uploadPostAttachment = multer({
  storage: multer.diskStorage({
    destination: global.data.uploads.posts.path,
    filename: (_, file, cb) => {
      cb(null, exports.generateFilename(file.originalname));
    },
  }),
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/") && !(file.mimetype === "video/mp4"))
      req.body.error = new RequestError(400, "file", "BAD_TYPE");
    else if (
      file.mimetype.startsWith("image/") &&
      req.headers["content-length"] > global.data.uploads.image.maxSize
    )
      req.body.error = new RequestError(400, "file", "BAD_SIZE");
    else if (req.headers["content-length"] > global.data.uploads.video.maxSize)
      req.body.error = new RequestError(400, "file", "BAD_SIZE");
    cb(null, !req.body.error);
  },
});

// exports.uploadMessageAttachment = multer(
//   {
//     storage: multer.diskStorage({
//       destination: global.data.uploads.messages.path,
//       filename: (_, file, cb) => {
//         cb(null, exports.generateFilename(file.originalname));
//       },
//     }),
//     fileFilter: (req, file, cb) => {
//       if (
//         !file.mimetype.startsWith("image/") && !(file.mimetype === "video/mp4")
//       ) req.body.error = new RequestError(400, "file", "BAD_TYPE");
//       else if (
//         file.mimetype.startsWith("image/") &&
//         req.headers["content-length"] > global.data.uploads.image.maxSize
//       ) req.body.error = new RequestError(400, "file", "BAD_SIZE");
//       else if (
//         req.headers["content-length"] > global.data.uploads.video.maxSize
//       ) req.body.error = new RequestError(400, "file", "BAD_SIZE");
//       cb(null, !req.body.error);
//     },
//   },
// );

exports.uploadMessageAttachment = multer({
  storage: multer.diskStorage({
    destination: global.data.uploads.messages.path,
    filename: (_, file, cb) => {
      cb(null, exports.generateFilename(file.originalname));
    },
  }),
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/") && !(file.mimetype === "video/mp4"))
      throw new Error("BAD_TYPE");
    else if (
      file.mimetype.startsWith("image/") &&
      req.headers["content-length"] > global.data.uploads.image.maxSize
    )
      throw new Error("BAD_SIZE");
    else if (req.headers["content-length"] > global.data.uploads.video.maxSize)
      throw new Error("BAD_SIZE");
    cb(null, !req.body.error);
  },
});

exports.calcQuotaWithModifiers = (quota, modifier) => {
  return Math.max(Math.min(quota + modifier, 2 * quota), 0);
};

exports.calcPop = (RP, RM, CM) => {
  if (CM === 0 || (RP < CM && RM < CM)) return "normal";
  if (RP > CM && RM > CM) return "controversial";
  if (RP > CM) return "popular";
  return "unpopular";
};

