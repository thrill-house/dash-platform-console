<template>
  <v-container>
    <v-row>
      <v-col>
        <v-card tile flat>
          <v-card-title>
            Create identity
          </v-card-title>
          <v-card-text>
            <v-container>
              <v-row>
              <v-col>
                <v-btn
                  color="teal"
                  :loading="createAppIdentityLoading"
                  @click="() => createIdentity(1)"
                >
                  application
                </v-btn>
              <v-col>
              </v-col>
                <v-btn
                  color="cyan"
                  :loading="createUserIdentityLoading"
                  @click="() => createIdentity(2)"
                >
                  user
                </v-btn>
              </v-col>
            </v-row>
            </v-container>

          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
         <v-simple-table>
          <thead>
            <tr>
              <th class="text-left">Id</th>
              <th class="text-left">Type</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="identity in identities" :key="identity.id">
              <td>{{ identity.id }}</td>
              <td>{{ identity.type === 1 ? 'application' : 'user' }}</td>
            </tr>
          </tbody>
      </v-simple-table>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapState } from 'vuex';

export default {
  data() {
    return {
      createAppIdentityLoading: false,
      createUserIdentityLoading: false,
    };
  },
  computed: {
    ...mapState(['identities']),
  },
  methods: {
    createIdentity(type) {
      if (type === 1) {
        this.createAppIdentityLoading = true;
      }
      if (type === 2) {
        this.createUserIdentityLoading = true;
      }
      this.$store.dispatch('createIdentity', type).finally(() => {
        if (type === 1) {
          this.createAppIdentityLoading = false;
        }
        if (type === 2) {
          this.createUserIdentityLoading = false;
        }
      });
    },
  },

};
</script>
