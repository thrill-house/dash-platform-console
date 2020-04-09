import Vue from "vue";
import Vuex from "vuex";
import createPersistedState from "vuex-persistedstate";

Vue.use(Vuex);

const DashJS = require("dash");

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
    mnemonic: undefined,
    confirmedBalance: 0,
  },
  errorDetails: null,
  isError: false,
  snackError: { show: false, text: "" },
  identities: {
    user: [],
    application: [],
  },
  names: {},
  searchNames: [],
  contracts: {},
  documents: {},
};

export const identityTypes = {
  user: {
    name: "user",
    value: 1,
  },
  application: {
    name: "application",
    value: 2,
  },
};

export default new Vuex.Store({
  state: initState,
  mutations: {
    addIdentity(state, { identity, type }) {
      state.identities[type.name].push(identity);
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
    addContract(state, { identity, contract }) {
      const { id } = identity;
      state.contracts = {
        ...state.contracts,
        [id]: contract.documents,
      };
    },
    addDocument(state, { identity, document }) {
      const { id } = identity;
      state.documents = {
        ...state.documents,
        [id]: { ...state.documents[id], [document.entropy]: document },
      };
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
    },
    resetSync(state) {
      state.isSyncing = true;
      state.isError = false;
      state.errorDetails = null;
    },
  },
  actions: {
    async addContract({ commit }, { identifier }) {
      console.log("id", identifier);
      const { platform } = client;
      commit("setSyncing", true);
      const contract = await platform.contracts.get(identifier);
      console.log(contract);
      const identity = { id: identifier };
      console.dir({ contract });

      if (contract === null) console.log("looks like its null");
      commit("addContract", { identity, contract });
      commit("setSyncing", false);
    },
    async sendDash({ dispatch }, { sendToAddress, satoshis }) {
      const { account } = client;
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
    async queryDocuments(
      { commit, dispatch },
      {
        contractId,
        // typeLocator,
        queryOpts,
      }
    ) {
      console.log(queryOpts);
      commit("setSyncing", true);
      try {
        await client.isReady();
        const documents = await client.platform.documents.get("dpns.domain", queryOpts); // TODO change dpns domain to contract id
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
        commit("setSearchNames", searchNames);
      } catch (e) {
        dispatch("showSnackError", e);
        console.error("Something went wrong:", e);
      }
    },
    async createIdentity({ commit, dispatch }, type) {
      try {
        const identityId = await client.platform.identities.register(type.name);
        const identity = await client.platform.identities.get(identityId);
        commit("addIdentity", { identity, type });
      } catch (e) {
        dispatch("showSnackError", e);
        console.log(e);
        throw e;
      }
    },
    async registerName({ commit }, { identityId, name }) {
      const identity = await client.platform.identities.get(identityId);
      const createDocument = await client.platform.names.register(name, identity);
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
        let identity = await platform.identities.get(identityId);
        const contract = await platform.contracts.create(json, identity);
        await platform.contracts.broadcast(contract, identity);
        commit("addContract", { identity, contract });
      } catch (e) {
        dispatch("showSnackError", e);
        console.error("Something went wrong:", e);
      }
    },
    async submitDocument({ commit, dispatch }, { contractId, type, json }) {
      console.log(contractId);
      console.log(json);

      const sdkAppsOpts = {
        network: "testnet",
        mnemonic: this.state.wallet.mnemonic,
        apps: {
          contractExample: {
            contractId,
          },
        },
      };
      console.log("second dashjs client opts", sdkAppsOpts);
      const sdkApps = new DashJS.Client(sdkAppsOpts);

      const { platform } = sdkApps;
      await sdkApps.isReady();

      try {
        const identity = await platform.identities.get(contractId);

        // Create the note document
        const document = await platform.documents.create(`contractExample.${type}`, identity, json);

        console.log(document);
        // Sign and submit the document
        await platform.documents.broadcast(document, identity);
        commit("addDocument", { identity, document });
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
          network: "testnet",
          mnemonic,
          apps: {
            dpns: {
              contractId: "77w8Xqn25HwJhjodrHW133aXhjuTsTv9ozQaYpSHACE3",
            },
          },
        });
        // const onReceivedTransaction = function (data) {
        //   const { account } = client;
        //   console.log("Received tx", data.txid);
        //   console.log("Total pending confirmation", account.getUnconfirmedBalance());
        //   console.log("Total balance", account.getTotalBalance());
        // };
        // client.account.on("FETCHED/UNCONFIRMED_TRANSACTION", onReceivedTransaction);
        await client.isReady().then(async () => {
          dispatch("refreshWallet");
          setInterval(function () {
            console.log(getters.hasWallet);
            if (getters.hasWallet) dispatch("refreshWallet");
          }, 5000);
          console.dir({ client }, { depth: 5 });
        });
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
      const { wallet, account } = client;

      try {
        const unusedAddress = account.getUnusedAddress().address;
        const confirmedBalance = account.getConfirmedBalance();
        const unconfirmedBalance = account.getUnconfirmedBalance();
        const addresses = account.getAddresses();
        const balance = account.getTotalBalance();
        const utxos = account.getUTXOS();
        const mnemonic = wallet.mnemonic;

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
        console.log("Total Balance", account.getTotalBalance());
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
    identityLists(state) {
      const { identities } = state;
      console.log("identities", identities);
      console.log("state", state);

      const lists = Object.keys(identityTypes).map((typeName) => ({
        type: identityTypes[typeName],
        items: identities[typeName],
      }));
      console.log("lists", lists);
      return lists;
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
        type: "application",
      }));
    },
    contractIdentities(state) {
      const { contracts } = state;
      console.log(contracts);
      let n = Object.keys(contracts).map((identity) => ({
        text: identity,
        value: identity,
        type: "application",
      }));
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
        userId: document.$userId,
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
      console.log(contracts);
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
