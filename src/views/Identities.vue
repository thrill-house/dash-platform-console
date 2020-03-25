<template>
  <v-container>
    <v-row v-show="isError">
      <v-card>
        <v-card-title>Error occurred</v-card-title>
        <v-card-text>{{ errorDetails ? errorDetails.message : "" }}</v-card-text>
      </v-card>
    </v-row>

    <v-row v-show="isSyncing">
      <v-card loading="primary">
        <v-card-title>Wallet is syncing</v-card-title>
        <v-card-text>This usually takes from 10 seconds to 1 minute on fast internet</v-card-text>
      </v-card>
    </v-row>

    <v-row v-show="!isSyncing && !isError">
      <v-col v-for="list in identityLists" :key="list.type.value">
        <v-row class="mb-12">
          <v-col>
            <h1>{{ list.type.name }}</h1>
          </v-col>
          <v-col cols="auto">
            <v-btn
              fab
              dark
              color="primary"
              :loading="createIdentityLoading[list.type.name]"
              @click="() => createIdentity(list.type)"
            >
              <v-icon>mdi-plus</v-icon>
            </v-btn>
          </v-col>
        </v-row>
        <v-list v-if="list.items.length" shaped>
          <v-list-item v-for="identity in list.items" :key="identity.id">
            <v-list-item-content>
              <v-list-item-title>{{ identity.id }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
        <span v-else>List is empty. Try to create an Identity</span>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapGetters, mapActions } from "vuex";

export default {
  data() {
    return {
      createIdentityLoading: {
        application: false,
        user: false,
      },
    };
  },
  computed: {
    ...mapGetters(["identityLists", "isSyncing", "errorDetails", "isError"]),
  },
  methods: {
    ...mapActions(["searchDashNames"]),
    createIdentity(type) {
      this.createIdentityLoading[type.name] = true;
      this.$store.dispatch("createIdentity", type).finally(() => {
        this.createIdentityLoading[type.name] = false;
      });
    },
  },
  created() {},
};
</script>
