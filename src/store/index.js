import Vue from 'vue';
import Vuex from 'vuex';
import createPersistedState from 'vuex-persistedstate';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    identities: [],
    names: [],
    contracts: [],
    documents: [],
  },
  mutations: {
    addIdentity(state, identity) {
      state.identities.push(identity);
    },
  },
  actions: {
    async createIdentity({ commit }, type) {
      const identity = await new Promise((resolve) => {
        setTimeout(() => resolve({ id: `t_id_${Date.now()}`, type }), 2000);
      });
      commit('addIdentity', identity);
    },
  },
  plugins: [createPersistedState()],
});
