import {
	createRouter,
	createWebHistory,
	type RouteRecordRaw,
} from "vue-router";
import AuthView from "@/views/AuthView.vue";
import HomeView from "@/views/HomeView.vue";
import NotFoundView from "@/views/NotFoundView.vue";

const routes: RouteRecordRaw[] = [
	{ path: "/", name: "home", component: HomeView },
	{ path: "/login", name: "login", component: AuthView },
	{ path: "/register", name: "register", component: AuthView },
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

export default router;
