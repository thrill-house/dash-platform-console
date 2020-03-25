<template>
  <v-container>
    <v-row>
      <v-col class="d-flex" cols="12">
        <v-combobox
          v-model="selectedContractId"
          :items="contractIds"
          label="Choose or paste contractId"
          outlined
        ></v-combobox>
      </v-col>
    </v-row>
    <v-row>
      <v-col v-if="selectedContractId" class="d-flex" cols="12">
        <v-select
          v-model="selectedDocumentType"
          :items="documentTypes"
          outlined
          append-icon-outer="mdi-plus"
          label="Document Type"
        ></v-select>
        <v-btn dark small fab top right color="blue" class="mt-2" @click="() => openDialog()">
          <v-icon>mdi-plus</v-icon>
        </v-btn>
      </v-col>
    </v-row>
    <v-row v-if="selectedContractId">
      <v-col>
        <v-expansion-panels>
          <v-expansion-panel>
            <v-expansion-panel-header>View Contract</v-expansion-panel-header>
            <v-expansion-panel-content>
              <pre>{{ selectedContractPretty }}</pre>
            </v-expansion-panel-content>
          </v-expansion-panel>
          <v-expansion-panel dense>
            <v-expansion-panel-header dense>Query Options for '{{ selectedDocumentType }}'</v-expansion-panel-header>
            <v-expansion-panel-content dense>
              <v-row dense>
                <v-col cols="12" md="4">
                  <v-text-field v-model="queryModifiers.limit" label="limit" type="number"></v-text-field>
                </v-col>

                <v-col cols="12" md="4">
                  <v-text-field v-model="queryModifiers.orderBy" label="orderBy"></v-text-field>
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field v-model="queryModifiers.startAt" label="startAt" type="number"></v-text-field>
                </v-col>
              </v-row>
              <v-row v-for="(property, i) in documentProperties" :key="i" dense>
                <v-col cols="12" md="4" dense>
                  <v-text-field label="Index Field" dense outlined readonly :value="property"></v-text-field>
                </v-col>
                <v-col cols="12" md="4" dense>
                  <v-select
                    v-model="whereOperators[property]"
                    :items="queryOperators"
                    label="Operator"
                    outlined
                    dense
                  ></v-select>
                </v-col>
                <v-col cols="12" md="4" dense>
                  <v-text-field v-model="whereValues[property]" label="Value" dense outlined></v-text-field>
                </v-col>
              </v-row>
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-col>
    </v-row>
    <v-row v-if="selectedContractId">
      <v-col>
        <v-btn
          color="primary"
          @click="submitQuery()"
        >Query documents of type "{{ selectedDocumentType }}"</v-btn>
      </v-col>
    </v-row>
    <v-row v-if="Object.keys(queryOpts).length">
      <v-col>
        <h2>Query Options</h2>
        <pre>{{ prettyJson(queryOpts) }}</pre>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <h2 v-if="Object.keys(selectedDocuments).length">Documents</h2>
        <pre v-for="document in selectedDocuments">{{ prettyJson(document) }}</pre>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <v-form>
          <v-container>
            <v-expansion-panels></v-expansion-panels>
          </v-container>
        </v-form>
      </v-col>
    </v-row>

    <v-dialog v-model="showJsonDialog" fullscreen persistent transition="dialog-bottom-transition">
      <v-card>
        <v-form @submit="validateJsonAndSubmit">
          <v-toolbar color="primary">
            <v-btn icon @click="showJsonDialog = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
            <v-toolbar-title>Document "{{ selectedDocumentType }}" for {{ selectedContractId }}</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-toolbar-items>
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
          />
        </v-form>
      </v-card>
    </v-dialog>
  </v-container>
  <!-- <v-container v-else>
    <v-row>
      <v-col>
        <v-alert
          type="error"
        >You must register a contract first in order to submit a document for it.</v-alert>
      </v-col>
    </v-row>
  </v-container>-->
</template>

