export class LabelledField extends HTMLElement {
  normColors = ["bg-green-800", "bg-blue-800"];
  hoverColors = ["hover:bg-green-900", "hover:bg-blue-900"];
  unlabelledFields = ["SPAN", "UL", "DIV"];

  connectedCallback() {
    document.addEventListener("DOMContentLoaded", this.render.bind(this));
  }
  render() {
    if (this.children.length === 0) throw new Error("missing content");
    if (!this.getAttribute("label")) throw new Error("missing label");
    this.className = "relative mb-4 w-full flex flex-col items-stretch";
    this.content = this.children[0];
    const label = this.appendChild(document.createElement(this.unlabelledFields.includes(this.content.tagName)? "span" : "label"));
    label.className =
      "text-xs truncate absolute -top-2 left-3 bg-white px-1 rounded border border-gray-300";
    label.innerHTML = this.getAttribute("label") || "label";
    const contentContainer = this.appendChild(document.createElement("div"));
    contentContainer.className =
      "flex items-center rounded border border-gray-300 field-container";
    contentContainer.appendChild(this.content);
    this.content.className += " w-full px-3 py-2";
    if (!this.content.id) {
      this.content.id = `${label.innerHTML.toLowerCase().replaceAll(" ", "")}-${Math.floor(1e7 + Math.random() * 9e7).toString()}`;
    }
    if (!["SPAN", "UL"].includes(this.content.tagName))
        label.setAttribute("for", this.content.id);
    this.field = this.getAttribute("field");
    if (this.field) {
      this.button = contentContainer.appendChild(
        document.createElement("button"),
      );
      this.button.type = "button";
      this.button.className =
        "whitespace-nowrap rounded-r px-4 bg-blue-800 hover:bg-blue-900 text-center text-white";
      if (this.content.tagName === "TEXTAREA") {
        this.button.classList.add("py-9");
        this.content.rows = 3;
        this.content.className +=
          " block overflow-y-auto resize-none outline-none word-wrap";
      } else if (["INPUT", "SELECT", "SPAN"].includes(this.content.tagName)) {
        this.button.classList.add("py-2");
        this.content.className += " block bg-transparent outline-none";
      }
      this.button.innerHTML = "Modifica";
      this.mode = 0;
      this.value = this.content.value;
      this.wasChanged = false;
      this.content.disabled = true;
      this.button.addEventListener("click", this.changeFieldMode.bind(this));
    }
  }

  isValid() {
    if (
      !this.content.validity ||
      (!this.getAttribute("pattern") && this.content.validity.valid)
    ) {
      return true;
    }
    return (
      this.content.validity.valid &&
      new RegExp(this.getAttribute("pattern")).test(this.value)
    );
  }

  changeFieldMode() {
    const ds = this.getAttribute("double-step");
    if (!ds || !JSON.parse(ds)) {
      if (this.mode === 0) {
        this.button.innerHTML = "Conferma";
        this.button.classList.replace(...[...this.normColors].reverse());
        this.button.classList.replace(...[...this.hoverColors].reverse());
        if (this.content.tagName !== "SPAN") this.content.disabled = false;
        this.mode = 1;
      } else {
        this.button.innerHTML = "Modifica";
        this.button.classList.replace(...this.normColors);
        this.button.classList.replace(...this.hoverColors);
        if (this.content.tagName !== "SPAN") this.content.disabled = true;
        this.mode = 0;
        this.value = this.content.value;
        this.wasChanged = true;
      }
    }
  }

  getJSON() {
    if (!this.field) return undefined;
    return { [this.field]: this.value };
  }

  setValue(value) {
    if (value !== undefined && value !== null) {
      if (this.content.tagName === "SPAN") this.content.innerHTML = value;
      else this.content.value = value;
    }
  }

  toString() {
    return this.getAttribute("label").toLowerCase();
  }
}

customElements.define("labelled-field", LabelledField);
