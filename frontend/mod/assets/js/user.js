import { Editable } from "./editable";
export class User extends Editable {
  static ban2String(str) {
    if (!str || new Date(str) < new Date()) {
      return "Non bannato";
    }
    const comp = new Date(str).toISOString().substring(0, 10).split("-");
    if (comp.length !== 3) return "Bannato";
    const [y, m, d] = comp;
    return `Bannato fino al ${d}-${m}-${y}`;
  }

  static ban2Date(str) {
    if (str === "Non bannato") return null;
    if (isNaN(new Date(str))) {
      const words = str.split(" ");
      const [d, m, y] = words[3].split("-");
      return `${y}-${m}-${d}`;
    }
    return new Date(str).toISOString().split("T")[0];
  }

  constructor(user) {
    if (user.quotas) {
      [user.dquota, user.wquota, user.mquota] = user.quotas.values;
    }
    user.password = "";
    super(
      [
        "username",
        "role",
        "defaultImage",
        "bio",
        "creationDate",
        "email",
        "score",
        "dquota",
        "wquota",
        "mquota",
        "password",
        "banned",
      ],
      user,
    );
    if (user.banned) this.banned = this.ban2Date();
  }

  cd2String() {
    if (!this.creationDate) return "Non disponibile";
    const comp = new Date(this.creationDate)
      .toISOString()
      .substring(0, 10)
      .split("-");
    return `${comp[2]}-${comp[1]}-${comp[0]}`;
  }

  ban2String() {
    if (this.banned === undefined) return "Non disponibile";
    return User.ban2String(this.banned);
  }
  ban2Date() {
    if (this.banned === undefined) return new Date(0);
    return User.ban2Date(this.banned);
  }
}
