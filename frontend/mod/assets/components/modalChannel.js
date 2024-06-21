import { sendRequest, translatePop, url } from "/mod/js/lib";
import { User } from "/mod/js/user";
import { Modal } from "./modal";
import { ModalUser } from "./modalUser";
import { ModalMedia } from "./modalMedia";

export class ModalChannel extends Modal {
  constructor(
    channel,
    card = undefined,
    refreshCB = undefined,
    postRef = undefined,
  ) {
    super();
    this.channel = channel;
    this.card = card;
    this.refreshCB = refreshCB;
    this.fields = {};
    this.postRef = postRef;
  }

  prepareImage() {
    this.imgContainer = this.form.appendChild(document.createElement("div"));
    this.imgContainer.className =
      "mb-4 flex flex-col w-full items-center justify-center space-x-2";
    const img = this.imgContainer.appendChild(document.createElement("img"));
    img.className = "w-40 h-40 cursor-pointer";
    img.alt = `Immagine del canale ${this.channel.name}`;
    img.src = `${url}/channel/${
      encodeURIComponent(this.channel.name)
    }/picture/preview?${new Date().getTime()}`;
    img.addEventListener("click", () => {
      const modalMedia = new ModalMedia();
      const fullImg = document.createElement("img");
      fullImg.src = `${url}/channel/${
          encodeURIComponent(this.channel.name)
      }/picture?${new Date().getTime()}`;
      modalMedia.appendChild(fullImg);
      this.appendChild(modalMedia);
      modalMedia.render();
    });
    if (!this.channel.defaultImage && !this.channel.temporary) {
      const btn = this.imgContainer.appendChild(
        document.createElement("button"),
      );
      btn.className = "text-red-500 hover:underline whitespace-nowrap";
      btn.textContent = "Rimuovi immagine del canale";
      btn.setAttribute("type", "button");
      btn.addEventListener("click", async () => {
        const res = await sendRequest(
          new Request(`${url}/channel/${encodeURIComponent(this.channel.name)}/picture`, {
            method: "DELETE",
          }),
        );
        const json = await res.json();
        if (!res.ok) this.setResult(this.error);
        else {
          this.setResult(json.response, true);
          const newImgUrl = `${url}/channel/${
            encodeURIComponent(this.channel.name)
          }/picture/preview?${new Date().getTime()}`;
          img.src = newImgUrl;
          this.channel.defaultImage = true;
          if (this.card) this.card.children[0].src = newImgUrl;
          btn.remove();
        }
      });
    }
  }

