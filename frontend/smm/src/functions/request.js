import router from "../router";
import mitt from "mitt";
export const baseUrl = `${import.meta.env.VITE_API_URL}`;
export const CHUNK_SIZE = Number(import.meta.env.VITE_CHUNK_SIZE);
const access_token =
  "pk.eyJ1IjoibmljbzgxMCIsImEiOiJjbG40ZGo0Zm4wczdmMnFucjkwdDhkaDNlIn0.Aq9I7t8RPWlLguPcpoAqMw";
export const fetchWrapper = {
  get: async (url, show = false, message = "") =>
    await request("GET", url, null, "application/json", show, message),
  post: async (
    url,
    body,
    type = "application/json",
    show = false,
    message = "",
  ) => await request("POST", url, body, type, show, message),
  patch: async (
    url,
    body,
    type = "application/json",
    show = false,
    message = "",
  ) => await request("PATCH", url, body, type, show, message),
  delete: async (url, show = false, message = "") =>
    await request("DELETE", url, null, "application/json", show, message),
};

export const emitter = mitt();

async function request(method, url, body, type, show, message) {
  const requestOptions = {
    method,
    headers: authHeader(url),
  };
  if (type === "multipart/form-data") {
    requestOptions.body = body;
  } else if (body) {
    requestOptions.headers["Content-Type"] = type;
    if (body instanceof FormData) {
      const object = {};
      body.forEach((value, key) => (object[key] = value));
      requestOptions.body = JSON.stringify(object);
    } else requestOptions.body = JSON.stringify(body);
  }
  return await handleResponse(requestOptions, url, show, message);
}
function authHeader(url) {
  const accessToken = sessionStorage.getItem("accessToken");
  const isLoggedIn = !!accessToken;
  const isApiUrl = url.startsWith(baseUrl);
  if (isLoggedIn && isApiUrl) {
    return { Authorization: `Bearer ${accessToken}` };
  } else {
    return {};
  }
}

async function restoreAccessToken() {
  if (!sessionStorage.getItem("refreshToken")) {
    await router.push({ path: "/login" });
  }
  const refreshToken = sessionStorage.getItem("refreshToken");
  const requestOptions = {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json", // Set the Content-Type header
    },
    body: JSON.stringify({
      token: refreshToken,
    }),
  };
  let res = await fetch(`${baseUrl}/user/session`, requestOptions);
  if (!res.ok) {
    emitter.emit("snack", {
      msg: "Qualcosa e' andato storto",
      color: "red-accent-1",
    });
    emitter.emit("session")
  } else {
    res = await res.json();
    sessionStorage.setItem("accessToken", res);
  }
}

async function handleResponse(requestOptions, url, show, message) {
  let res = await fetch(url, requestOptions);
  if (!res.ok) {
    let data = await res.json();
    if (data.error === "Token non valido") {
      await restoreAccessToken();
      requestOptions.headers = authHeader(url);
      res = await fetch(url, requestOptions);
      if (!res.ok && show) {
        emitter.emit("snack", {
          msg: message.length > 0 ? message : "Qualcosa e' andato storto",
          color: "red-accent-1",
        });
        emitter.emit("session");
      }
      return await res.json();
    } else if (show) {
      emitter.emit("snack", { msg: data.error, color: "red-accent-1" });
      emitter.emit("session");
    }
    return data;
  } else if (show) {
    emitter.emit("snack", {
      msg: message.length > 0 ? message : "Operazione andata con successo",
      color: "green-accent-1",
    });
  }
  const data = res.json();
  return await data;
}

let formData = null;
let times = 0;
let intervalToSend = 1000;
let fileToSend = null;
let contentString = "";
let locationToSend = "";
let urlToSend = "";
let channelToSend = null;

function clear() {
  formData = null;
  times = 0;
  intervalToSend = 1000;
  fileToSend = null;
  contentString = "";
  locationToSend = "";
  urlToSend = "";
  channelToSend = null;
}

export async function sendTimedPosts(
  file,
  content,
  location,
  url,
  nTimes,
  interval,
  channels = null,
) {
  fileToSend = file;
  contentString = content;
  urlToSend = url;
  locationToSend = location;
  intervalToSend = interval;
  channelToSend = channels;
  if (times > 0) {
    emitter.emit("snack", {
      msg: "E' gia' attivo il servizio",
      color: "red-accent-1",
    });
  } else {
    times = nTimes;
    await sendPostLoop();
  }
}

async function delay(ms) {
  return await new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendPostLoop() {
  while (times-- > 0) {
    await delay(intervalToSend);
    if (locationToSend) await createImage();
    formData = new FormData();
    if (fileToSend) formData.append("attachment", fileToSend[0]);
    if (contentString) formData.append("content", contentString);
    if (locationToSend) formData.append("location", locationToSend);
    if (channelToSend) formData.append("channels", channelToSend);
    await fetchWrapper.post(
      urlToSend,
      formData,
      "multipart/form-data",
      true,
      "Post inviato con successo",
    );
    emitter.emit("posted", {});
  }
  clear();
}

const createImage = async () => {
  try {
    const { lat, lng } = await updateCenter();
    const data = await fetch(
      `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+f00(${lng},${lat})/${lng},${lat},9,0,0/600x400?access_token=${access_token}`,
    );
    const image = await data.blob();
    const blob = new Blob([image], { type: "image/png" });
    fileToSend = [new File([blob], "map.png", { type: "image/png" })];
    const countryState = (
      await fetchWrapper.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${access_token}`,
      )
    ).features[0].context.slice(-2);
    locationToSend = `${countryState[0].text}, ${countryState[1].text}`;
  } catch (error) {
    emitter.emit("snack", { msg: error, color: "red-accent-1" });
  }
};

const updateCenter = () => {
  return new Promise((resolve, reject) => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        function (position) {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          resolve({ lat, lng });
        },
        function (error) {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              reject("User denied the request for Geolocation");
              break;
            case error.POSITION_UNAVAILABLE:
              reject("Location information is unavailable");
              break;
            case error.TIMEOUT:
              reject("The request to get user location timed out");
              break;
            default:
              reject("An unknown error occurred");
          }
        },
      );
    } else {
      reject("Geolocation is not supported by this browser");
    }
  });
};
