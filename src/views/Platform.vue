<template>
  <v-container style="max-width: 900px;">
    <v-row align="center" justify="center">
      <v-col class="d-flex" cols="12">
        <v-combobox
          ref="selectedid"
          v-model="selectedIdentity"
          :items="comboIdentities"
          label="Search Names, paste ContractId"
          outlined
          autofocus
          color="blue"
          class="mr-2"
          @change="awesomeBar"
        ></v-combobox>
        <v-speed-dial
          v-model="fab"
          top
          right
          direction="bottom"
          class="mt-n4"
          style="z-index: 4; left: 0px;"
        >
          <template v-slot:activator>
            <v-btn v-model="fab" fab @click="clearIdentity()" @blur="closeFab()">
              <v-icon v-if="fab">mdi-close</v-icon>
              <v-icon v-else>mdi-plus</v-icon>
            </v-btn>
          </template>
          <v-tooltip left>
            <template v-slot:activator="{ on }">
              <v-btn fab @click="createIdentity({ name: 'user', value: 1 })" v-on="on">
                <v-icon color="primary" dark>mdi-account</v-icon>
              </v-btn>
            </template>
            <span>New User</span>
          </v-tooltip>
          <v-tooltip left>
            <template v-slot:activator="{ on }">
              <v-btn fab @click="createIdentity({ name: 'application', value: 2 })" v-on="on">
                <v-icon color="primary" dark>mdi-code-json</v-icon>
              </v-btn>
            </template>
            <span>New App</span>
          </v-tooltip>
        </v-speed-dial>
      </v-col>
    </v-row>
    <v-row
      v-if="
        selectedIdentity.type === 'application' &&
        selectedIdentity.value &&
        !contracts[selectedIdentity.value]
      "
      align="center"
      justify="center"
    >
      <v-col>
        <v-card class="mx-auto">
          <v-card-title>
            <span class="headline">Register a Contract</span>
          </v-card-title>
          <v-card-text class="text-center">
            Here @andyfreer explains the new dev what to know and do about contracts
          </v-card-text>
          <v-card-actions class="text-center">
            <Contract :identity="selectedIdentity" />
          </v-card-actions>
        </v-card> </v-col
    ></v-row>
    <v-row
      v-if="
        selectedIdentity.type === 'application' &&
        selectedIdentity.value &&
        contracts[selectedIdentity.value]
      "
      align="center"
      justify="center"
    >
      <v-col> <Documents :selected-contract-id="selectedIdentity.value" /> </v-col
    ></v-row>
    <v-row v-if="showMyUsers">
      <v-col class="d-flex">
        <v-text-field
          v-model="newUsername"
          outlined
          label="Choose your new username"
          @keydown.enter="createUsername"
        />
        <v-btn color="primary" x-large @click="createUsername()">Register</v-btn>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <v-chip
          v-for="(name, i) in names[selectedIdentity.value]"
          :key="i"
          class="ma-4"
          pill
          color="blue"
          text-color="white"
        >
          <v-avatar left>
            <v-icon>mdi-account-circle</v-icon>
          </v-avatar>
          {{ name }}
        </v-chip>
      </v-col></v-row
    >
    <v-row v-if="showUserSearchTable">
      <v-col>
        <v-card class="mx-auto">
          <v-simple-table :loading="submittingSearch">
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
        </v-card>
      </v-col>
    </v-row>
    <v-row align="center" justify="center"> <v-col> </v-col></v-row>
  </v-container>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
import Contract from "../components/Contract";
import Documents from "../components/Documents";

export default {
  components: { Contract, Documents },
  data() {
    return {
      selectedIdentity: { text: "", value: null },
      submittingSearch: "false",
      newUsername: "",
      fab: false,
    };
  },
  computed: {
    ...mapGetters([
      "contracts",
      "names",
      "userIdentities",
      "applicationIdentities",
      "contractIdentities",
      "searchDashNameList",
    ]),
    comboIdentities() {
      let comboIds = [];

      // Identities our mnemonic owns
      comboIds.push({ header: "My App identities" });
      comboIds = comboIds.concat(this.applicationIdentities);
      comboIds.push({ header: "My Users identities" });
      comboIds = comboIds.concat(this.userIdentities);

      // ContractIds from 3rd parties (our duplicates won't be shown in the combobox)
      comboIds.push({ header: "3rd Party Contracts (paste to import)" });
      comboIds = comboIds.concat(this.contractIdentities); // FIXME var name

      console.log(comboIds);
      return comboIds;
    },
    showUserSearchTable() {
      return (
        typeof this.selectedIdentity === "string" &&
        this.selectedIdentity.length > 0 &&
        this.selectedIdentity.length !== 44
      );
    },
    showMyUsers() {
      const { selectedIdentity } = this;
      console.log(selectedIdentity.type);
      return Boolean(selectedIdentity.type === "user");
    },
  },
  watch: {
    selectedIdentity() {
      this.$refs.selectedid.isMenuActive = false;
      setTimeout(() => {
        this.$refs.selectedid.isMenuActive = false;
      }, 50);
    },
  },
  methods: {
    ...mapActions(["addContract", "showSnackError", "searchDashNames", "registerName"]),
    closeFab() {
      setTimeout(() => {
        this.fab = false;
      }, 150);
    },
    createUsername() {
      this.$store.commit("setSyncing", true);
      this.registerName({
        identityId: this.selectedIdentity.value,
        name: this.newUsername,
      })
        .then(() => {
          this.newUsername = "";
        })
        .catch((e) => this.showSnackError(e))
        .finally(() => {
          this.$store.commit("setSyncing", false);
        });
    },
    isContractId(value) {
      return typeof value === "string" && value.length === 44;
    },
    async awesomeBar() {
      const { contracts, selectedIdentity, isContractId } = this;
      if (typeof selectedIdentity === "string" && selectedIdentity.length > 0) {
        if (isContractId(selectedIdentity)) {
          const contract = contracts[selectedIdentity.value];
          console.log(contract);
          console.log(this.isContractId(selectedIdentity));
          if (
            !contract &&
            typeof this.selectedIdentity === "string" &&
            this.selectedIdentity.length > 5
          ) {
            console.log("fetching unknown contract and adding to state");
            console.log({ identifier: selectedIdentity });
            await this.addContract({ identifier: selectedIdentity });
            this.selectedIdentity = {
              text: selectedIdentity,
              value: selectedIdentity,
              type: "application",
            };
            console.log("done fetching unknown contract and adding to state");
          }
        } else {
          console.log("searching for username", selectedIdentity);
          this.submittingSearch = true;
          this.$store.commit("setSyncing", true);
          this.searchDashNames(selectedIdentity).finally(() => {
            this.submittingSearch = false;
            this.$store.commit("setSyncing", false);
          });
        }
      }
    },
    clearIdentity() {
      this.selectedIdentity = { text: "", value: null };
    },
    createIdentity(type) {
      this.$store.commit("setSyncing", true);
      this.$store
        .dispatch("createIdentity", type)
        .then(() => {
          // If successful, set the newly created identity in the combobox
          const identity = this.$store.state.identities[type.name].slice(-1)[0]; // FIXME should be a getter
          this.selectedIdentity = {
            text: identity.id,
            value: identity.id,
            type: identity.type === 2 ? "application" : "user",
          };
        })
        .catch((e) => {
          this.showSnackError(e);
        })
        .finally(() => {
          this.$store.commit("setSyncing", false);
        });
    },
  },
};
</script>
