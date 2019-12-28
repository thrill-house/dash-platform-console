import Vue from 'vue';
import Vuex from 'vuex';
import createPersistedState from 'vuex-persistedstate';
import DashDemoSDK from 'evo-net-demo';

Vue.use(Vuex);

const demoSDK = new DashDemoSDK();
const seeds = [
  { service: '18.236.131.253' },
];

export const identityTypes = {
  application: {
    name: 'application',
    value: 1,
  },
  user: {
    name: 'user',
    value: 2,
  },
};

export default new Vuex.Store({
  state: {
    isSyncing: true,
    mnemonic: 'final vocal warm mansion person awesome sell spend solar tobacco gain canoe',
    errorDetails: null,
    isError: false,
    identities: {
      user: [],
      application: [],
    },
    names: {},
    contracts: {},
    documents: {},
  },
  mutations: {
    addIdentity(state, { identity, type }) {
      state.identities[type.name].push(identity);
    },
    addName(state, { identity, name }) {
      const { id } = identity;
      const names = state.names[id] || [];
      state.names = {
        ...state.names,
        [id]: [
          ...names,
          name,
        ],
      };
    },
    addContract(state, { identity, contract }) {
      const { id } = identity;
      state.contracts = {
        ...state.contracts,
        [id]: contract,
      };
    },
    changeMnemonic(state, mnemonic) {
      state.mnemonic = mnemonic;
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
    reset(state) {
      state.errorDetails = null;
      state.isError = false;
      state.isSyncing = true;
    },
  },
  actions: {
    async createIdentity({ commit }, type) {
      const identityId = await demoSDK.registerIdentity(type);
      const identity = await demoSDK.getIdentityFromNetwork(identityId);
      commit('addIdentity', { identity, type: identity.getType() });
    },
    async registerName({ commit }, { identity, name }) {
      await new Promise((resolve) => {
        setTimeout(() => resolve(name), 2000);
      });
      commit('addName', { identity, name });
    },
    async registerContract({ commit }, { identity, json }) {
      const contract = await new Promise((resolve) => {
        setTimeout(() => resolve(json), 2000);
      });
      commit('addContract', { identity, contract });
    },
    async initWallet({ commit }) {
      commit('reset', true);
      const { mnemonic } = this.state;

      console.debug('Start wallet sync...');

      try {
        await demoSDK.init({ mnemonic, seeds });
      } catch (e) {
        console.debug('Wallet synchronized with an error:');
        console.error(e);
        commit('setError', e);
        commit('setSyncing', false);
        return;
      }

      console.debug('Wallet is synchronized');

      commit('setSyncing', false);
      demoSDK.listIdentities().forEach((identity) => {
        commit('addIdentity', { identity, type: identity.getType() });
      });
    },
  },
  getters: {
    identityLists(state) {
      const { identities } = state;
      return Object.keys(identityTypes).map(typeName => ({
        type: identityTypes[typeName],
        items: identities[typeName],
      }));
    },
    userIdentitiesWithNames(state) {
      const { user } = state.identities;
      return user.map(identity => ({
        ...identity,
        names: state.names[identity.id] || [],
      }));
    },
    applicationIdentitiesWithContracts(state) {
      const { application } = state.identities;
      return application.map(identity => ({
        ...identity,
        contract: state.contracts[identity.id],
      }));
    },
  },
  plugins: [createPersistedState()],
});
