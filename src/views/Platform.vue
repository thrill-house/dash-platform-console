<template>
  <v-container style="max-width: 900px">
    <v-row align="center" justify="center">
      <v-col class="d-flex" cols="12">
        <v-combobox
          ref="selectedid"
          v-model="selectedIdentity"
          :items="comboIdentities"
          label="Search Names, paste DashIdentity or ContractId"
          outlined
          autofocus
          color="blue"
          class="mr-2"
          @change="awesomeBar"
        ></v-combobox>
        <v-btn
          fab
          top
          right
          color="primary"
          style="z-index: 4; left: 0px"
          @click="createIdentity()"
        >
          <v-icon>mdi-plus</v-icon>
        </v-btn>
      </v-col>
    </v-row>
    <v-row
      v-if="selectedIdentity.identityId && !selectedIdentityHasContracts"
      align="center"
      justify="center"
    >
      <v-col>
        <v-card class="mx-auto">
          <v-card-title>
            <span class="headline">Contracts</span>
          </v-card-title>
          <v-card-text class="text-center subtitle-1">
            Your Dash Identity is <code>{{ selectedIdentity.identityId }}</code>
          </v-card-text>
          <v-card-actions class="text-center">
            <Contract :identity="selectedIdentity" />
          </v-card-actions>
        </v-card> </v-col
    ></v-row>
    <v-row v-if="selectedIdentityHasContracts" align="center" justify="center">
      <v-col>
        <Documents
          :selected-identity-id="selectedIdentity.identityId"
          :panel="showContract"
          :selected-document-type-prop="$route.query.type"
          :query-opts-prop="$route.query.queryopts"
        /> </v-col
    ></v-row>
    <v-row v-if="selectedIdentity.isMine" align="center" justify="center">
      <v-col>
        <v-card class="mx-auto">
          <v-card-title>
            <span class="headline">Users</span>
          </v-card-title>
          <v-card-text class="text-center subtitle-1">
            Your Dash Usernames are:
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
          </v-card-text>
          <v-card-actions class="text-center">
            <v-text-field
              v-model="newUsername"
              outlined
              label="Choose your new username"
              @keydown.enter="createUsername"
            />
            <v-btn color="primary" class="mt-n8" x-large @click="createUsername()">Register</v-btn>
          </v-card-actions>
        </v-card>
      </v-col></v-row
    >
    <v-row v-if="showUserSearchTable">
      <v-col>
        <v-card class="mx-auto">
          <v-simple-table :loading="submittingSearch">
            <thead>
              <tr>
                <th>Name</th>
                <th>Dash Identity</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(user, i) in searchDashNameList" :key="i">
                <td>{{ user.label }}</td>
                <td>{{ user.dashIdentity }}</td>
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
      selectedDocumentTypeProp: "",
      showContract: true,
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
    selectedIdentityHasContracts() {
      const { selectedIdentity, contracts } = this;
      if (selectedIdentity && selectedIdentity.identityId) {
        const { identityId } = selectedIdentity;
        const identityContracts = contracts[identityId]; // TODO refactor: remove old typed identity getter and create statewide identityContracts, identityContractIds getters
        const identityContractIds = identityContracts ? Object.keys(identityContracts) : [];

        return identityContractIds.length > 0;
      } else {
        return false;
      }
    },

    comboIdentities() {
      let comboIds = [];

      // Identities our mnemonic owns
      comboIds.push({ header: "My Identities" });
      comboIds = comboIds.concat(
        this.$store.state.identities.map(function (identity) {
          return {
            value: identity.id,
            text: identity.id,
            identityId: identity.id,
            isMine: true,
          };
        })
      );

      // ContractIds from 3rd parties (our duplicates won't be shown in the combobox)
      comboIds.push({ header: "3rd Party Contracts (paste to import)" });
      comboIds = comboIds.concat(this.contractIdentities); // FIXME var name

      console.log({ comboIds });
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
  mounted() {
    if (this.$route.params.contractid) {
      this.selectedIdentity = this.$route.params.contractid;
    }
    this.awesomeBar();
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
    isIdentityId(value) {
      return typeof value === "string" && value.length >= 42 && value.length <= 44;
    },
    async awesomeBar() {
      const { contracts, selectedIdentity, isIdentityId } = this;
      console.log("awesomeBar()");
      console.log({ selectedIdentity });
      if (typeof selectedIdentity === "string" && selectedIdentity.length > 0) {
        // Don't react on empty input
        if (isIdentityId(selectedIdentity)) {
          // Either load identity action cards, fetch a contract or launch a name search
          console.log("contract", contracts);
          const contract = contracts[selectedIdentity.value];
          console.log(contract);
          console.log("isContract", this.isIdentityId(selectedIdentity));
          if (
            !contract &&
            typeof this.selectedIdentity === "string" &&
            this.selectedIdentity.length > 5 // FIXME should be 44? can probably remove
          ) {
            // If awesomebar input is selected, it's an object: selectedIdentity === {value: , text:}
            // Here it is direct text input: typeof selectedIdentity === 'string'
            console.log("fetching unknown contract and adding to state");
            console.log({ contractId: selectedIdentity });
            const foundContract = await this.addContract({
              contractId: selectedIdentity,
            });

            if (foundContract) {
              console.log("Found valid contract and added to awesomebar", foundContract);
              // Set awesomebar entry to object, now it will be loaded from cache upon next select
              this.selectedIdentity = {
                text: foundContract.id,
                value: foundContract.id,
                contractId: selectedIdentity,
                identityId: foundContract.ownerId,
              };

              // Open contract expansion panel index 0
              this.showContract = this.$route.query.showcontract === "false" ? false : 0; // TODO should also work if contract is loaded from cache
            } else {
              console.log("No contract found under contractId: ", selectedIdentity);
              this.showSnackError("No contract found under contractId: " + selectedIdentity);
            }
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
    createIdentity() {
      console.log("createIdentity()");
      this.$store.commit("setSyncing", true);
      this.$store
        .dispatch("createIdentity")
        .then(() => {
          // If successful, set the newly created identity in the combobox
          console.log("state.identities", this.$store.state.identities);
          const identity = this.$store.state.identities.slice(-1)[0];
          console.log("state.identities", this.$store.state.identities);
          this.selectedIdentity = {
            text: identity.id,
            value: identity.id,
            identityId: identity.id,
            isMine: true,
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
