import { sendRequest, url } from "/mod/js/lib";
import { User } from "/mod/js/user";
import { Modal } from "./modal";
import { ModalMedia } from "./modalMedia";

export class ModalUser extends Modal {
  constructor(
    user,
    card = undefined,
    refreshCB = undefined,
    otherRef = undefined,
  ) {
    super();
    this.user = user;
    this.card = card;
    this.refreshCB = refreshCB;
    this.fields = {};
    this.otherRef = otherRef;
  }

  prepareImage() {
    this.imgContainer = this.form.appendChild(document.createElement("div"));
    this.imgContainer.className =
      "mb-4 flex flex-col w-full items-center justify-center space-x-2";
    const img = this.imgContainer.appendChild(document.createElement("img"));
    img.className = "w-40 h-40 cursor-pointer";
    img.alt = `Immagine di profilo di ${this.user.username}`;
    img.src = `${url}/user/${
      this.user.username
    }/picture?${new Date().getTime()}`;
    img.addEventListener("click", () => {
      const modalMedia = new ModalMedia();
      const fullImg = document.createElement("img");
      fullImg.src = `${url}/user/${
        this.user.username
      }/picture?${new Date().getTime()}`;
      modalMedia.appendChild(fullImg);
      this.appendChild(modalMedia);
      modalMedia.render();
    });
    if (!this.user.defaultImage) {
      const btn = this.imgContainer.appendChild(
        document.createElement("button"),
      );
      btn.className = "text-red-500 hover:underline whitespace-nowrap";
      btn.textContent = "Rimuovi immagine del profilo";
      btn.setAttribute("type", "button");
      btn.addEventListener("click", async () => {
        const res = await sendRequest(
          new Request(`${url}/mod/user/${this.user.username}/picture`, {
            method: "DELETE",
          }),
        );
        const json = await res.json();
        if (!res.ok) this.setResult(this.error);
        else {
          this.setResult(json.response, true);
          const newImgUrl = `${url}/user/${
            this.user.username
          }/picture?${new Date().getTime()}`;
          img.src = newImgUrl;
          this.user.defaultImage = true;
          if (this.card) this.card.children[0].src = newImgUrl;
          btn.remove();
        }
      });
    }
  }

