<template>
  <v-app>
    <v-app-bar app>
      <v-toolbar-title>Dash Platform Console</v-toolbar-title>

      <v-spacer />

      <v-btn class="ml-1" text :to="{ name: 'wallet' }">Wallet</v-btn>
      <v-btn class="ml-1" text :to="{ name: 'identities' }">Identities</v-btn>
      <v-btn class="ml-1" text :to="{ name: 'names' }">Names</v-btn>
      <v-btn class="ml-1" text :to="{ name: 'contracts' }">Contracts</v-btn>
      <v-btn class="ml-1" text :to="{ name: 'documents' }">Documents</v-btn>
      <v-progress-linear :active="isSyncing" indeterminate absolute bottom color="primary"></v-progress-linear>
    </v-app-bar>
    <v-content>
      <!-- <v-overlay :value="isSyncing"></v-overlay> -->
      <router-view />
      <v-snackbar v-model="snackbar.show" :top="'top'" :color="'error'">
        {{ snackbar.text }}
        <v-btn dark text @click="snackbar.show = false">Close</v-btn>
      </v-snackbar>
    </v-content>
  </v-app>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  data() {
    return { snackbar: { show: false, text: "" } };
  },
  computed: {
    ...mapGetters(["isSyncing"]),
  },
  created() {
    this.$store.dispatch("initWallet");
    this.$vuetify.theme.dark =
      window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    this.$store.watch(
      (state) => state.snackError.text,
      () => {
        this.snackbar = this.$store.state.snackError;
      }
    );
  },
};
</script>
