export class ModalMedia extends HTMLElement {
  render() {
    if (this.children.length === 0) throw new Error("missing content");
    const content = this.children[0];
    this.className =
      "fixed inset-0 flex items-center justify-center z-100 bg-black bg-opacity-40 overflow-auto";
    const main = this.appendChild(document.createElement("div"));
    main.className = "w-full md:w-3/4 xl:w-1/3 bg-white rounded p-5";
    main.appendChild(content);
    content.classList.add("m-auto");
    this.addEventListener("click", (event) => {
      if (event.target === this) {
        this.remove();
      }
    });
  }
}

customElements.define("modal-media", ModalMedia);
