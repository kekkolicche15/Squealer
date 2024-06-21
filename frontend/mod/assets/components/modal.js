export class Modal extends HTMLElement {
  colors = ["text-red-500", "text-green-600"];

  prepareField(
    children,
    parent,
    label,
    field = undefined,
    pattern = undefined,
    doubleStep = false,
  ) {
    const labField = document.createElement("labelled-field");
    if (!Array.isArray(children)) children = [children];
    children.forEach((child) => labField.appendChild(child));
    labField.setAttribute("label", label);
    if (field) labField.setAttribute("field", field);
    if (pattern) labField.setAttribute("pattern", pattern);
    labField.setAttribute("double-step", doubleStep);
    parent.appendChild(labField);
    labField.render();
    return labField;
  }

  connectedCallback() {
    this.className =
      "fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40 overflow-auto";
    const main = this.appendChild(document.createElement("div"));
    main.className = "w-full max-h-full md:w-8/10 lg:w-7/10 xl:w-1/2";
    main.setAttribute("role", "dialog");
    const inner = main.appendChild(document.createElement("div"));
    inner.className = "w-full bg-white p-6 shadow rounded";
    this.form = inner.appendChild(document.createElement("form"));
    document.addEventListener("DOMContentLoaded", () => {
      Array.from(this.children)
        .slice(1)
        .forEach((el) => {
          this.form.appendChild(el);
        });
    });
    const separator = inner.appendChild(document.createElement("hr"));
    separator.classList = "border-gray-300 my-4";
    const footer = inner.appendChild(document.createElement("div"));
    footer.className = "flex flex-col md:flex-row items-center justify-between";
    this.result = footer.appendChild(document.createElement("p"));
    this.result.className =
      "text-left w-full md:w-3/5 overflow-y-auto whitespace-normal";
    const buttons = footer.appendChild(document.createElement("div"));
    buttons.className =
      "flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 w-full md:w-5/12";
    const close = buttons.appendChild(document.createElement("button"));
    close.className =
      "bg-gray-500 hover:bg-gray-600 flex-1 text-white px-4 py-2 rounded";
    close.innerHTML = "Chiudi";
    close.addEventListener("click", this.remove.bind(this));
    this.addEventListener("click", (event) => {
      if (event.target === this) this.remove();
    });
    this.save = buttons.appendChild(document.createElement("button"));
    this.save.className =
      "whitespace-nowrap bg-blue-800 hover:bg-blue-900 flex-1 text-white px-4 py-2 rounded";
    this.save.innerHTML = "Salva modifiche";
  }

  startTabTrap() {
    function focusFirstActive(elements) {
      for (const el of elements) {
        if (!el.disabled) {
          el.focus();
          break;
        }
      }
    }
    const baseTabIndex = 1000;
    let customTabIndex = baseTabIndex;
    const focussable = Array.from(
      this.querySelectorAll("input, button, textarea, select"),
    );
    focussable.forEach((e) => (e.tabIndex = customTabIndex++));
    focusFirstActive(focussable);
    document.addEventListener("keydown", (e) => {
      if (
        e.key === "Tab" &&
        (document.activeElement.tabIndex < baseTabIndex ||
          document.activeElement.tabIndex >= customTabIndex - 1)
      ) {
        e.preventDefault();
        focusFirstActive(focussable);
      }
    });
  }

  openModal() {
    this.classList.remove("hidden");
    document.body.classList.add("overflow-hidden");
    this.startTabTrap();
  }

  remove() {
    document.body.classList.remove("overflow-hidden");
    super.remove();
  }

  getEditedFields() {
    return this.getFields().filter((e) => e.wasChanged);
  }

  getFields() {
    return Array.from(this.querySelectorAll("labelled-field"));
  }

  setResult(message, isError = false) {
    const indexes = isError ? [1, 0] : [0, 1];
    this.result.classList.add(this.colors[indexes[0]]);
    this.result.classList.remove(this.colors[indexes[1]]);
    this.result.innerHTML = message;
  }
}

customElements.define("modal-info", Modal);
