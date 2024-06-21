import { sendRequest, url } from "/mod/js/lib";
import { Modal } from "./modal";

export class ModalChannelCreate extends Modal {
  constructor(refreshCB = undefined) {
    super();
    this.refreshCB = refreshCB;
    this.fields = {};
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

    const fileDisplayer = document.createElement("span");
    fileDisplayer.className = "h-10 overflow-hidden truncate";
    fileDisplayer.textContent = "Nessun file selezionato";
    this.fileInput = document.createElement("input");
    this.fileInput.setAttribute("type", "file");
    this.fileInput.setAttribute("accept", ".jpg, .jpeg, .png");
    this.fileInput.className = "hidden";
    this.fields.file = this.prepareField(
      [fileDisplayer, this.fileInput],
      container_1,
      "Immagine del canale",
      "file",
      undefined,
      true,
    );
    this.fileInput.addEventListener("change", function (e) {
      if (this.files.length > 0) {
        e.target.parentNode.setValue(this.files[0].name);
        e.target.parentNode.wasChanged = true;
      } else e.target.parentNode.setValue("Nessun file selezionato");
    });
    this.fields.file.button.addEventListener("click", () => {
      this.fileInput.click();
    });

    this.fields.description = this.prepareField(
      document.createElement("textarea"),
      this.form,
      "Descrizione",
      "description",
    );

    const queryInput = document.createElement("input");
    queryInput.setAttribute("type", "text");
    queryInput.setAttribute("pattern", "^\\?([^&]+=[^&]+(&[^&]+=[^&]+)*)$");
    this.fields.query = this.prepareField(
      queryInput,
      this.form,
      "Query del canale",
      "query",
    );
  }

  saveHandler() {
    this.save.addEventListener("click", async () => {
      const missing = [];
      const invalid = [];
      for (const field in this.fields) {
        if (field !== "file") {
          if (!this.fields[field].value) {
            missing.push(this.fields[field].toString());
          }
          if (!this.fields[field].isValid()) {
            invalid.push(this.fields[field].toString());
          }
        }
      }
      if (missing.length > 0) {
        this.setResult(
          `Non hai inserito i seguenti campi: ${missing.join(", ")}`,
        );
      }
      if (invalid.length > 0) {
        this.setResult(
          `I seguenti campi non sono validi: ${invalid.join(", ")}`,
        );
      }
      const formData = new FormData();
      const file = this.fileInput.files[0];
      if (file) formData.append("image", file);
      for (const field in this.fields) {
        if (field !== "file") formData.append(field, this.fields[field].value);
      }
      const res = await sendRequest(
        new Request(`${url}/mod/channel`, {
          method: "POST",
          body: formData,
        }),
      );
      const json = await res.json();
      if (!res.ok) this.setResult(json.error);
      else {
        this.setResult(json.response, true);
        if (this.refreshCB) await this.refreshCB();
      }
    });
  }

  connectedCallback() {
    super.connectedCallback();
    this.prepareMain();
    this.saveHandler();
  }
}

customElements.define("modal-channel-create", ModalChannelCreate);
