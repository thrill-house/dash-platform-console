import Vue from "vue";
import Vuex from "vuex";
import axios from "axios";
import createPersistedState from "vuex-persistedstate";

Vue.use(Vuex);

const DashJS = require("dash");
console.log({ DashJS });
// eslint-disable-next-line no-unused-vars

//
// Cache identity lookups to speed up UX by avoiding to hit dapi multiple times
//

const IdentitiesCache = {};

const cacheIdentity = (identity) => {
  IdentitiesCache[identity.id] = identity;
};

const cachedOrGetIdentity = async (client, identityId) => {
  console.log("Checking IdentitiesCache for known identities using IdentityId", identityId);
  let identity;
  if (identityId in IdentitiesCache) {
    identity = IdentitiesCache[identityId];
    console.log("Found existing cached identity", identity);
  } else {
    identity = await client.platform.identities.get(identityId);
    IdentitiesCache[identity.id] = identity;
    console.log("Fetched unknown identity", identity);
  }
  console.log({ IdentitiesCache });
  return identity;
};

//
//

let client;
const initState = {
  isSyncing: false,
  refresherId: null,
  wallet: {
    // mnemonic: "become leisure project merry rebuild forest bread foot during orange august raw",
    // mnemonic: "control toe garage transfer shrimp pill wear detail ribbon only unveil nephew",
    // vendor inch curtain admit tumble open arch strong segment wrestle head earth
    // mnemonic: "snack immune develop side proof air dune melt replace cover apology joke",
    // snack immune develop side proof air dune melt replace cover apology joke
    // AReTHBxAzKbdqx3ZJyX94gNW4xhyjEDkWwVWcfAK7X9m
    //drastic raise hurry step always person bundle end humble toss estate inner
    mnemonic: null,
    confirmedBalance: 0,
  },
  errorDetails: null,
  isError: false,
  snackError: { show: false, text: "" },
  identities: [],
  names: {},
  searchNames: [],
  contracts: {},
  documents: {},
};

