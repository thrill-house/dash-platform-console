<template>
  <v-container>
    <v-btn x-large color="primary" class="ma-2" @click="() => openDialog(identity)">
      {{ identity.contract ? "View Contract" : "Register Contract" }}
    </v-btn>
    <v-dialog v-model="showJsonDialog" fullscreen persistent transition="dialog-bottom-transition">
      <v-card>
        <v-form @submit="validateJsonAndSubmit">
          <v-toolbar color="primary">
            <v-btn icon @click="showJsonDialog = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
            <v-toolbar-title> Contract for {{ selectedIdentity.value }} </v-toolbar-title>
            <v-spacer></v-spacer>
            <v-toolbar-items v-if="!selectedIdentity.contract">
              <v-btn text :loading="submitting" @click="validateJsonAndSubmit"> submit </v-btn>
            </v-toolbar-items>
          </v-toolbar>
          <v-list dense>
            <v-subheader>
              Schema Validation
              <v-icon v-if="isJsonValid" color="green"> mdi-check </v-icon>
            </v-subheader>
            <v-list-item-group v-model="jsonErrors" color="red">
              <v-list-item v-for="(error, i) in jsonErrors" :key="i" color="red">
                <v-list-item-icon>
                  <v-icon color="red">mdi-cancel</v-icon>
                </v-list-item-icon>
                <v-list-item-content color="red">
                  <v-list-item-title color="red" style="color: 'red'">
                    <span style="color: red">
                      {{ error }}
                    </span>
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-list-item-group>
          </v-list>
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

import dpp from "@dashevo/dpp";

export default {
  components: { AceEditor },
  props: ["identity"],
  data() {
    return {
      showJsonDialog: false,
      submitting: false,
      selectedIdentity: {},
      json: "",
      jsonErrors: [],
      isJsonValid: true,
    };
  },
  computed: {
    ...mapGetters(["applicationIdentitiesWithContracts", "contracts"]),
  },
  methods: {
    ...mapActions(["registerContract", "validateContractJSON", "showSnackError"]),
    async validateJSONSchema() {
      console.log("validating");
      let parsedJSON;
      try {
        parsedJSON = JSON.parse(this.json.toString());
        this.jsonErrors = [];
      } catch (e) {
        console.log(e);
        this.jsonErrors = [e];
        this.isJsonValid = false;
        return;
      }
      // TODO FIXME avoid race conditions by queuing / cancelling async calls
      const validationResult = await this.validateContractJSON({
        identityId: this.identity.value,
        json: parsedJSON,
      });
      this.isJsonValid = validationResult.isValid();
      this.jsonErrors = validationResult.errors.map((error) => {
        return `${error.dataPath}: ${error.message}`;
      });
      console.log("jsonErrors", this.jsonErrors);
    },
    setAceEditorReadonly() {
      const readonly = this.selectedIdentity.contract;
      if (this.$refs.aceEditor) {
        this.$refs.aceEditor.editor.setReadOnly(readonly);
      }
    },
    aceEditorInit() {
      const that = this;
      this.setAceEditorReadonly();
      this.$refs.aceEditor.editor.session.on("change", function () {
        that.validateJSONSchema();
      });
    },
    openDialog(identity) {
      this.selectedIdentity = identity;
      this.json = identity.contract ? JSON.stringify(identity.contract, null, 2) : "";
      this.showJsonDialog = true;
      this.setAceEditorReadonly();
    },
    async validateJsonAndSubmit() {
      const { json } = this;
      try {
        const parsedJSON = JSON.parse(json.toString());
        const validationResult = await this.validateContractJSON({
          identityId: this.identity.value,
          json: parsedJSON,
        });
        if (validationResult.isValid()) {
          this.submit();
        } else {
          throw validationResult.errors[0]; // FIXME this error doesn't show the path, also it's checked later during broadcast, maybe remove this check
        }
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
