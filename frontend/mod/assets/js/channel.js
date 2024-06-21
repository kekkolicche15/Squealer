import { Editable } from "./editable";
export class Channel extends Editable {
  constructor(channel) {
    super(
      [
        "name",
        "description",
        "owner",
        "moderators",
        "privacy",
        "query",
        "popularity",
        "official",
        "temporary",
        "creationDate",
        "defaultImage",
      ],
      channel,
    );
  }
}
