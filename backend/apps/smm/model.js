const mongoose = require("mongoose");

//idea: visto che queste sono solo delle funzionalita' dal vip, essendo vip comunque occupa poca percentuale tra users, la collezione delle relazioni vip e smm saranno ancora
// di meno, ed essendo che devo fare anche richieste, e il vip deve sapere chi e' il suo smm, sembra inutile andare ad implementare una collezione per appesantire ulteriormente il database
// in questo modo prendo due piccioni con una fava
// un smm e' un utente che ha un costo, una recensione (simile alle reazioni, da 0 a 5), una lista di vip, una data di creazione, si puo fare anche consigliato con la media ponderata delle statistiche

//cosa succede quando scade all'abbonamento vip di utente? -> scadenza vip forzata, con cron
const SmmSchema = new mongoose.Schema({
  smm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  description: {
    type: String,
    ref: "User",
    required: true,
  },
  cost: {
    type: Number,
    required: true,
    default: 10,
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
  },
  currentVipCount: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  maxVipCount: {
    type: Number,
    required: true,
    min: 1,
  },
  reviewCount: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  totalRating: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  rating: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
    max: 5,
  },
});

const Smm = mongoose.model("Smm", SmmSchema, "smm");

module.exports = Smm;
