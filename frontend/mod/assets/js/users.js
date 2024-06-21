import { sendRequest, url } from "./lib";
import { User } from "./user";
import { ModalUser } from "/mod/components/modalUser";

const pageNav = document.querySelector("page-navigator");

function startFiltersEvents() {
  const showFiltersButton = document.querySelector("#show-filters-button");
  const hideFiltersButton = document.querySelector("#hide-filters-button");
  const filtersSelector = document.querySelector("#filters-selector");
  const filterUsername = document.querySelector("#filter-username");
  const queryUsername = document.querySelector("#input-username");
  showFiltersButton.addEventListener("click", () => {
    filtersSelector.classList.remove("hidden");
    showFiltersButton.parentNode.parentNode.classList.add("hidden");
    filterUsername.value = queryUsername.value;
  });
  hideFiltersButton.addEventListener("click", () => {
    filtersSelector.classList.add("hidden");
    showFiltersButton.parentNode.parentNode.classList.remove("hidden");
    queryUsername.value = filterUsername.value;
  });
}

function genCard(user) {
  const card = document.createElement("div");
  card.setAttribute("role", "article");
  card.classList = "bg-white shadow rounded p-4 flex flex-col items-center";
  const propic = card.appendChild(document.createElement("img"));
  propic.setAttribute("src", `${url}/user/${user.username}/picture/preview`);
  propic.setAttribute("alt", `Immagine profilo di ${user.username}`);
  propic.classList = "w-full h-full object-cover mb-2 rounded";
  const cardTitle = card.appendChild(document.createElement("p"));
  cardTitle.innerText = user.username;
  cardTitle.classList = "font-semibold mb-2 text-center username";
  const userSubDate = card.appendChild(document.createElement("p"));
  userSubDate.innerText = `Iscritto il ${user.cd2String()}`;
  userSubDate.classList = "text-sm mb-2 text-center";
  const userBanState = card.appendChild(document.createElement("p"));
  userBanState.innerText = user.ban2String();
  userBanState.classList = "text-sm mb-2 text-center banned";
  const showInfo = card.appendChild(document.createElement("button"));
  showInfo.classList =
    "bg-blue-800 hover:bg-blue-900 text-white px-4 py-2 rounded";
  showInfo.innerText = "Visualizza altro";
  showInfo.setAttribute("aria-label", `Visualizza altro su ${user.username}`);
  showInfo.setAttribute("aria-haspopup", "dialog");
  showInfo.setAttribute("type", "button");
  showInfo.addEventListener("click", () => {
    document
      .querySelector("body")
      .appendChild(new ModalUser(user, card, searchUsers))
      .openModal();
  });
  return card;
}

let latestSearchFilters = "";
async function searchUsers() {
  const username = document.querySelector("#input-username").value;
  const banStatus = document.querySelector("#filter-ban").value;
  const queryRoles = document.querySelectorAll(
    "input[name='filter-role']:checked",
  );
  const addr = new URL(`${url}/mod/user`, document.baseURI);
  if (username.length > 0) addr.searchParams.append("username", username);
  if (queryRoles.length > 0) {
    Array.from(queryRoles).forEach((role) =>
      addr.searchParams.append("role", role.value),
    );
  }
  addr.searchParams.append("banned", banStatus);
  addr.searchParams.append("view", "mod");
  if (latestSearchFilters !== addr.searchParams.toString()) {
    latestSearchFilters = addr.searchParams.toString();
    pageNav.currentPage = 1;
  }
  addr.searchParams.append("page", pageNav.currentPage);
  const response = await sendRequest(new Request(addr.toString()));
  const cardContainer = document.querySelector("#card-container");
  const { count, page } = await response.json();
  if (page !== undefined){
      pageNav.pageNumber = Math.max(Math.ceil(count / 20), 1);
      if (page.length === 0 && pageNav.currentPage !== 1) {
        pageNav.currentPage = pageNav.pageNumber;
        await searchUsers();
        return;
      }
      cardContainer.innerHTML = "";
      if (page.length === 0) {
        cardContainer.classList = "flex justify-center mt-3";
        const msg = document.createElement("p2");
        msg.className = "font-bold";
        msg.textContent = "Nessun utente trovato";
        cardContainer.appendChild(msg);
      } else {
        cardContainer.className =
          "m-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4";
        page.forEach((user) => {
          cardContainer.appendChild(genCard(new User(user)));
        });
      }
  }
  else window.location.replace("/mod/login");
  pageNav.render();
}

document.addEventListener("DOMContentLoaded", () => {
  if (!sessionStorage.getItem("accessToken")) {
    sessionStorage.clear();
    window.location.replace("/mod/login");
  }
  document
    .querySelector("#search-button")
    .addEventListener("click", async () => await searchUsers());
  startFiltersEvents();
  pageNav.addEventListener("click", () => searchUsers());
  searchUsers();
});
