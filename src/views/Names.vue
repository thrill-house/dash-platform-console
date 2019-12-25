<template>
  <v-container>
    <v-row v-if="userIdentitiesWithNames.length">
      <v-col>
        <v-simple-table>
          <thead>
            <tr>
              <th>Id</th>
              <th>Registered names</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="identity in userIdentitiesWithNames"
              :key="identity.id"
            >
              <td>{{ identity.id }}</td>
              <td>{{ identity.names.join(', ') }}</td>
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
    <v-alert v-else type="error">
      You must have an identity
      in order to create a domain name for it
    </v-alert>

    <v-dialog
        v-model="showNameDialog"
        max-width="400px"
    >
      <v-card>
        <v-card-title>
          Register a new domain name
        </v-card-title>
        <v-card-text>
          <v-text-field counter v-model="name" />
        </v-card-text>
        <v-card-actions>
          <v-btn text @click="showNameDialog">close</v-btn>
          <v-spacer />
          <v-btn
            color="primary"
            :loading="submitting"
            @click="submit"
          >
            submit
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';

export default {
  data() {
    return {
      showNameDialog: false,
      submitting: false,
      selectedIdentity: undefined,
      name: '',
    };
  },
  computed: {
    ...mapGetters(['userIdentitiesWithNames']),
  },
  methods: {
    ...mapActions(['registerName']),
    openDialog(identity) {
      this.selectedIdentity = identity;
      this.name = '';
      this.showNameDialog = true;
    },
    submit() {
      const { name, selectedIdentity } = this;
      this.submitting = true;
      this.registerName({
        identity: selectedIdentity,
        name,
      }).then(() => {
        this.showNameDialog = false;
      }).finally(() => {
        this.submitting = false;
      });
    },
  },
};
</script>

<style scoped>
  tr>td:last-child{
    width: 1%;
  }
</style>