export default new Vuex.Store({
  state: initState,
  mutations: {
    addIdentity(state, { identity }) {
      state.identities.push(identity);
    },
    setWallet(state, wallet) {
      state.wallet = wallet;
    },
    addName(state, { identity, name }) {
      const { id } = identity;
      const names = state.names[id] || [];
      state.names = {
        ...state.names,
        [id]: [...names, name],
      };
    },
    addContract(state, contract) {
      const identityId = contract.ownerId;
      const contractId = contract.id;

      state.contracts = {
        ...state.contracts,
        [identityId]: { [contractId]: contract },
      };
    },
    addDocument(state, { document }) {
      const contractId = document.dataContractId;

      if (!state.documents[contractId]) state.documents[contractId] = [];
      state.documents[contractId].push(document);
    },
    setDocuments(state, { contractId, documents }) {
      state.documents = {
        [contractId]: documents,
      };
    },
    setSearchNames(state, searchNames) {
      state.searchNames = JSON.parse(JSON.stringify(searchNames)); // It's a localStorage thing
    },
    setMnemonic(state, mnemonic) {
      state.wallet.mnemonic = mnemonic;
    },
    setSyncing(state, syncStatus) {
      state.isSyncing = syncStatus;
    },
    setError(state, error) {
      state.errorDetails = error;
      state.isError = true;
    },
    clearError(state) {
      state.errorDetails = null;
      state.isError = false;
    },
    setSnackError(state, snackError) {
      state.snackError = snackError;
    },
    resetState() {
      this.replaceState(JSON.parse(JSON.stringify(initState)));
      this.dispatch("initWallet"); // FIXME this shouldn't be in a mutation
    },
    resetSync(state) {
      state.isSyncing = true;
      state.isError = false;
      state.errorDetails = null;
    },
  },
  actions: {
    async getMagicInternetMoney() {
      console.log("Awaiting faucet drip..");
      const account = await client.wallet.getAccount();
      const address = account.getUnusedAddress().address;
      console.log("... for address: " + address);
      try {
        // const req = await this.$axios.get(
        //   `https://qetrgbsx30.execute-api.us-west-1.amazonaws.com/stage/?dashAddress=${address}`,
        //   { crossdomain: true }
        // )
        // const req = await this.$axios.get(`http://localhost:5000/evodrip/us-central1/evofaucet/drip/${address}`)
        const reqs = [
          axios.get(`https://us-central1-evodrip.cloudfunctions.net/evofaucet/drip/${address}`),
          axios.get(`http://134.122.104.155:5050/drip/${address}`),
        ];
        await Promise.race(reqs);
        console.log("... faucet dropped.");
        console.log(reqs);
      } catch (e) {
        console.log(e);
        throw e;
      }
    },
    // eslint-disable-next-line no-unused-vars
    async validateContractJSON({ state }, { identityId, json }) {
      const { platform } = client;
      const identity = await cachedOrGetIdentity(client, identityId);
      // const contract = await platform.dpp.dataContract.create(identityId, json);
      const contract = await platform.contracts.create(json, identity);
      console.dir({ contract });
      const validationResult = await platform.dpp.dataContract.validate(contract);

      if (validationResult.isValid()) {
        console.log("validation success");
      } else {
        console.log("validation failed");
      }
      console.log(validationResult);
      return validationResult;
    },
    async addContract({ commit }, { contractId }) {
      console.log({ contractId });
      const { platform } = client;
      commit("setSyncing", true);
      const contract = await platform.contracts.get(contractId);
      console.log("fetched contract", contract);
      console.dir({ contract });

      if (contract === null) {
        console.log("contract is null for this identity");
        commit("setSyncing", false);
        return false;
      } else {
        console.log("found a contract, adding");
        console.log({ contract });
        commit("addContract", contract);
        commit("setSyncing", false);
        return contract;
      }
    },
    async sendDash({ dispatch }, { sendToAddress, satoshis }) {
      const account = await client.wallet.getAccount();
      try {
        const transaction = account.createTransaction({
          recipient: sendToAddress, // Evonet faucet
          satoshis: satoshis, // 1 Dash
        });
        const result = await account.broadcastTransaction(transaction);
        console.log("Transaction broadcast!\nTransaction ID:", result);
        dispatch("refreshWallet");
      } catch (e) {
        console.error("Something went wrong:", e);
        dispatch("showSnackError", e);
        throw e;
      }
    },
    async queryDocuments({ commit, dispatch }, { contractId, typeLocator, queryOpts }) {
      console.log("queryDocuments()");
      console.log({ contractId });
      console.log({ typeLocator });
      console.log({ queryOpts });
      commit("setSyncing", true);
      try {
        const clientOptsQuery = {
          network: "evonet",
          apps: {
            // dpns: {
            //   contractId: "7PBvxeGpj7SsWfvDSa31uqEMt58LAiJww7zNcVRP1uEM",
            // },
            tutorialContract: {
              contractId,
            },
          },
        };
        console.log({ clientOptsQuery });
        const clientQuery = new DashJS.Client(clientOptsQuery);
        // await clientQuery.isReady();
        const documents = await clientQuery.platform.documents.get(
          `tutorialContract.${typeLocator}`,
          queryOpts
        );
        clientQuery.disconnect();
        console.log("Found documents: ", { documents });
        commit("setDocuments", { contractId, documents });
        commit("setSyncing", false);
      } catch (e) {
        dispatch("showSnackError", e);
        console.error("Something went wrong:", e);
        commit("setSyncing", false);
      }
    },
    async searchDashNames({ commit, dispatch }, searchString) {
      let queryOpts = {
        where: [
          ["normalizedParentDomainName", "==", "dash"],
          ["normalizedLabel", "startsWith", searchString.toLowerCase()],
        ],
        startAt: 0,
        limit: 20,
        orderBy: [["normalizedLabel", "asc"]],
      };
      try {
        const searchNames = await client.platform.documents.get("dpns.domain", queryOpts);
        console.log({ searchNames });
        commit("setSearchNames", searchNames);
      } catch (e) {
        dispatch("showSnackError", e);
        console.error("Something went wrong:", e);
      }
    },
    async createIdentity({ commit, dispatch }) {
      try {
        const identity = await client.platform.identities.register();
        cacheIdentity(identity);
        commit("addIdentity", { identity });
      } catch (e) {
        dispatch("showSnackError", e);
        console.log(e);
        throw e;
      }
    },
    async registerName({ commit }, { identityId, name }) {
      // const identity = await client.platform.identities.get(identityId);
      const identity = await cachedOrGetIdentity(client, identityId);
      const createDocument = await client.platform.names.register(
        name + ".dash",
        { dashUniqueIdentityId: identity.getId() },
        identity
      );
      console.log("createDocument", createDocument);
      const [doc] = await client.platform.documents.get("dpns.domain", {
        where: [
          ["normalizedParentDomainName", "==", "dash"],
          ["normalizedLabel", "==", name.toLowerCase()],
        ],
      });
      console.log("doc", doc);
      commit("addName", { identity, name });
    },
    async registerContract({ commit, dispatch }, { identityId, json }) {
      const { platform } = client;
      console.log(identityId);
      try {
        // let identity = await platform.identities.get(identityId);
        let identity = await cachedOrGetIdentity(client, identityId);
        const definitions = json.definitions;
        delete json.definitions;
        console.log("Creating contract with:");
        console.log("JSON", json);
        console.log("identity", identity);
        const contract = await platform.contracts.create(json, identity);
        console.log("Contract created", { contract });
        console.log("contract.toJSON()", contract.toJSON());
        console.log("contract.setDefinitions()");
        contract.setDefinitions(definitions);
        console.log("contract.toJSON()", contract.toJSON());

        // Make sure contract passes validation checks
        console.log("dataContract.validate()");
        const validationResult = await platform.dpp.dataContract.validate(contract);

        if (validationResult.isValid()) {
          // If validation passed, broadcast contract

          console.log("validation passed, broadcasting contract..");
          await platform.contracts.broadcast(contract, identity);
        } else {
          // If validation errors exist, log to console and throw the first.

          console.error(validationResult);
          throw validationResult.errors[0];
        }

        commit("addContract", contract);
      } catch (e) {
        dispatch("showSnackError", e);
        console.error("Something went wrong:", e);
      }
    },
    async validateDocument({ dispatch }, { identityId, contractId, type, json, nonce }) {
      console.log("validating document");
      console.log({ identityId });
      console.log({ contractId });
      console.log({ json });

      const clientAppsOpts = {
        network: "evonet",
        wallet: { mnemonic: this.state.wallet.mnemonic },
        apps: {
          tutorialContract: {
            contractId,
          },
        },
      };
      console.log("second dashjs client opts", clientAppsOpts);

      const sdkApps = new DashJS.Client(clientAppsOpts);
      const { platform } = sdkApps;

      try {
        console.log({ identityId });
        const identity = await platform.identities.get(identityId);
        // const identity = await cachedOrGetIdentity(client, identityId);

        console.log({ identity });

        // Create the note document
        const document = await platform.documents.create(
          `tutorialContract.${type}`,
          identity,
          json
        );
        console.log({ document });
        // validate the document
        const validationResult = await platform.dpp.document.validate(document);
        if (validationResult.isValid()) {
          console.log("validation success");
        } else {
          console.log("validation failed");
        }
        console.log(validationResult);
        return { validationResult, nonce };
      } catch (e) {
        dispatch("showSnackError", e);
        console.error("Something went wrong:", e);
      } finally {
        sdkApps.disconnect();
      }
    },
    async submitDocument({ commit, dispatch }, { identityId, contractId, type, json }) {
      console.log("submitting document");
      console.log({ identityId });
      console.log({ contractId });
      console.log({ json });

      const clientAppsOpts = {
        network: "evonet",
        wallet: { mnemonic: this.state.wallet.mnemonic },
        apps: {
          tutorialContract: {
            contractId,
          },
          // dpns: {
          //   contractId: "7PBvxeGpj7SsWfvDSa31uqEMt58LAiJww7zNcVRP1uEM",
          // },
        },
      };
      console.log("second dashjs client opts", clientAppsOpts);

      const sdkApps = new DashJS.Client(clientAppsOpts);
      const { platform } = sdkApps;

      try {
        console.log({ identityId });
        await client.wallet.getAccount();
        const identity = await platform.identities.get(identityId);
        // const identity = await cachedOrGetIdentity(client, identityId);

        console.log({ identity });

        // Create the note document
        const document = await platform.documents.create(
          `tutorialContract.${type}`,
          identity,
          json
        );
        const documentBatch = {
          create: [document],
          replace: [],
          delete: [],
        };
        console.log({ document });
        // Sign and submit the document
        await platform.documents.broadcast(documentBatch, identity);
        commit("addDocument", { identity, document }); // FIXME next under contractId
      } catch (e) {
        dispatch("showSnackError", e);
        console.error("Something went wrong:", e);
      } finally {
        sdkApps.disconnect();
      }
    },
    async initWallet({ commit, dispatch, getters }) {
      const { mnemonic } = this.state.wallet;
      commit("resetSync", true);

      console.debug("Start wallet sync...");

      try {
        console.dir(client, { depth: 5 });

        try {
          if (client) {
            client.disconnect();
            console.log("sdk disconnecting..");
          }
        } catch (e) {
          dispatch("showSnackError", e);
          console.log(e);
        }

        console.log("mnemonic is", mnemonic);
        client = new DashJS.Client({
          network: "evonet",
          wallet: {
            mnemonic,
          },
          apps: {
            // dpns: {
            //   contractId: "7PBvxeGpj7SsWfvDSa31uqEMt58LAiJww7zNcVRP1uEM",
            // },
          },
        });
        // const onReceivedTransaction = function (data) {
        //   const { account } = client;
        //   console.log("Received tx", data.txid);
        //   console.log("Total pending confirmation", account.getUnconfirmedBalance());
        //   console.log("Total balance", account.getTotalBalance());
        // };
        // client.account.on("FETCHED/UNCONFIRMED_TRANSACTION", onReceivedTransaction);
        const account = await client.wallet.getAccount();
        const totalBalance = account.getTotalBalance();
        if (totalBalance < 1000000) {
          dispatch("getMagicInternetMoney");
        }

        if (typeof mnemonic !== "undefined") dispatch("refreshWallet");
        setInterval(function () {
          // console.log(getters.hasWallet);
          if (getters.hasWallet) dispatch("refreshWallet");
        }, 5000);
        console.dir({ client }, { depth: 5 });
      } catch (e) {
        console.debug("Wallet synchronized with an error:");
        dispatch("showSnackError", e);
        commit("setError", e);
        commit("setSyncing", false);
        // client.account.disconnect();
        return;
      }

      console.debug("Wallet is synchronized");

      commit("setSyncing", false);

      // TODO: DashJS does not support listIdentities
      // demoSDK.listIdentities().forEach((identity) => {
      //   commit('addIdentity', { identity, type: identity.getType() });
      // });
    },
    showSnackError({ commit }, error) {
      commit("setSnackError", { show: true, text: error });
    },
    async refreshWallet({ commit, dispatch }) {
      const { wallet } = client;
      const account = await client.wallet.getAccount();
      try {
        const unusedAddress = account.getUnusedAddress().address;
        const confirmedBalance = account.getConfirmedBalance();
        const unconfirmedBalance = account.getUnconfirmedBalance();
        const addresses = account.getAddresses();
        const balance = account.getTotalBalance();
        const utxos = account.getUTXOS();
        const mnemonic = wallet.exportWallet();

        commit("setWallet", {
          mnemonic,
          utxos,
          history,
          unusedAddress,
          balance,
          confirmedBalance,
          unconfirmedBalance,
          addresses,
        });
        // console.log("Funding address", account.getUnusedAddress());
        // console.log("Confirmed Balance", account.getConfirmedBalance());
        // console.log("Unconfirmed Balance", account.getUnconfirmedBalance());
        // console.log("Total Balance", account.getTotalBalance());
        // console.log("Mnemonic", mnemonic);
        // console.log("getAccount", wallet.getAccount());
      } catch (e) {
        dispatch("showSnackError", e);
        console.log(e);
        throw e;
      }
    },
  },
  getters: {
    getWallet(state) {
      const { wallet } = state;
      return wallet;
    },
    hasWallet(state) {
      return Boolean(state.wallet.mnemonic);
    },
    userIdentities(state) {
      const { user } = state.identities;
      return user.map((identity) => ({
        text: identity.id,
        value: identity.id,
        names: state.names[identity.id] || [],
        type: "user",
      }));
    },
    applicationIdentities(state) {
      const { application } = state.identities;
      return application.map((identity) => ({
        text: identity.id,
        value: identity.id,
        identityId: identity.id,
      }));
    },
    // TODO refactor, contractIdentities should be comboContracts and live in Platform.vue
    contractIdentities(state) {
      const { contracts } = state;
      console.log(contracts);
      let n = Object.keys(contracts).map(function (identityId) {
        const contractId = Object.keys(contracts[identityId])[0]; // TODO support multiple contracts per identity

        return {
          text: contractId,
          value: contractId,
          contractId,
          identityId,
        };
      });
      console.log("n", n);
      return n;
    },
    names(state) {
      const { names } = state;
      return names;
    },
    userIdentitiesWithNames(state) {
      const { user } = state.identities;
      return user.map((identity) => ({
        ...identity,
        names: state.names[identity.id] || [],
      }));
    },
    searchDashNameList(state) {
      const { searchNames } = state;
      return searchNames.map((document) => ({
        label: document.label,
        dashIdentity: document.records.dashIdentity,
      }));
    },
    applicationIdentitiesWithContracts(state) {
      const { application } = state.identities;
      const mapped = application.map((identity) => ({
        ...identity,
        contract: state.contracts[identity.id],
      }));
      console.dir(mapped);
      return mapped;
    },
    contracts(state) {
      const { contracts } = state;
      console.log({ contracts });
      return contracts;
    },
    documents(state) {
      const { documents } = state;
      console.log(documents);
      return documents;
    },
    errorDetails(state) {
      return state.errorDetails;
    },
    isSyncing(state) {
      return state.isSyncing;
    },
    isError(state) {
      return state.isError;
    },
    snackError(state) {
      return state.snackError;
    },
  },
  plugins: [createPersistedState()],
});
