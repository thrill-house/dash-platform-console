<template>
  <v-container>
    <v-row>
      <v-col>
        <h2>Register My Names</h2>
      </v-col>
    </v-row>
    <v-row v-if="userIdentitiesWithNames.length">
      <v-col>
        <v-simple-table>
          <thead>
            <tr>
              <th>Id</th>
              <th>Names</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="identity in userIdentitiesWithNames" :key="identity.id">
              <td>{{ identity.id }}</td>
              <td>{{ identity.names.join(", ") }}</td>
              <td>
                <v-btn icon @click="() => openDialog(identity)">
                  <v-icon>mdi-plus</v-icon>
                </v-btn>
              </td>
            </tr>
          </tbody>
        </v-simple-table>
      </v-col>
    </v-row>
    <v-row v-else>
      <v-col>
        <v-alert type="error">
          You must have User Identity in order to register a Domain Name for it
        </v-alert>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <h2>Search All Names</h2>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <v-form @submit="submitSearch">
          <v-container>
            <v-row>
              <v-col cols="12" sm="6" md="3">
                <v-text-field v-model="searchString" label="Starts with" outlined></v-text-field>
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-btn x-large color="primary" type="submit" :loading="submittingSearch"
                  >Search Dash Name</v-btn
                >
              </v-col>
            </v-row>
          </v-container>
        </v-form>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <v-simple-table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Identity Id</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(user, i) in searchDashNameList" :key="i">
              <td>{{ user.label }}</td>
              <td>{{ user.userId }}</td>
            </tr>
          </tbody>
        </v-simple-table>
      </v-col>
    </v-row>
    <v-dialog v-model="showNameDialog" max-width="400px">
      <v-card>
        <v-form @submit="submit">
          <v-card-title>{{ selectedIdentity.id }}</v-card-title>
          <v-card-text>
            <v-text-field v-model="name" counter label="Name" />
          </v-card-text>
          <v-card-actions>
            <v-btn text @click="showNameDialog = false">close</v-btn>
            <v-spacer />
            <v-btn color="primary" :loading="submitting" type="submit">Register</v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { mapGetters, mapActions } from "vuex";

export default {
  data() {
    return {
      showNameDialog: false,
      submitting: false,
      submittingSearch: false,
      selectedIdentity: {},
      name: "",
      searchString: "",
    };
  },
  computed: {
    ...mapGetters(["userIdentitiesWithNames", "searchDashNameList"]),
  },
  methods: {
    ...mapActions(["registerName", "searchDashNames"]),
    openDialog(identity) {
      this.selectedIdentity = identity;
      this.name = "";
      this.showNameDialog = true;
    },
    submitSearch(event) {
      const { searchString } = this;
      event.preventDefault();
      this.submittingSearch = true;
      this.searchDashNames(searchString).finally(() => {
        this.submittingSearch = false;
      });
    },
    submit(event) {
      event.preventDefault();
      const { name, selectedIdentity } = this;
      this.submitting = true;
      this.registerName({
        identityId: selectedIdentity.id,
        name,
      })
        .then(() => {
          this.showNameDialog = false;
        })
        .finally(() => {
          this.submitting = false;
        });
    },
  },
};
</script>

<style scoped>
tr > td:first-child {
  width: 1%;
}
tr > td:last-child {
  width: 1%;
}
</style>
