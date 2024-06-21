import { sendRequest, url } from "./lib";
import { Channel } from "./channel";
import { ModalChannel } from "/mod/components/modalChannel";
import { ModalChannelCreate } from "/mod/components/modalChannelCreate";

const cardContainer = document.querySelector("#card-container");
const pageNav = document.querySelector("page-navigator");

function startFiltersEvents() {
  const showFiltersButton = document.querySelector("#show-filters-button");
  const hideFiltersButton = document.querySelector("#hide-filters-button");
  const filtersSelector = document.querySelector("#filters-selector");
  const filterName = document.querySelector("#filter-name");
  const queryName = document.querySelector("#input-name");
  showFiltersButton.addEventListener("click", () => {
    filtersSelector.classList.remove("hidden");
    showFiltersButton.parentNode.parentNode.classList.add("hidden");
    filterName.value = queryName.value;
  });
  hideFiltersButton.addEventListener("click", () => {
    filtersSelector.classList.add("hidden");
    showFiltersButton.parentNode.parentNode.classList.remove("hidden");
    queryName.value = filterName.value;
  });
}

function genCard(channel) {
  const card = document.createElement("div");
  card.classList = "bg-white shadow rounded p-4 flex flex-col items-center";
  const picture = card.appendChild(document.createElement("img"));
  picture.setAttribute("src", `${url}/channel/${encodeURIComponent(channel.name)}/picture/preview`);
  picture.setAttribute("alt", `Immagine del canale ${channel.name}`);
  picture.className = "w-full h-2/3 object-contain mb-2 rounded";
  const cardTitle = card.appendChild(document.createElement("h2"));
  cardTitle.innerText = channel.name;
  cardTitle.classList = "text-xl font-bold mb-2 text-center channelname";
  const channelCreationDate = card.appendChild(document.createElement("p"));
  channelCreationDate.innerText = `Creato il ${channel.cd2String()}`;
  channelCreationDate.classList = "text-sm mb-2 text-center";
  const showInfo = card.appendChild(document.createElement("button"));
  showInfo.classList =
    "bg-blue-800 hover:bg-blue-900 text-white px-4 py-2 rounded";
  showInfo.innerText = "Visualizza altro";
  showInfo.setAttribute("aria-label", `Visualizza altro su ${channel.name}`);
  showInfo.setAttribute("aria-haspopup", "dialog");
  showInfo.setAttribute("type", "button");
  showInfo.addEventListener("click", () => {
    document
      .querySelector("body")
      .appendChild(new ModalChannel(channel, card, searchChannels))
      .openModal();
  });
  return card;
}

let latestSearchFilters = "";
async function searchChannels() {
  const name = document.querySelector("#input-name").value;
  const privacy = document.querySelector("#filter-privacy").value;
  const addr = new URL(`${url}/mod/channel`, document.baseURI);
  if (name.length > 0) addr.searchParams.append("name", name);
  if (privacy !== "any") addr.searchParams.append("privacy", privacy);
  addr.searchParams.append("view", "mod");
  if (latestSearchFilters !== addr.searchParams.toString()) {
    latestSearchFilters = addr.searchParams.toString();
    pageNav.currentPage = 1;
  }
  addr.searchParams.append("page", pageNav.currentPage);
  const response = await sendRequest(
    new Request(`${addr.toString()}&${new Date().getTime()}`),
  );
  const { count, page } = await response.json();
  if (page !== undefined) {
      pageNav.pageNumber = Math.max(Math.ceil(count / 20), 1);
      if (page.length === 0 && pageNav.currentPage !== 1) {
        pageNav.currentPage = pageNav.pageNumber;
        await searchChannels();
        return;
      }
      cardContainer.innerHTML = "";
      if (page.length === 0) {
        cardContainer.classList = "flex justify-center mt-3";
        const msg = document.createElement("h2");
        msg.className = "font-bold";
        msg.textContent = "Nessun canale trovato";
        cardContainer.appendChild(msg);
      } else {
        cardContainer.className =
          "m-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4";
        page.forEach((channel) => {
          cardContainer.appendChild(genCard(new Channel(channel)));
        });
      }
  }
  else window.location.replace("/mod/login");
  pageNav.render();
}

document.addEventListener("DOMContentLoaded", async () => {
  if (!sessionStorage.getItem("accessToken")) {
    sessionStorage.clear();
    window.location.replace("login.html");
  }
  document
    .querySelector("#search-button")
    .addEventListener("click", async () => await searchChannels());
  startFiltersEvents();
  document.querySelector("#create-channel").addEventListener("click", () => {
    const modal = new ModalChannelCreate(searchChannels);
    document.querySelector("body").appendChild(modal);
    modal.openModal();
  });
  pageNav.addEventListener("click", async () => await searchChannels());
  await searchChannels();
});
