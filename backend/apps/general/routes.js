const express = require("express");
const router = express.Router();
const path = require("path");

router.get("/patterns", (_, res) => {
  return res.status(200).json(global.data.patterns);
});
router.get("/image/:image", (req, res) => {
  return res.sendFile(
    path.join(global.data.uploads.generals.path, req.params.image),
  );
});
router.get("/const", (_, res) => {
  return res.status(200).json({
    imageQuota: global.data.uploads.image.cost,
    videoQuota: global.data.uploads.video.cost,
    ChunksizeProfileChannels: global.data.searches.CHUNKSIZE_PROFILES_CHANNELS,
    Chunksize: global.data.searches.CHUNKSIZE,
    ChunksizeAllChats: global.data.searches.CHUNKSIZE_ALLCHATS,
    ChunksizeMessages: global.data.searches.CHUNKSIZE_MESSAGES,
    ConversionRate: global.data.misc.scoreQuotaConversion,
    VipCost: global.data.misc.vipCost,
    QuotaExtra: global.data.misc.ExtraQuotas,
    externalLink: global.data.externalLink,
  });
});
module.exports = router;