  prepareMain() {
    const container_1 = this.form.appendChild(document.createElement("div"));
    container_1.className = "flex flex-col md:flex-row md:space-x-4";

    const nameInput = document.createElement("input");
    nameInput.setAttribute("type", "text");
    nameInput.setAttribute("pattern", "^(?!_+$)[a-zA-Z0-9_]{4,20}$");
    this.fields.name = this.prepareField(
      nameInput,
      container_1,
      "Nome",
      "name",
    );

    const privacySelect = document.createElement("select");
    [
      { value: "public", text: "Pubblico" },
      { value: "private", text: "Privato" },
    ].forEach((opt) => {
      const option = privacySelect.appendChild(
        document.createElement("option"),
      );
      option.value = opt.value;
      option.textContent = opt.text;
    });
    this.fields.privacy = this.prepareField(
      privacySelect,
      container_1,
      "Privacy",
      "privacy",
    );

    this.fields.description = this.prepareField(
      document.createElement("textarea"),
      this.form,
      "Descrizione",
      "description",
      "^.{1,400}$",
    );

    const queryinput = document.createElement("input");
    queryinput.setAttribute("type", "text");
    queryinput.setAttribute("pattern", "^\\?([^&]+=[^&]+(&[^&]+=[^&]+)*)$");
    this.fields.query = this.prepareField(
      queryinput,
      this.form,
      "Query del canale",
      "query",
    );

    const container_4 = this.form.appendChild(document.createElement("div"));
    container_4.className = "flex flex-col md:flex-row md:space-x-4";

    const container_4_sub_1 = container_4.appendChild(
      document.createElement("div"),
    );
    container_4_sub_1.className = "flex w-full flex-col";

    const ownerSpan = document.createElement("span");
    ownerSpan.className = "underline cursor-pointer";
    ownerSpan.addEventListener("click", async () => {
      const res = await sendRequest(
        new Request(`${url}/mod/user/${ownerSpan.textContent}/info?view=mod`),
      );
      const json = await res.json();
      if (!res.ok) {
        this.setResult(json.error);
        return;
      }
      this.remove();
      document
        .querySelector("body")
        .appendChild(
          new ModalUser(
            new User(json),
            undefined,
            this.refreshCB,
            this.channel,
          ),
        )
        .openModal();
    });

    this.fields.owner = this.prepareField(
      ownerSpan,
      container_4_sub_1,
      "Proprietario",
    );

    this.fields.popularity = this.prepareField(
      document.createElement("span"),
      container_4_sub_1,
      "Popolarit&agrave;",
    );

    const container_4_sub_2 = container_4_sub_1.appendChild(
      document.createElement("div"),
    );
    container_4_sub_2.className = "flex flex-col md:flex-row md:space-x-4";

    this.fields.official = this.prepareField(
      document.createElement("span"),
      container_4_sub_2,
      "Ufficiale",
    );
    this.fields.temporary = this.prepareField(
      document.createElement("span"),
      container_4_sub_2,
      "Temporaneo",
    );

    const deleteChannelBtn = container_4_sub_1.appendChild(
      document.createElement("button"),
    );
    deleteChannelBtn.className =
      "whitespace-nowrap rounded-r px-3 py-2 bg-red-800 hover:bg-red-900 text-center text-white";
    deleteChannelBtn.setAttribute("type", "button");
    deleteChannelBtn.textContent = "Elimina il canale";
    deleteChannelBtn.addEventListener("click", async () => {
      await sendRequest(
        new Request(`${url}/mod/channel/${encodeURIComponent(this.channel.name)}`, {
          method: "DELETE",
        }),
      );
      if (this.refreshCB) await this.refreshCB();
      this.remove();
    });
    const modsList = document.createElement("ul");
    modsList.className = "overflow-y-auto max-h-52";
    this.fields.moderators = this.prepareField(
      modsList,
      container_4,
      "Moderatori",
    );
    this.fields.moderators.classList.add("my-3", "md:my-0");
  }

  setFields() {
    const auto = ["name", "privacy", "description", "query", "owner"];
    for (const field of auto) {
      this.fields[field].setValue(this.channel[field] || "Nessuno");
    }
    this.fields.popularity.setValue(translatePop(this.channel.popularity));
    this.fields.official.setValue(this.channel.official ? "S&igrave;" : "No");
    this.fields.temporary.setValue(this.channel.temporary ? "S&igrave;" : "No");
    if (!this.channel.moderators || this.channel.moderators.length === 0) {
      const noMods = this.fields.moderators.content.appendChild(
        document.createElement("li"),
      );
      noMods.textContent = "Nessun moderatore trovato";
    } else {
      for (const mod of this.channel.moderators) {
        const li = this.fields.moderators.content.appendChild(
          document.createElement("li"),
        );
        li.textContent = mod;
      }
    }
  }

  saveHandler() {
    this.save.addEventListener("click", async () => {
      const edited = this.channel.getDiffs(this.getEditedFields());
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
        new Request(`${url}/mod/channel/${encodeURIComponent(this.channel.name)}`, {
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
      this.setResult(json.response, true);
      if ("name" in body) {
        if (this.card) {
          const nameContainer = this.card.querySelector(".channelname");
          if (nameContainer) nameContainer.textContent = body.name;
        }
        if (this.postRef) this.postRef.channel = body.name;
        this.fields.query.setValue(
          this.fields.query.content.value.replace(
            `channel=${decodeURIComponent(this.channel.name)}`,
            `channel=${body.name}`,
          ),
          (this.channel.query = body.name),
        );
      }
      this.channel.setFields(body);
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

customElements.define("modal-channel", ModalChannel);
