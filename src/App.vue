<template>
  <v-app>
    <v-navigation-drawer v-model="drawer" disable-resize-watcher app>
      <v-list>
        <v-list-item link :to="{ name: 'wallet' }">
          <v-list-item-content>
            <v-list-item-title>Wallet</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item link :to="{ name: 'identities' }">
          <v-list-item-content>
            <v-list-item-title>Identities</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item link :to="{ name: 'names' }">
          <v-list-item-content>
            <v-list-item-title>Names</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item link :to="{ name: 'contracts' }">
          <v-list-item-content>
            <v-list-item-title>Contracts</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item link :to="{ name: 'documents' }">
          <v-list-item-content>
            <v-list-item-title>Documents</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
    <v-app-bar app>
      <v-app-bar-nav-icon class="hidden-md-and-up" @click.stop="drawer = !drawer" />
      <v-toolbar-title>Dash Platform Console</v-toolbar-title>

      <v-spacer />

      <v-toolbar-items class="hidden-sm-and-down">
        <v-btn class="ml-1" text :to="{ name: 'wallet' }">Wallet</v-btn>
        <v-btn class="ml-1" text :to="{ name: 'identities' }">Identities</v-btn>
        <v-btn class="ml-1" text :to="{ name: 'names' }">Names</v-btn>
        <v-btn class="ml-1" text :to="{ name: 'contracts' }">Contracts</v-btn>
        <v-btn class="ml-1" text :to="{ name: 'documents' }">Documents</v-btn>
      </v-toolbar-items>
      <v-progress-linear
        :active="isSyncing"
        indeterminate
        absolute
        bottom
        color="primary"
      ></v-progress-linear>
    </v-app-bar>

    <v-content>
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
    </v-content>
  </v-app>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  data() {
    return { drawer: false, welcome: true, snackbar: { show: false, text: "" } };
  },
  computed: {
    ...mapGetters(["isSyncing"]),
  },
  created() {
    this.$store.dispatch("initWallet");
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
