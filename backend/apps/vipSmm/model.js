const mongoose = require("mongoose");

//idea: visto che queste sono solo delle funzionalita' dal vip, essendo vip comunque occupa poca percentuale tra users, la collezione delle relazioni vip e smm saranno ancora
// di meno, ed essendo che devo fare anche richieste, e il vip deve sapere chi e' il suo smm, sembra inutile andare ad implementare una collezione per appesantire ulteriormente il database
// in questo modo prendo due piccioni con una fava

const VipSmmSchema = new mongoose.Schema({
  vip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  smm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["accepted", "waiting"],
    required: true,
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

const VipSmm = mongoose.model("VipSmm", VipSmmSchema, "vipsmm");

module.exports = VipSmm;
