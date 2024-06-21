import { sendRequest, url } from "/mod/js/lib";

class Header extends HTMLElement {
  constructor() {
    super();
    this.sections = [
      { ref: "/mod/", name: "Utenti" },
      { ref: "/mod/channels", name: "Canali" },
      { ref: "/mod/posts", name: "Post" },
    ];
  }
  connectedCallback() {
    const selected = this.getAttribute("selected") || null;
    this.innerHTML = "";
    const nav = this.appendChild(document.createElement("nav"));
    nav.classList = "bg-white p-6 shadow flex justify-between items-center";
    nav.setAttribute("role", "navigation");
    const div = nav.appendChild(document.createElement("div"));
    div.classList = "flex space-x-4";
    const title = div.appendChild(document.createElement("h1"));
    title.classList = "text-2xl font-bold";
    title.innerText = "Squealer";
    const ul = div.appendChild(document.createElement("ul"));
    ul.classList = "flex space-x-4";
    for (let i = 0; i < this.sections.length; i++) {
      const li = ul.appendChild(document.createElement("li"));
      const a = li.appendChild(document.createElement("a"));
      a.setAttribute("href", this.sections[i].ref);
      a.innerText = this.sections[i].name;
      a.setAttribute("aria-label", this.sections[i].name);
      if (selected === this.sections[i].name) {
        a.classList = "bg-blue-800 text-white rounded px-4 py-2";
      } else {
        a.classList =
          "text-blue-800 rounded border border-blue-800 hover:border-blue-900 hover:bg-gray-200 px-4 py-2";
      }
    }
    const rightDiv = nav.appendChild(document.createElement("div"));
    rightDiv.classList = "flex space-x-4";
    const gotoApp = rightDiv.appendChild(document.createElement("a"));
    gotoApp.href = "/";
    gotoApp.classList =
      "bg-green-800 hover:bg-green-900 text-white px-4 py-2 rounded";
    gotoApp.innerText = "Torna su Squealer";
    const logout = rightDiv.appendChild(document.createElement("button"));
    logout.id = "logoutButton";
    logout.classList =
      "bg-red-800 hover:bg-red-900 text-white px-4 py-2 rounded";
    logout.setAttribute("type", "button");
    logout.innerText = "Logout";
    logout.addEventListener("click", async () => {
      await sendRequest(
        new Request(`${url}/user/session`, { method: "DELETE" }),
      );
      sessionStorage.clear();
      window.location.replace("/mod/login");
    });
  }
}
customElements.define("header-navbar", Header);
