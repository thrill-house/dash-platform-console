<template>
  <v-container>
    <v-btn x-large color="primary" class="ma-2" @click="() => openDialog(identity)">{{
      identity.contract ? "View Contract" : "Register Contract"
    }}</v-btn>
    <v-dialog v-model="showJsonDialog" fullscreen persistent transition="dialog-bottom-transition">
      <v-card>
        <v-form @submit="validateJsonAndSubmit">
          <v-toolbar color="primary">
            <v-btn icon @click="showJsonDialog = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
            <v-toolbar-title>Contract for {{ selectedIdentity.value }}</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-toolbar-items v-if="!selectedIdentity.contract">
              <v-btn text :loading="submitting" @click="validateJsonAndSubmit">submit</v-btn>
            </v-toolbar-items>
          </v-toolbar>
          <AceEditor
            ref="aceEditor"
            v-model="json"
            lang="json"
            theme="clouds_midnight"
            width="100%"
            height="94vh"
            @init="aceEditorInit"
          />
        </v-form>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
import AceEditor from "vue2-ace-editor";
import "brace/mode/json";
import "brace/theme/clouds_midnight";

export default {
  components: { AceEditor },
  props: ["identity"],
  data() {
    return {
      showJsonDialog: false,
      submitting: false,
      selectedIdentity: {},
      json: "",
    };
  },
  computed: {
    ...mapGetters(["applicationIdentitiesWithContracts", "contracts"]),
  },
  methods: {
    ...mapActions(["registerContract", "showSnackError"]),
    setAceEditorReadonly() {
      const readonly = this.selectedIdentity.contract;
      if (this.$refs.aceEditor) {
        this.$refs.aceEditor.editor.setReadOnly(readonly);
      }
    },
    aceEditorInit() {
      this.setAceEditorReadonly();
    },
    openDialog(identity) {
      this.selectedIdentity = identity;
      this.json = identity.contract ? JSON.stringify(identity.contract, null, 2) : "";
      this.showJsonDialog = true;
      this.setAceEditorReadonly();
    },
    validateJsonAndSubmit() {
      const { json } = this;
      try {
        JSON.parse(json.toString());
        this.submit();
      } catch (e) {
        this.showSnackError(e);
      }
    },
    submit() {
      const { json, identity } = this;
      this.submitting = true;
      this.registerContract({
        identityId: identity.value,
        json: JSON.parse(json.toString()),
      })
        .then(() => {
          this.showJsonDialog = false;
        })
        .finally(() => {
          this.submitting = false;
        });
    },
  },
};
</script>

<style scoped>
tr > td:last-child {
  width: 1%;
}

.ace_editor {
  font-size: 2rem;
}
</style>
