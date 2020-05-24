import Vue from "vue";
import VueRouter from "vue-router";
import Wallet from "@/views/Wallet.vue";
import Platform from "@/views/Platform.vue";
import Identities from "@/views/Identities.vue";
import Names from "@/views/Names.vue";
import Contracts from "@/views/Contracts.vue";
import Documents from "@/views/Documents.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: "/wallet",
    name: "wallet",
    component: Wallet,
  },
  {
    path: "/platform/:contractid",
    name: "platform",
    component: Platform,
  },
  {
    path: "/identities",
    name: "identities",
    component: Identities,
  },
  {
    path: "/contracts",
    name: "contracts",
    component: Contracts,
  },
  {
    path: "/documents",
    name: "documents",
    component: Documents,
  },
  {
    path: "/names",
    name: "names",
    component: Names,
  },
  {
    path: "*",
    redirect: "wallet",
  },
];

const router = new VueRouter({
  mode: "hash",
  base: process.env.BASE_URL,
  routes,
});

export default router;
