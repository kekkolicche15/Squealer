export const icon_size = 60;

export const maxLengthAltImg = 100;
export const maxLengthtextPost = 800;

export function truncate(isAlt, string) {
  if (isAlt) {
    return string.substring(0, maxLengthAltImg);
  } else {
    return string.substring(0, maxLengthtextPost);
  }
}

export function reverse_truncate(isAlt, string) {
  if (isAlt) {
    return string.substring(
      string.substring(0, maxLengthAltImg).length,
      string.length,
    );
  } else {
    return string.substring(
      string.substring(0, maxLengthtextPost).length,
      string.length,
    );
  }
}

export const geo_api_key = "REDACTED";
export const random_image_api_key = "REDACTED";

export const NoLogin = "_";

export const uri = "/api/";
export const baseUrl = "/";

export const getScrittaSquealer = `${uri}general/image/scritta_squealer.png`;
export const getLogoSquealer = `${uri}general/image/logo_squealer.png`;
export const getMonetaSquealer = `${uri}general/image/moneta_squealer.jpg`;
export const getCurrentPositionIcon = `${uri}general/image/currentPosition.png`;
export const getCurrentPositionFillIcon = `${uri}general/image/currentPositionFill.png`;

export const officialChannels = ["SQUEAL_POPOLARI", "SQUEAL_IMPOPOLARI", "SQUEAL_CONTROVERSI"];

export const CHUNKSIZE_PROFILES_CHANNELS = 5;

export function getDate(orario) {
  const date = new Date();

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  if (orario) {
    return `${hours}:${minutes}:${seconds}`;
  } else {
    return `${day}/${month}/${year}`;
  }
}

export async function restoreAccessToken() {
  const res = await fetch(new Request(`${uri}user/session`), {
    method: "PATCH",
    headers: new Headers({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({ token: sessionStorage.getItem("refreshToken") }),
  });
  if (!res.ok && sessionStorage.getItem("refreshToken") !== NoLogin) {
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
    window.location.replace("/login");
  }
  const json = await res.json();
  sessionStorage.setItem("accessToken", json);
}

export async function sendRequest(request, auth = false) {
  if (sessionStorage.getItem("refreshToken") === NoLogin && !auth) {
    return await fetch(request);
  }
  if (!request.headers) request.headers = new Headers({});
  request.headers.append(
    "authorization",
    `Bearer ${sessionStorage.getItem("accessToken")}`,
  );
  const res = await fetch(request);
  if (!res.ok) {
    const json = await res.json();
    if (res.status === 400 && json.error === "Token non valido") {
      await restoreAccessToken();
      request.headers.set(
        "authorization",
        `Bearer ${sessionStorage.getItem("accessToken")}`,
      );
      return await fetch(request);
    }
    return new Response(JSON.stringify(json), {
      status: res.status,
      statusText: res.statusText,
      headers: res.headers,
    });
  }
  return res;
}

export function translatePop(popularity) {
  return popularity === "normal"
    ? "Normale"
    : popularity === "popular"
      ? "Popolare"
      : popularity === "unpopular"
        ? "Impopolare"
        : popularity === "controversial"
          ? "Controverso"
          : "Non valido";
}

export function createFileFromBlob(blob) {
  const fileName = "file.JPG"; // Sostituisci con il nome del file desiderato
  return new File([blob], fileName, { type: "image/jpg" });
}

export function dataURLtoBlob(dataurl) {
  var arr = dataurl.split(","),
    mime = arr[0].match(/:(.*?);/)[1],
    bstr = atob(arr[1]),
    n = bstr.length,
    u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

export const fetchImgPreview = async (userOrChannel, username) => {
  var tmpUsername = username;
  if (userOrChannel === "channel" && tmpUsername[0] === "#") {
    tmpUsername = tmpUsername.replace("#", "%23");
  }
  const res = await sendRequest(
    new Request(`${uri}${userOrChannel}/${tmpUsername}/picture/preview`, {
      method: "GET",
      headers: new Headers({
        "Content-Type": "application/json",
      }),
    }),
  );
  return res.url;
};

export const fetchImg = async (userOrChannel, username) => {
  if (userOrChannel === "channel" && username[0] === "#")
    username = username.replace("#", "%23");

  const res = await sendRequest(
    new Request(`${uri}${userOrChannel}/${username}/picture`, {
      method: "GET",
      headers: new Headers({
        "Content-Type": "application/json",
      }),
    }),
  );
  return res.url;
};

export const fetchAttachment = async (id, mode) => {
  const res = await sendRequest(
    new Request(`${uri}${mode}/${id}/attachment`, {
      method: "GET",
      headers: new Headers({
        "Content-Type": "application/json",
      }),
    }),
  );
  return res.url;
};

//markers per la geolocation
export function getStringMarkers(markers) {
  var string = "&";
  markers.forEach((element, index) => {
    if (index === 0) {
      string =
        string +
        `marker=lonlat:${element.lon},${
          element.lat
        };color:%23${element.color.substring(1)};size:${element.size}`;
    } else {
      string += `|lonlat:${element.lon},${
        element.lat
      };color:%23${element.color.substring(1)};size:${element.size}`;
    }
  });
  return string;
}

export const fetchDeletePost = async (id) => {
  await sendRequest(
    new Request(`${uri}post/${id}`, {
      method: "DELETE",
      headers: new Headers({
        "Content-Type": "application/json",
      }),
    }),
  );
};
//ritorna true se ha caratteri speciali
export function checkSpecialChars(stringa) {
    if(stringa==="" || stringa.includes("#")){ //se fai cancel o #, lo faccio passare
        return false;
    }
    var regex = /^[a-z0-9]+$/i;
    return !regex.test(stringa);
  }

export const parseContent = (content, references) => {
    for (const key in references) {
        const refVal = key.replace(/!/g, '');   
        //const anchor = `<Link to="${references[key]}">${refVal.charAt(0)}/${refVal.slice(1)}</Link>`;
        const anchor = `<a href="${references[key]}">${refVal.charAt(0)}/${refVal.slice(1)}</a>`;
        while (content.indexOf(key) !== -1) {
          content = content.replace(key, anchor);
        }
    }
    return `<span>${content}</span>`;
  }