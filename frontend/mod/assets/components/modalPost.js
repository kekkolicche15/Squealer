import { normalizeNum, sendRequest, translatePop, url } from "/mod/js/lib";
import { User } from "/mod/js/user";
import { Channel } from "/mod/js/channel";
import { Modal } from "./modal";
import { ModalUser } from "./modalUser";
import { ModalChannel } from "./modalChannel";
import { ModalMedia } from "./modalMedia";

export class ModalPost extends Modal {
  constructor(post, card = undefined, refreshCB = undefined) {
    super();
    this.post = post;
    this.card = card;
    this.refreshCB = refreshCB;
    this.fields = {};
  }

  createReactionCard(symbol, reactionType) {
    const outer = document.createElement("div");
    outer.className = "w-full md:w-1/4 flex flex-col md:flex-row md:space-x-4";
    const inner = outer.appendChild(document.createElement("div"));
    inner.className =
      "flex flex-col items-center bg-gray-100 p-4 rounded-t-lg md:rounded-tl-lg -md space-y-2";
    const topSection = inner.appendChild(document.createElement("div"));
    topSection.className = "flex space-x-10";
    const symbolContainer = topSection.appendChild(
      document.createElement("label"),
    );
    symbolContainer.className = "text-3xl";
    symbolContainer.textContent = symbol;
    const counter = topSection.appendChild(document.createElement("span"));
    counter.className = "text-2xl font-semibold";
    const bottomSection = inner.appendChild(document.createElement("div"));
    bottomSection.className = "flex flex-col items-center";
    const inputValue = bottomSection.appendChild(
      document.createElement("input"),
    );
    inputValue.className =
      "w-full px-3 py-2 rounded-t-md border border-gray-300 outline-none";
    inputValue.setAttribute("aria-label", "Aggiungi reazione");
    inputValue.id = `reaction-${reactionType}`;
    inputValue.setAttribute("type", "number");
    symbolContainer.setAttribute("for", inputValue.id);
    inputValue.value = 0;
    const button = bottomSection.appendChild(document.createElement("button"));
    button.className =
      "bg-blue-800 hover:bg-blue-900 text-white px-4 py-2 w-full rounded-b-md";
    button.setAttribute("type", "button");
    button.textContent = "Aggiungi";
    button.addEventListener("click", async () => {
      const res = await sendRequest(
        new Request(`${url}/mod/post/${this.post._id}/reactions`, {
          method: "PATCH",
          headers: new Headers({
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({
            reactions: { [reactionType]: parseInt(inputValue.value) },
          }),
        }),
      );
      const json = await res.json();
      if (!res.ok) this.setResult(json.error);
      else {
        this.post.reactions[reactionType] = Math.max(
          parseInt(this.post.reactions[reactionType]) +
            parseInt(inputValue.value),
          0,
        );
        counter.textContent = normalizeNum(this.post.reactions[reactionType]);
        this.post.popularity = json.popularity;
        this.fields.popularity.setValue(translatePop(json.popularity));
        inputValue.value = 0;
        this.setResult(json.response, true);
      }
    });
    return [outer, counter];
  }

  prepareMain() {
    const container_1 = this.form.appendChild(document.createElement("div"));
    container_1.className = "flex flex-col md:flex-row md:space-x-4";

    const authorSpan = document.createElement("span");
    authorSpan.className = "underline cursor-pointer";
    authorSpan.addEventListener("click", async () => {
      const res = await sendRequest(
        new Request(`${url}/mod/user/${authorSpan.textContent}/info?view=mod`),
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
          new ModalUser(new User(json), this.card, this.refreshCB, this.post),
        )
        .openModal();
    });
    this.fields.author = this.prepareField(authorSpan, container_1, "Autore");

    const channelSpan = document.createElement("span");
    channelSpan.className = "underline cursor-pointer";
    channelSpan.addEventListener("click", async () => {
      const res = await sendRequest(
        new Request(`${url}/channel/${encodeURIComponent(channelSpan.textContent)}?view=mod`),
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
          new ModalChannel(
            new Channel(json),
            this.card,
            this.refreshCB,
            this.post,
          ),
        )
        .openModal();
    });
    this.fields.channel = this.prepareField(channelSpan, container_1, "Canale");

    const container_2 = this.form.appendChild(document.createElement("div"));
    container_2.className = "flex flex-col md:flex-row md:space-x-4";

    if (this.post.content) {
      this.fields.content = this.prepareField(
        document.createElement("span"),
        container_2,
        "Contenuto",
      );
    }

    if (this.post.contentType !== "text") {
      container_2.classList.add("mb-4");
      const displayAttachment = container_2.appendChild(
        document.createElement("button"),
      );
      displayAttachment.className =
        "bg-blue-800 hover:bg-blue-900 text-white h-full w-full px-4 py-2 rounded";
      if (this.post.content){
        displayAttachment.classList.add("md:w-1/5")
      }
      displayAttachment.textContent = "Mostra allegato";
      displayAttachment.setAttribute("type", "button");
      displayAttachment.addEventListener("click", () => {
        const modalMedia = new ModalMedia();
        let attachment = undefined;
        if (this.post.contentType === "image") {
          attachment = document.createElement("img");
          attachment.src = `${url}/post/${this.post._id}/attachment`;
        } else {
          attachment = document.createElement("video");
          attachment.setAttribute("controls", "");
          const source = attachment.appendChild(
            document.createElement("source"),
          );
          source.src = `${url}/post/${this.post._id}/attachment`;
          attachment.appendChild(
            document.createTextNode("Non puoi riprodurre questo video"),
          );
        }
        modalMedia.appendChild(attachment);
        this.appendChild(modalMedia);
        modalMedia.render();
      });
    }

    const container_3 = this.form.appendChild(document.createElement("div"));
    container_3.className = "flex flex-col md:flex-row md:space-x-4";

    this.fields.creationDate = this.prepareField(
      document.createElement("span"),
      container_3,
      "Data di creazione",
    );

    const viewsInput = document.createElement("input");
    viewsInput.setAttribute("type", "number");
    this.fields.views = this.prepareField(
      viewsInput,
      container_3,
      "Visualizzazioni",
      "views",
    );

    const reactionsContainer = document.createElement("div");

    const positiveReactions = reactionsContainer.appendChild(
      document.createElement("div"),
    );
    positiveReactions.className = "flex flex-col md:flex-row";
    const negativeReactions = reactionsContainer.appendChild(
      document.createElement("div"),
    );
    negativeReactions.className = "flex flex-col md:flex-row";
    this.fields.reactions = {};
    const items = [
      ["😕", -1],
      ["🙁", -2],
      ["😢", -3],
      ["🤮", -4],
      ["🙂", 1],
      ["😁", 2],
      ["😍", 3],
      ["🤯", 4],
    ];
    for (const item of items) {
      const [outer, value] = this.createReactionCard(...item);
      if (item[1] > 0) positiveReactions.appendChild(outer);
      else negativeReactions.appendChild(outer);
      this.fields.reactions[item[1]] = value;
    }

    this.prepareField(reactionsContainer, this.form, "Reazioni");
    const container_5 = this.form.appendChild(document.createElement("div"));
    container_5.className = "flex flex-col md:flex-row md:space-x-4";
    this.fields.popularity = this.prepareField(
      document.createElement("span"),
      container_5,
      "Popolarit&agrave;",
    );

    const deletePost = container_5.appendChild(
      document.createElement("button"),
    );
    deletePost.className =
      "whitespace-nowrap h-10 rounded px-3 py-2 bg-red-800 hover:bg-red-900 text-white";
    deletePost.textContent = "Elimina il post";
    deletePost.setAttribute("type", "button");
    deletePost.addEventListener("click", async () => {
      await sendRequest(
        new Request(`${url}/mod/post/${this.post._id}`, {
          method: "DELETE",
        }),
      );
      if (this.refreshCB) await this.refreshCB();
      this.remove();
    });
  }

  parseContent = (content, references) => {
    for (const key in references) {
      if (references.hasOwnProperty(key)) {
        const refVal = key.replace(/!/g, '');
        const anchor = `<a href="${references[key]}">${refVal.charAt(0)}/${refVal.slice(1)}</a>`;
        while (content.indexOf(key) !== -1) {
          content = content.replace(key, anchor);
        }
      }
    }
    return `<span>${content}</span>`;
  }

  setFields() {
    this.fields.author.setValue(this.post.author);
    this.fields.channel.setValue(this.post.channel);
    if (this.fields.content) {
      this.fields.content.innerHTML = this.parseContent(this.post.content, this.post.references);
      this.fields.content.querySelectorAll("a").forEach((a) => {
        a.classList.add("underline", "cursor-pointer", "text-blue-800", "hover:text-blue-900");
      });
    }
    this.fields.creationDate.setValue(
      new Intl.DateTimeFormat("it-IT", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
        hour: "numeric",
        minute: "numeric",
      }).format(new Date(this.post.createdAt)),
    );
    this.fields.views.setValue(this.post.views);
    this.fields.popularity.setValue(translatePop(this.post.popularity));
    for (const reaction in this.post.reactions) {
      this.fields.reactions[reaction].textContent = normalizeNum(
        this.post.reactions[reaction],
      );
    }
  }

  saveHandler() {
    this.save.addEventListener("click", async () => {
      const views = this.fields.views.value;
      if (isNaN(parseInt(views))) {
        this.setResult("Numero di visualizzazioni inserito non valido");
        return;
      }
      const res = await sendRequest(
        new Request(`${url}/mod/post/${this.post._id}/views`, {
          method: "PATCH",
          headers: new Headers({
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({ views }),
        }),
      );
      const json = await res.json();
      if (!res.ok) this.setResult(json.error);
      else {
        this.setResult(json.response, true);
        this.post.popularity = json.popularity;
        this.fields.popularity.setValue(translatePop(json.popularity));
        this.post.views = views;
      }
    });
  }

  connectedCallback() {
    super.connectedCallback();
    this.prepareMain();
    this.setFields();
    this.saveHandler();
  }
}

customElements.define("modal-post", ModalPost);
