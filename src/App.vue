<template>
  <v-app>
    <v-app-bar app>
      <a href="http://console.dashevo.io/">
        <v-img
          class="mx-2"
          src="@/assets/d-logo-large.png"
          max-height="56"
          max-width="40"
          contain
        ></v-img>
      </a>
      <v-toolbar-title class="hidden-xs-only">Platform Console</v-toolbar-title>

      <v-spacer />

      <v-toolbar-items>
        <v-btn class="ml-1" text :to="{ name: 'wallet' }">Wallet</v-btn>
        <v-btn class="ml-1" text :to="{ name: 'platform' }">Platform</v-btn>
      </v-toolbar-items>
      <v-progress-linear
        :active="isSyncing"
        indeterminate
        absolute
        bottom
        color="primary"
      ></v-progress-linear>
    </v-app-bar>

    <v-main>
      <v-container fluid>
        <!-- <v-alert
          v-model="welcome"
          border="top"
          colored-border
          type="info"
          elevation="2"
          dismissible
        >
          This is a box.
        </v-alert> -->
        <!-- <v-overlay :value="isSyncing"></v-overlay> -->
        <router-view />
        <v-snackbar v-model="snackbar.show" :top="'top'" :color="'error'">
          {{ snackbar.text }}
          <v-btn dark text @click="snackbar.show = false">Close</v-btn>
        </v-snackbar>
      </v-container>
    </v-main>
    <v-footer padless>
      <v-col class="text-center" cols="12">
        {{ new Date().getFullYear() }} —
        <strong
          ><a
            href="https://dashplatform.readme.io/docs/tutorial-connecting-to-evonet"
            target="_blank"
            >dash platform docs</a
          ></strong
        >
      </v-col>
    </v-footer>
  </v-app>
</template>

<script>
// eslint-disable-next-line
import { mapGetters } from "vuex"; //hi
export default {
  data() {
    return {
      drawer: false,
      welcome: true,
      snackbar: { show: false, text: "" },
    };
  },
  computed: {
    ...mapGetters([
      "isSyncing",
      "userIdentitiesWithNames",
      "applicationIdentitiesWithContracts",
      "hasWallet",
    ]),
    hasUserIdentities() {
      return Boolean(this.userIdentitiesWithNames.length);
    },
    hasApplicationIdentities() {
      return Boolean(this.applicationIdentitiesWithContracts.length);
    },
  },
  created() {
    // if (this.hasWallet) {
    this.$store.dispatch("initWallet");
    // }
    // this.$vuetify.theme.dark =
    //   window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    this.$store.watch(
      (state) => state.snackError.text,
      () => {
        this.snackbar = this.$store.state.snackError;
      }
    );
  },
};
</script>