<script>
import { mapGetters, mapActions } from "vuex";
import AceEditor from "vue2-ace-editor";
import "brace/mode/json";
import "brace/theme/clouds_midnight";

export default {
  components: { AceEditor },
  data() {
    return {
      snackbar: false,
      snackbarText: "",
      selectedContractId: null,
      selectedDocumentType: "",
      showJsonDialog: false,
      submitting: false,
      json: "",
      queryModifiers: { limit: 10, startAt: 0, order: "" },
      whereValues: {},
      whereOperators: {},
      whereFields: {},
      queryOpts: {},
      queryOperators: [
        "<",
        "<=",
        "==",
        "=>",
        ">",
        "in",
        "length",
        "contains",
        "elementMatch",
        "startsWith",
      ],
    };
  },
  computed: {
    ...mapGetters(["contracts", "documents"]),
    contractIds() {
      return Object.keys(this.contracts);
    },
    documentProperties() {
      const { contracts, selectedContractId } = this;
      console.log(contracts[selectedContractId]);
      const properties = [];
      if (this.selectedContract[this.selectedDocumentType]) {
        console.log(this.selectedContract[this.selectedDocumentType]);
        const { indices } = this.selectedContract[this.selectedDocumentType];
        let i;
        for (i in indices) {
          console.log(i);
          console.log(indices[i]);

          let p;
          for (p in indices[i].properties) {
            console.log("p", p);
            console.log(Object.keys(indices[i].properties[p])[0]);
            properties.push(Object.keys(indices[i].properties[p])[0]);
            // console.log(Object.keys(indices[i][p])[0]);
          }
        }
      }
      console.log(properties);
      return properties;
    },
    selectedContract() {
      const { contracts, selectedContractId } = this;

      const contract = contracts[selectedContractId];
      if (!contract) {
        this.addContract({ identifier: selectedContractId });
        console.log("fetching unknown contract and adding to state");
        return {};
      }
      console.log(contract);
      // console.log(Object.keys(contract["domain"].indices[0].properties[0]));
      return contract;
    },
    selectedContractPretty() {
      return this.prettyJson(this.selectedContract);
    },
    selectedDocuments() {
      const selectedDocuments = this.selectedContractId
        ? this.documents[this.selectedContractId]
        : {};
      return selectedDocuments || {};
    },
    documentTypes() {
      let types = [];
      if (this.selectedContractId) {
        types = Object.keys(this.selectedContract);
      }
      this.selectedDocumentType = types[0];
      return types;
    },
  },
  methods: {
    ...mapActions(["submitDocument", "queryDocuments", "showSnackError", "addContract"]),
    submitQuery() {
      const {
        documentProperties,
        whereOperators,
        whereValues,
        queryModifiers,
        queryDocuments,
        selectedContractId,
        selectedDocumentType,
      } = this;

      const { limit, startAt, orderBy } = queryModifiers;
      this.queryOpts = { limit, startAt, orderBy };

      const where = [];
      let i;
      for (i in documentProperties) {
        const property = documentProperties[i];
        if (whereOperators[property] && whereValues[property]) {
          where.push([property, whereOperators[property], whereValues[property]]);
        }
      }
      this.queryOpts.where = where.length ? where : undefined;

      console.log(this.queryOpts);
      queryDocuments({
        contractId: selectedContractId,
        typeLocator: selectedDocumentType,
        queryOpts: this.queryOpts,
      });
    },
    prettyJson(uglyJson) {
      return JSON.stringify(uglyJson, null, " ");
    },
    openDialog() {
      this.showJsonDialog = true;
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
      const { json, selectedContractId, selectedDocumentType } = this;
      this.submitting = true;
      this.submitDocument({
        contractId: selectedContractId,
        type: selectedDocumentType,
        json: JSON.parse(json.toString()),
      })
        .then(() => {
          this.showJsonDialog = false;
        })
        .catch((e) => {
          this.showSnackError(e);
        })
        .finally(() => {
          this.submitting = false;
        });
    },
  },
};
</script>
