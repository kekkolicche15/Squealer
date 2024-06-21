class PageNavigator extends HTMLElement {
  constructor() {
    super();
    this.beforeCurrent = 2;
    this.afterCurrent = 2;
  }

  connectedCallback() {
    this.currentPage = parseInt(this.getAttribute("current-page")) || 1;
    this.pageNumber = parseInt(this.getAttribute("page-number")) || 1;
    this.firstPageButton = this.createButton(
      "«",
      "bg-blue-800 hover:bg-blue-900 font-bold py-2 px-4 rounded-md hover:bg-blue-900 mr-5",
      1,
    );
    this.firstPageButton.setAttribute("type", "button");
    this.firstPageButton.addEventListener("click", () => {
      this.currentPage = 1;
    });
    this.firstPageButton.setAttribute("aria-label", "Vai alla prima pagina");
    this.lastPageButton = this.createButton(
      "»",
      "bg-blue-800 hover:bg-blue-900 font-bold py-2 px-4 rounded-md hover:bg-blue-900 ml-5",
      this.pageNumber,
    );
    this.lastPageButton.setAttribute("type", "button");
    this.lastPageButton.addEventListener("click", () => {
      this.currentPage = this.pageNumber;
    });
    this.lastPageButton.setAttribute("aria-label", "Vai all'ultima pagina");
    this.render();
  }

  render() {
    this.innerHTML = "";
    const lowerBound = Math.max(1, this.currentPage - this.beforeCurrent);
    const upperBound = Math.min(
      this.pageNumber,
      this.currentPage + this.afterCurrent,
    );
    this.className += " mt-6 flex justify-center items-center text-white";
    if (lowerBound > 1) {
      this.appendChild(this.firstPageButton);
    }
    this.appendChild(
      this.createMainButtons(lowerBound, upperBound, this.currentPage),
    );
    if (upperBound < this.pageNumber) {
      this.appendChild(this.lastPageButton);
    }
  }

  createButton(pageNumber, className, value) {
    const button = document.createElement("button");
    button.textContent = pageNumber;
    button.className = className;
    button.value = value;
    button.setAttribute("type", "button");
    return button;
  }

  createMainButtons(lowerBound, upperBound, currentPage) {
    const mainButtonsDiv = document.createElement("div");
    mainButtonsDiv.className = "page-button flex rounded-md shadow-xl";
    for (let i = lowerBound; i <= upperBound; i++) {
      let buttonClassName = "font-bold py-2 px-4";
      if (i === currentPage) {
        buttonClassName += " bg-blue-900 cursor-not-allowed";
      } else buttonClassName += " bg-blue-800 hover:bg-blue-900";
      if (i === lowerBound) buttonClassName += " rounded-l-md";
      if (i === upperBound) buttonClassName += " rounded-r-md";
      const button = this.createButton(i, buttonClassName, i);
      if (i === currentPage) button.setAttribute("disabled", true);
      else {
        button.addEventListener("click", () => {
          this.currentPage = i;
        });
      }
      mainButtonsDiv.appendChild(button);
    }
    return mainButtonsDiv;
  }
}
customElements.define("page-navigator", PageNavigator);
