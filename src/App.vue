<template>
  <v-app>
    <v-app-bar app>
      <v-toolbar-title>dashevo exprlorer</v-toolbar-title>

      <v-spacer />

      <v-btn text :to="{ name: 'identities' }">Identities</v-btn>
      <v-btn class="ml-1" text :to="{ name: 'names' }">Names</v-btn>
      <v-btn class="ml-1" text :to="{ name: 'contracts' }">Contracts</v-btn>
      <v-btn class="ml-1" text :to="{ name: 'documents' }">Documents</v-btn>

    </v-app-bar>

    <v-content>
      <router-view />
    </v-content>
  </v-app>
</template>

<script>
export default {
  created() {
    this.$vuetify.theme.dark = window.matchMedia
      && window.matchMedia('(prefers-color-scheme: dark)').matches;
  },
};
</script>
