import { sendRequest, url } from "./lib";
import { ModalPost } from "/mod/components/modalPost";

const pageNav = document.querySelector("page-navigator");
const cardContainer = document.querySelector("#card-container");

let latestSearchFilters = "";
async function searchPosts() {
  const author = document.querySelector("#filter-author").value;
  const channel = document.querySelector("#filter-channel").value;
  const attachs = document.querySelector("#filter-attachments").value;
  const notBefore = document.querySelector("#filter-not-before").value;
  const notAfter = document.querySelector("#filter-not-after").value;
  const popularity = document.querySelectorAll(
    "input[name='filter-pop']:checked",
  );

  const addr = new URL(`${url}/mod/post`, document.baseURI);
  if (author.length > 0) addr.searchParams.append("author", author);
  if (channel.length > 0) addr.searchParams.append("channel", channel);
  if (attachs !== "all") addr.searchParams.append("attachment", attachs);
  if (notBefore.length > 0) addr.searchParams.append("notbefore", notBefore);
  if (notAfter.length > 0) addr.searchParams.append("notafter", notAfter);
  if (popularity.length > 0) {
    Array.from(popularity).forEach((pop) =>
      addr.searchParams.append("popularity", pop.value),
    );
  }
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
        await searchPosts();
        return;
      }
      cardContainer.innerHTML = "";
      if (page.length === 0) {
        cardContainer.classList = "flex justify-center mt-3";
        const msg = document.createElement("h2");
        msg.className = "font-bold";
        msg.textContent = "Nessun post trovato";
        cardContainer.appendChild(msg);
      } else {
        cardContainer.className =
          "m-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4";
        page.forEach((post) => {
          cardContainer.appendChild(genCard(post));
        });
      }
  }
  else window.location.replace("/mod/login");
  pageNav.render();
}

function genCard(post) {
  const cardContainer = document.createElement("div");
  cardContainer.className =
    "m-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4";
  const card = cardContainer.appendChild(document.createElement("div"));
  card.setAttribute("role", "article");
  card.className = "bg-gray-200 rounded-lg p-4 shadow-md w-full md:w-auto";
  const postAuthor = card.appendChild(document.createElement("p"));
  postAuthor.className = "font-semibold username";
  postAuthor.textContent = post.author;
  const postChannel = card.appendChild(document.createElement("p"));
  postChannel.className = "text-gray-500 channelname";
  postChannel.textContent = post.channel;
  if (post.content) {
    const postContent = card.appendChild(document.createElement("p"));
    postContent.classList.add("mt-2", "truncate");
    postContent.textContent = post.content;
  }
  const postAttachment = card.appendChild(document.createElement("p"));
  postAttachment.classList.add("mt-2", "truncate");
  if (post.contentType === "text") {
    postAttachment.textContent = "Nessun allegato";
  } else if (post.contentType === "image") {
    postAttachment.textContent = "Immagine allegata";
  } else {
    postAttachment.textContent = "Video allegato";
  }
  const showInfo = card.appendChild(document.createElement("button"));
  showInfo.className =
    "mt-4 bg-blue-800 hover:bg-blue-900 text-white py-2 px-4 rounded-full";
  showInfo.textContent = "Visualizza";
  showInfo.setAttribute("aria-label", "Visualizza post");
  showInfo.setAttribute("aria-haspopup", "dialog");
  showInfo.setAttribute("type", "button");
  showInfo.addEventListener("click", () => {
    document
      .querySelector("body")
      .appendChild(new ModalPost(post, card, searchPosts))
      .openModal();
  });
  return card;
}
document.addEventListener("DOMContentLoaded", async () => {
  if (!sessionStorage.getItem("accessToken")) {
    sessionStorage.clear();
    window.location.replace("login.html");
  }
  const showFiltersButton = document.querySelector("#show-filters-button");
  const hideFiltersButton = document.querySelector("#hide-filters-button");
  showFiltersButton.addEventListener("click", () => {
    showFiltersButton.parentNode.classList.add("hidden");
    hideFiltersButton.parentNode.parentNode.parentNode.classList.remove(
      "hidden",
    );
  });
  hideFiltersButton.addEventListener("click", () => {
    showFiltersButton.parentNode.classList.remove("hidden");
    hideFiltersButton.parentNode.parentNode.parentNode.classList.add("hidden");
  });
  document
    .querySelector("#search-button")
    .addEventListener("click", async () => await searchPosts());
  pageNav.addEventListener("click", () => searchPosts());
  await searchPosts();
});
