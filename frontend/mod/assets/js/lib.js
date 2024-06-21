export const url = "/api";

async function restoreAccessToken() {
  if (!sessionStorage.getItem("refreshToken")) {
    sessionStorage.clear();
    window.location.replace("/mod/login");
  }
  const res = await fetch(new Request(`${url}/user/session`), {
    method: "PATCH",
    headers: new Headers({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({ token: sessionStorage.getItem("refreshToken") }),
  });
  if (!res.ok) {
    sessionStorage.clear();
    window.location.replace("/mod/login");
  }
  sessionStorage.setItem("accessToken", await res.json());
}

export async function sendRequest(request, auth = true) {
  if (!auth) return await fetch(request);
  if (!sessionStorage.getItem("accessToken")) {
    sessionStorage.clear();
    window.location.replace("/mod/login");
  }
  if (!request.headers) request.headers = new Headers({});
  request.headers.append(
    "authorization",
    `Bearer ${sessionStorage.getItem("accessToken")}`,
  );
  const res = await fetch(request);
  if (!res.ok) {
    const json = await res.json();
    if (res.status === 403 && json.error === "Non hai i permessi") {
      sessionStorage.clear();
      window.location.replace("/mod/login");
    } else if (res.status === 400 && json.error === "Token non valido") {
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

export function normalizeNum(n) {
  return Math.log10(n) > 7 ? n.toExponential(3) : n;
}
