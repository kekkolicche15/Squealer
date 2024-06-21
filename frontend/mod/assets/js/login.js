import { sendRequest, url } from "./lib";

document.addEventListener("DOMContentLoaded", () => {
  if (sessionStorage.getItem("accessToken") !== null && sessionStorage.getItem("refreshToken") !== null) {
    window.location.replace("/mod/");
  }
  else sessionStorage.clear();
  document.querySelector("#login").addEventListener("click", async (e) => {
    e.preventDefault();
    const result = await sendRequest(
      new Request(`${url}/user/session`, {
        method: "POST",
        headers: new Headers({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          username: document.querySelector("#username").value,
          password: document.querySelector("#password").value,
          role: "mod",
        }),
      }),
      false,
    );
    const json = await result.json();
    if (!result.ok) {
      document.querySelector("#error-message").innerText =
        `Errore ${result.status}: ${json.error}`;
    } else {
      sessionStorage.setItem("accessToken", json.accessToken);
      sessionStorage.setItem("refreshToken", json.refreshToken);
      sessionStorage.setItem("username", document.querySelector("#username").value);
      window.location.replace("/mod/");
    }
  });
});
