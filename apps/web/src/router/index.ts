import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";
import AuthView from "@/views/AuthView.vue";
import HomeView from "@/views/HomeView.vue";
import NotFoundView from "@/views/NotFoundView.vue";
import { useAuthStore } from "@/stores/auth.store";

declare module "vue-router" {
  interface RouteMeta {
    /** Route réservée aux visiteurs non connectés. */
    guestOnly?: boolean;
  }
}

const routes: RouteRecordRaw[] = [
  { path: "/", name: "home", component: HomeView },
  {
    path: "/login",
    name: "login",
    component: AuthView,
    meta: { guestOnly: true },
  },
  {
    path: "/register",
    name: "register",
    component: AuthView,
    meta: { guestOnly: true },
  },
  { path: "/:pathMatch(.*)*", name: "not-found", component: NotFoundView },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, _, savedPosition) {
    if (to.hash) {
      return { el: to.hash, behavior: "smooth" };
    }
    if (savedPosition) {
      return savedPosition;
    }
    return { top: 0 };
  },
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();

  // La restauration de session est en vol (lancée dans main.ts). On attend
  // sa réponse, sinon on redirigerait vers /login un utilisateur connecté
  // dont le token n'est simplement pas encore revenu.
  if (auth.status === "unknown") {
    await auth.refreshSession();
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: "home" };
  }
});

export default router;
