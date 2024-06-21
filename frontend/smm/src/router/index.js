// Composables
import { createRouter, createWebHistory } from "vue-router";
import Home from "@/views/Home.vue";
import { useUserStore } from "@/store/users";

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/LogIn"),
  },
  {
    path: "/search",
    name: "Search",
    component: () => import("@/views/Search"),
  },
  {
    path: "/post/:id",
    name: "Post",
    component: () => import("@/views/PostView"),
    props: true,
  },
  {
    path: "/notification/:option",
    name: "Notification",
    component: () => import("@/views/Notification"),
    props: true,
  },
];
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});
// router.beforeEach((to, from, next) => {
// per fare login
// });
router.beforeEach((to, from, next) => {
  const userStore = useUserStore();
  const isAuthenticated = sessionStorage.getItem("accessToken");
  if (to.name !== "Login" && !isAuthenticated) {
    next({ name: "Login" });
  } else next();
});

router.onError((error, to) => {
  if (
    error.message.includes("Failed to fetch dynamically imported module") ||
    error.message.includes("Importing a module script failed")
  ) {
    window.location = to.fullPath;
  }
});

export default router;