  prepareMain() {
    const container_1 = this.form.appendChild(document.createElement("div"));
    container_1.className = "flex flex-col md:flex-row md:space-x-4";

    const usernameInput = document.createElement("input");
    usernameInput.setAttribute("type", "text");
    usernameInput.setAttribute("pattern", "^(?!_+$)[a-zA-Z0-9_]{2,20}$");
    this.fields.username = this.prepareField(
      usernameInput,
      container_1,
      "Username",
      "username",
    );

    const emailInput = document.createElement("input");
    emailInput.setAttribute("type", "email");
    this.fields.email = this.prepareField(
      emailInput,
      container_1,
      "Email",
      "email",
    );

    this.fields.bio = this.prepareField(
      document.createElement("textarea"),
      this.form,
      "Bio",
      "bio",
      "^.{1,400}$",
    );

    const container_3 = this.form.appendChild(document.createElement("div"));
    container_3.className = "flex flex-col md:flex-row md:space-x-4";

    const roleSelect = document.createElement("select");
    [
      { value: "user", text: "Utente" },
      { value: "vip", text: "VIP" },
      { value: "smm", text: "Social Media Manager" },
      { value: "mod", text: "Moderator" },
    ].forEach((opt) => {
      const option = roleSelect.appendChild(document.createElement("option"));
      option.value = opt.value;
      option.textContent = opt.text;
    });
    this.fields.role = this.prepareField(
      roleSelect,
      container_3,
      "Ruolo",
      "role",
    );

    const pwdInpt = document.createElement("input");
    pwdInpt.setAttribute("type", "password");
    pwdInpt.setAttribute("pattern", "^.*.{8,}$");
    this.fields.password = this.prepareField(
      pwdInpt,
      container_3,
      "Nuova password",
      "password",
    );

    const container_4 = this.form.appendChild(document.createElement("div"));
    container_4.className = "flex flex-col md:flex-row md:space-x-4";

    const banInput = document.createElement("input");
    banInput.value = this.user.ban2String();
    banInput.setAttribute("type", "text");
    this.fields.banned = this.prepareField(
      banInput,
      container_4,
      "Ban",
      "banned",
    );
    this.fields.banned.button.addEventListener("click", () => {
      let newValue;
      if (this.fields.banned.mode === 1) {
        newValue = User.ban2Date(this.fields.banned.content.value);
        this.fields.banned.content.type = "date";
      } else {
        newValue = User.ban2String(this.fields.banned.content.value);
        this.fields.banned.content.type = "text";
      }
      this.fields.banned.content.value = newValue;
    });

    const scoreInput = document.createElement("input");
    scoreInput.setAttribute("type", "number");
    scoreInput.setAttribute("min", "0");
    this.fields.score = this.prepareField(
      scoreInput,
      container_4,
      "Punteggio",
      "score",
    );

    const container_5 = this.form.appendChild(document.createElement("div"));
    container_5.className = "flex flex-col md:flex-row md:space-x-4";

    const dquotaInput = document.createElement("input");
    dquotaInput.setAttribute("type", "number");
    dquotaInput.setAttribute("min", "0");
    this.fields.dquota = this.prepareField(
      dquotaInput,
      container_5,
      "Quota giornaliera",
      "dquota",
    );

    const wquotaInput = document.createElement("input");
    wquotaInput.setAttribute("type", "number");
    wquotaInput.setAttribute("min", "0");
    this.fields.wquota = this.prepareField(
      wquotaInput,
      container_5,
      "Quota settimanale",
      "wquota",
    );

    const container_6 = this.form.appendChild(document.createElement("div"));
    container_6.className = "flex flex-col md:flex-row md:space-x-4";

    const mquotaInput = document.createElement("input");
    mquotaInput.setAttribute("type", "number");
    mquotaInput.setAttribute("min", "0");
    this.fields.mquota = this.prepareField(
      mquotaInput,
      container_6,
      "Quota mensile",
      "mquota",
    );

    const deleteUserBtn = container_6.appendChild(
      document.createElement("button"),
    );
    deleteUserBtn.className =
      "whitespace-nowrap h-10 rounded px-3 py-2 bg-red-800 hover:bg-red-900 text-white";
    deleteUserBtn.setAttribute("type", "button");
    deleteUserBtn.textContent = "Elimina l'utente";
    deleteUserBtn.addEventListener("click", async () => {
      await sendRequest(
        new Request(`${url}/mod/user/${this.user.username}`, {
          method: "DELETE",
        }),
      );
      if (this.refreshCB) await this.refreshCB();
      this.remove();
    });
  }

  setFields() {
    for (const field in this.fields) {
      if (field === "banned")
        this.fields[field].setValue(this.user.ban2String());
      else this.fields[field].setValue(this.user[field]);
    }
  }

  saveHandler() {
    this.save.addEventListener("click", async () => {
      const edited = this.user.getDiffs(this.getEditedFields());
      if (edited.length === 0) {
        this.setResult("Non hai modificato nessun campo", false);
        return;
      }
      const invalid = edited
        .filter((e) => !e.isValid())
        .map((e) => e.toString());
      if (invalid.length !== 0) {
        this.setResult(
          `I seguenti campi non sono validi: ${invalid.join(", ")}`,
        );
        return;
      }
      const body = edited.reduce((acc, obj) => {
        return { ...acc, ...obj.getJSON() };
      }, {});
      const res = await sendRequest(
        new Request(`${url}/mod/user/${this.user.username}`, {
          method: "PATCH",
          headers: new Headers({
            "Content-Type": "application/json",
          }),
          body: JSON.stringify(body),
        }),
      );
      const json = await res.json();
      if (!res.ok) {
        this.setResult(json.error);
        return;
      }
      this.user.setFields(body);
      this.setResult(json.response, true);
      if (this.refreshCB) {
        await this.refreshCB();
        return;
      }
      if ("username" in body) {
        if (this.card) {
          const usernameContainer = this.card.querySelector(".username");
          if (usernameContainer) usernameContainer.textContent = body.username;
        }
        if (this.otherRef) {
          if ("author" in this.otherRef) this.otherRef.author = body.username;
          else if ("owner" in this.otherRef) {
            this.otherRef.owner = body.username;
          }
        }
      }
      if (this.card && "banned" in body) {
        const bannedContainer = this.card.querySelector(".banned");
        if (bannedContainer) {
          bannedContainer.textContent = this.user.ban2String();
        }
      }
    });
  }

  connectedCallback() {
    super.connectedCallback();
    this.prepareImage();
    this.prepareMain();
    this.setFields();
    this.saveHandler();
  }
}

customElements.define("modal-user", ModalUser);
