import { defineStore } from "pinia";
import { baseUrl, emitter, fetchWrapper } from "@/functions/request";
import { computed, ref } from "vue";
import router from "@/router";

export const useUserStore = defineStore("user", () => {
  const currentUser = ref(null);
  const originalUser = ref(null);
  const smmInfo = ref(null);
  const managerInfo = ref(null);

  async function login(username, password) {
    const res = await fetchWrapper.post(
        `${baseUrl}/user/session`,
      {
        username: username,
        password: password,
        role: "smm"
      },
      "application/json",
      true,
      "Login con successo",
    );
    if (res.error) {
      sessionStorage.removeItem("accessToken");
      sessionStorage.removeItem("refreshToken");
      await router.push("/login");
    } else {
      const { accessToken, refreshToken } = res;
      sessionStorage.setItem("accessToken", accessToken);
      sessionStorage.setItem("refreshToken", refreshToken);
      let data = await fetchWrapper.get(
          `${baseUrl}/user/info/?view=self`,
      );
      if (!data.error) {
        currentUser.value = data
        sessionStorage.setItem("username", currentUser.value.username);
        originalUser.value = currentUser.value;
        if (currentUser.value.role === "smm") {
          data = await fetchWrapper.get(
              `${baseUrl}/smm/?smm=${currentUser.value.username}`,
          );
          smmInfo.value = data && !data.error ? data.page[0] : null;
          await router.push("/");
        } else if (currentUser.value.role === "vip") {
          const data = await fetchWrapper.get(
              `${baseUrl}/smm/manager/${currentUser.value.username}`,
              false,
              {},
          );
          managerInfo.value = data && !data.error ? data : null;
          await router.push("/");
        } else {
          await await clearStore();
        }
      } else {
        await clearStore();
      }
    }
  }

  async function clearStore() {
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("restoreToken");
    currentUser.value = null;
    originalUser.value = null;
    managerInfo.value = null;
    smmInfo.value = null;
    await router.push("/login")
  }

  async function LoginAccount() {
    return new Promise(async (resolve, reject) => {
      try {
        if (currentUser.value !== null && originalUser.value !== null) {
          // Resolve the promise if both currentUser.value and originalUser.value are not null
          resolve();
        } else {
          if (
            sessionStorage.getItem("accessToken") &&
            sessionStorage.getItem("refreshToken")
          ) {
            const data = await fetchWrapper.get(
                `${baseUrl}/user/info/?view=self`,
            );
            if (data === "Token non valido") {
              await clearStore();
            } else {
              currentUser.value = data;
              sessionStorage.setItem("username", currentUser.value.username);
              originalUser.value = currentUser.value;
              if (currentUser.value.role === "smm") {
                const res = await fetchWrapper.get(
                    `${baseUrl}/smm/?smm=${currentUser.value.username}`,
                );
                smmInfo.value = res && !res.error ? res.page[0] : null;
              } else {
                const res = await fetchWrapper.get(
                    `${baseUrl}/smm/manager/${currentUser.value.username}`,
                  false,
                  {},
                );
                managerInfo.value = res && !res.error ? res : null;
                resolve();
              }
            }
          } else {
            reject(new Error("Invalid session or user data."));
          }
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  async function changeAccount(username) {
    try {
      //console.log(`${baseUrl}/user/${username}/info/?view=self`)
      //console.log(await fetchWrapper.get(`${baseUrl}/user/${username}/info/?view=self`))
      currentUser.value = await fetchWrapper.get(
          `${baseUrl}/user/${username}/info/?view=self`,
      );
      emitter.emit("refresh", {});
    } catch (e) {
      //console.log(e);
    }
  }

  async function logout() {
    if (
      sessionStorage.getItem("accessToken") &&
      sessionStorage.getItem("refreshToken")
    ) {
      sessionStorage.removeItem("accessToken");
      sessionStorage.removeItem("refreshToken");
    }
    currentUser.value = null;
    originalUser.value = null;
    managerInfo.value = null;
    smmInfo.value = null;
  }

  function restoreAccount() {
    currentUser.value = originalUser.value;
    emitter.emit("refresh", {});
  }

  const postUrl = computed(() => {
    if (currentUser.value === null) return "";
    return currentUser.value.username === originalUser.value.username
        ? `${baseUrl}/post`
        : `${baseUrl}/smm/${currentUser.value.username}/post`;
  });

  const userUrl = computed(() => {
    if (currentUser.value === null) return "";
    return currentUser.value.username === originalUser.value.username
        ? `${baseUrl}/user`
        : `${baseUrl}/smm/${currentUser.value.username}`;
  });

  const sameUser = computed(() => {
    return currentUser.value?.username === originalUser.value?.username;
  });

  async function updateData() {
    let data = null;
    if (currentUser.value) data = await fetchWrapper.get(
        `${baseUrl}/user/${currentUser.value.username}/info/?view=self`,
    );
    if (data?.error || !(currentUser.value)) {
      await clearStore();
    } else if (originalUser.value.username === currentUser.value.username)
      originalUser.value = currentUser.value;
    else if (currentUser.value.role === "smm") {
      const res = await fetchWrapper.get(
          `${baseUrl}/smm/?smm=${currentUser.value.username}`,
      );
      smmInfo.value = res && !res.error ? res.page[0] : null;
    } else {
      const res = await fetchWrapper.get(
          `${baseUrl}/smm/manager/${currentUser.value.username}`,
        false,
        {},
      );
      managerInfo.value = res && !res.error ? res : null;
    }
  }

  return {
    currentUser,
    originalUser,
    managerInfo,
    smmInfo,
    changeAccount,
    restoreAccount,
    LoginAccount,
    postUrl,
    userUrl,
    updateData,
    sameUser,
    clearStore,
    login,
    logout,
  };
});
