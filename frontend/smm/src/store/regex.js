import { defineStore } from "pinia";
import { fetchWrapper } from "@/functions/request";

const baseUrl = `${import.meta.env.VITE_API_URL}`;

export const useRegexStore = defineStore({
  id: "regex",
  state: () => ({
    regexes: {},
  }),
  actions: {
    async fetchRegexes() {
      const data = await fetchWrapper.get(`${baseUrl}/general/patterns`);
      for (const key in data) {
        this.regexes[key] = new RegExp(data[key]);
      }
    },
  },
});
