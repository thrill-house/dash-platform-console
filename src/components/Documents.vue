<template>
  <v-container>
    <v-row>
      <v-col v-if="selectedContractId" class="d-flex" cols="12">
        <v-select
          v-model="selectedDocumentType"
          :items="documentTypes"
          outlined
          append-icon-outer="mdi-plus"
          label="Document Type"
        ></v-select>
        <v-btn dark small fab top right color="blue" class="mt-2 ml-2" @click="() => openDialog()">
          <v-icon>mdi-file-upload</v-icon>
        </v-btn>
      </v-col>
    </v-row>
    <v-row v-if="selectedContractId">
      <v-col>
        <v-expansion-panels focusable="" :value="panel">
          <v-expansion-panel>
            <v-expansion-panel-header
              >View Contract
              <template v-slot:actions>
                <v-btn icon>
                  <v-icon color="primary" @click.stop="showSelectedContractInDialog"
                    >mdi-arrow-expand</v-icon
                  >
                </v-btn>
                <v-btn
                  icon
                  router
                  :to="{
                    name: 'platform',
                    params: { contractid: selectedContractId }
                  }"
                  target="_blank"
                  @click.stop
                >
                  <v-icon color="primary">mdi-link-variant</v-icon>
                </v-btn>
              </template>
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <AceEditor
                ref="aceEditor"
                theme="crimson_editor"
                class="embedded"
                :value="selectedContractPretty"
                lang="json"
                width="100%"
                height="94vh"
              />
              <!-- <pre>{{ selectedContractPretty }}</pre> -->
            </v-expansion-panel-content>
          </v-expansion-panel>
          <v-expansion-panel dense>
            <v-expansion-panel-header dense
              >Query Options for '{{ selectedDocumentType }}'
              <template v-slot:actions>
                <v-btn
                  icon
                  router
                  :to="{
                    name: 'platform',
                    params: { contractid: selectedContractId },
                    query: {
                      querydocs: true,
                      type: selectedDocumentType,
                      queryopts: encodeURIComponent(JSON.stringify(readQueryOpts())),
                    },
                  }"
                  target="_blank"
                  @click.stop
                >
                  <v-icon color="primary">mdi-link-variant</v-icon>
                </v-btn>
              </template>
            </v-expansion-panel-header>
            <v-expansion-panel-content dense>
              <v-row dense>
                <v-col cols="12" md="1">
                  <v-text-field
                    v-model="queryModifiers.limit"
                    label="limit"
                    type="number"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="1">
                  <v-text-field
                    v-model="queryModifiers.startAt"
                    label="startAt"
                    type="number"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="3">
                  <v-select
                    v-model="orderBy1.property"
                    :items="documentProperties"
                    label="orderBy 1"
                    clearable
                  ></v-select>
                </v-col>
                <v-col cols="12" md="2">
                  <v-select
                    v-model="orderBy1.direction"
                    :items="['asc', 'desc']"
                    label="Direction 1"
                  ></v-select>
                </v-col>
                <v-col cols="12" md="3">
                  <v-select
                    v-model="orderBy2.property"
                    :items="documentProperties"
                    label="orderBy 2"
                    clearable
                  ></v-select>
                </v-col>
                <v-col cols="12" md="2">
                  <v-select
                    v-model="orderBy2.direction"
                    :items="['asc', 'desc']"
                    label="Direction 2"
                  ></v-select>
                </v-col>
              </v-row>
              <v-row v-for="(property, i) in documentProperties" :key="i" dense>
                <v-col cols="12" md="4" dense>
                  <v-text-field
                    label="Index Field"
                    dense
                    outlined
                    readonly
                    :value="property"
                  ></v-text-field>
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
                  <v-text-field
                    v-model="whereValues[property]"
                    label="Value"
                    dense
                    outlined
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-col>
    </v-row>
    <v-row v-if="selectedContractId">
      <v-col>
        <v-btn color="primary" @click="submitQuery()"
          >Query documents of type "{{ selectedDocumentType }}"</v-btn
        >
      </v-col>
    </v-row>
    <v-row v-if="Object.keys(readQueryOpts()).length">
      <v-col>
        <h2>
          Query Options
        </h2>
        <pre>{{ prettyJson(readQueryOpts()) }}</pre>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <h2 v-if="Object.keys(selectedDocuments).length">Documents</h2>
        <pre v-for="(document, i) in selectedDocuments" :key="i">{{ prettyJson(document) }}</pre>
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
            <v-btn icon dark @click="showJsonDialog = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
            <v-toolbar-title v-if="JSONIs === 'document'"
              >Document "{{ selectedDocumentType }}" for {{ selectedContractId }}</v-toolbar-title
            >
            <v-toolbar-title v-if="JSONIs === 'contract'"
              >Contract {{ selectedContractId }}</v-toolbar-title
            >
            <v-spacer></v-spacer>
            <v-toolbar-items v-if="JSONIs === 'document'">
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
import "brace/theme/crimson_editor";

export default {
  components: { AceEditor },
  props: ["selectedIdentityId", "panel", "selectedDocumentTypeProp", "queryOptsProp"],
  data() {
    return {
      snackbar: false,
      snackbarText: "",
      selectedDocumentType: "",
      showJsonDialog: false,
      submitting: false,
      json: "",
      JSONIs: "document",
      queryModifiers: { limit: 10, startAt: 1 },
      orderBy1: { property: "", direction: "asc" },
      orderBy2: { property: "", direction: "asc" },
      whereValues: {},
      whereOperators: {},
      whereFields: {},
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
      return Object.keys(this.contracts[this.selectedIdentityId]);
    },
    documentProperties() {
      const { contracts, selectedContractId } = this;
      console.log("cc", contracts[selectedContractId]);
      const properties = [];
      console.log("ts", this.selectedContract);
      if (this.selectedContract.documents[this.selectedDocumentType]) {
        console.log(this.selectedContract.documents[this.selectedDocumentType]);
        const { indices } = this.selectedContract.documents[this.selectedDocumentType];
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
    selectedContractId() {
      console.log("selectedContract()");
      console.log("this.selectedIdentityId", this.selectedIdentityId);

      const idContracts = this.contracts[this.selectedIdentityId];
      console.log({ idContracts });
      const contractIdsForIdentity = Object.keys(idContracts);
      console.log({ contractIdsForIdentity });
      console.log("selectedContractId computed", contractIdsForIdentity[0]);
      return contractIdsForIdentity[0];
    },
    selectedContract() {
      const { contracts, selectedContractId, selectedIdentityId } = this;

      const contract = contracts[selectedIdentityId][selectedContractId];
      if (!contract) {
        this.addContract({ identifier: selectedContractId });
        console.log("fetching unknown contract and adding to state");
        return {}; // Return empty object for lazy hydration
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
      const { selectedDocumentTypeProp } = this;
      console.log({ selectedDocumentTypeProp });
      let types = [];
      if (this.selectedContractId) {
        types = Object.keys(this.selectedContract.documents);
      }
      // eslint-disable-next-line
      // this.selectedDocumentType = types[0]; // oh so hackisch FIXME
      console.log({ types });
      // eslint-disable-next-line
      this.selectedDocumentType = this.selectedDocumentTypeProp ||types[0]

      return types;
    },
  },
  mounted() {
    if (this.$route.query.querydocs) {
      let uriOpts;
      try {
        console.log("enc", this.queryOptsProp);
        console.log("decoded", decodeURIComponent(this.queryOptsProp));
        console.log("json", JSON.parse(decodeURIComponent(this.queryOptsProp)));
        uriOpts = JSON.parse(decodeURIComponent(this.queryOptsProp));
        console.log("querymagic", { uriOpts });
        this.setQueryOpts(uriOpts);
      } catch (e) {
        this.showSnackError(e.message);
      }

      this.queryDocuments({
        contractId: this.selectedContractId,
        typeLocator: this.selectedDocumentType,
        queryOpts: this.readQueryOpts(uriOpts),
      });
    }
  },
  methods: {
    ...mapActions(["submitDocument", "queryDocuments", "showSnackError", "addContract"]),
    setQueryOpts(uriOpts) {
      const { whereOperators, whereValues, queryModifiers, orderBy1, orderBy2 } = this;

      console.log("this is where", uriOpts.where);
      let idx;
      for (idx in uriOpts.where) {
        console.log("these are ops", idx);
        const property = uriOpts.where[idx][0];
        const operator = uriOpts.where[idx][1];
        const value = uriOpts.where[idx][2];
        whereOperators[property] = operator;
        whereValues[property] = value;
      }
      // this.queryModifiers.limit = uriOpts.queryModifiers.limit;
      // this.queryModifiers.startAt = uriOpts.queryModifiers.startAt;
      Object.assign(queryModifiers, uriOpts);
      console.log({ queryModifiers });
      console.log({ uriOpts });
      if (uriOpts.orderBy) {
        this.orderBy1.property = uriOpts.orderBy[0][0] || "";
        this.orderBy1.direction = uriOpts.orderBy[0][1] || "asc";
        console.log({ orderBy1 });
        this.orderBy2.property = uriOpts.orderBy[1][0] || "";
        this.orderBy2.direction = uriOpts.orderBy[1][1] || "asc";
        console.log({ orderBy2 });
      }
      // const { limit, startAt } = queryModifiers;
      // let queryOpts = { limit, startAt };

      // const orderBy = [];
      // if (orderBy1.property) orderBy.push([orderBy1.property, orderBy1.direction]);
      // if (orderBy2.property) orderBy.push([orderBy2.property, orderBy2.direction]);
      // queryOpts.orderBy = orderBy;

      // const where = [];
      // let i;
      // for (i in documentProperties) {
      //   const property = documentProperties[i];

      //   const op = whereOperators[property];
      //   const val = whereValues[property];

      //   if (op && val) {
      //     const arrayOps = ["in", "contains", "elementMatch"];
      //     if (arrayOps.includes(op)) {
      //       try {
      //         where.push([property, whereOperators[property], JSON.parse(whereValues[property])]);
      //       } catch (e) {
      //         this.showSnackError(e.message + " ( Make sure to use double ticks instead of ' )");
      //       }
      //     } else if (op === "length") {
      //       const num = parseInt(val);
      //       if (num) {
      //         where.push([property, whereOperators[property], parseInt(whereValues[property])]);
      //       } else {
      //         this.showSnackError(`"${val}" must be a number`);
      //       }
      //     } else {
      //       where.push([property, whereOperators[property], whereValues[property]]);
      //     }
      //   }
      // }
      // queryOpts.where = where.length ? where : undefined;
      // queryOpts.orderBy = orderBy.length ? orderBy : undefined;

      // if (uriOpts) {
      //   queryOpts = uriOpts;
      // }
      // console.dir({ queryOpts }, { depth: 5 });
      // return queryOpts;
    },
    readQueryOpts(uriOpts) {
      const {
        documentProperties,
        whereOperators,
        whereValues,
        queryModifiers,
        orderBy1,
        orderBy2,
      } = this;

      const { limit, startAt } = queryModifiers;
      let queryOpts = { limit: parseInt(limit), startAt: parseInt(startAt) };

      const orderBy = [];
      if (orderBy1.property) orderBy.push([orderBy1.property, orderBy1.direction]);
      if (orderBy2.property) orderBy.push([orderBy2.property, orderBy2.direction]);

      queryOpts.orderBy = orderBy;
      
      const where = [];
      let i;
      for (i in documentProperties) {
        const property = documentProperties[i];

        const op = whereOperators[property];
        const val = whereValues[property];

        if (op && val) {
          const arrayOps = ["in", "contains", "elementMatch"];
          if (arrayOps.includes(op)) {
            try {
              where.push([property, whereOperators[property], JSON.parse(whereValues[property])]);
            } catch (e) {
              this.showSnackError(e.message + " ( Make sure to use double ticks instead of ' )");
            }
          } else if (op === "length") {
            const num = parseInt(val);
            if (num) {
              where.push([property, whereOperators[property], parseInt(whereValues[property])]);
            } else {
              this.showSnackError(`"${val}" must be a number`);
            }
          } else {
            where.push([property, whereOperators[property], whereValues[property]]);
          }
        }
      }
      queryOpts.where = where.length ? where : undefined;
      queryOpts.orderBy = orderBy.length ? orderBy : undefined;

      if (uriOpts) {
        queryOpts = uriOpts;
      }
      console.dir({ queryOpts }, { depth: 5 });
      console.log({ queryOpts });

      return queryOpts;
    },
    showSelectedContractInDialog() {
      this.json = this.selectedContractPretty;
      this.JSONIs = "contract";
      this.showJsonDialog = true;
    },
    submitQuery() {
      console.log({
        contractId: this.selectedContractId,
        typeLocator: this.selectedDocumentType,
        queryOpts: this.readQueryOpts(),
      });
      this.queryDocuments({
        contractId: this.selectedContractId,
        typeLocator: this.selectedDocumentType,
        queryOpts: this.readQueryOpts(),
      });
    },
    prettyJson(uglyJson) {
      return JSON.stringify(uglyJson, null, " ");
    },
    openDialog() {
      console.log("this.selectedIdentityId", this.selectedIdentityId);
      this.JSONIs = "document";
      this.json = ""; // FEATURE generate minimal document JSON from contract schema
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
      const { json, selectedIdentityId, selectedContractId, selectedDocumentType } = this;
      this.submitting = true;
      this.submitDocument({
        identityId: selectedIdentityId,
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

<style scoped>
tr > td:last-child {
  width: 1%;
}

.ace_editor {
  font-size: 2rem;
}
.ace_editor.embedded {
  font-size: 1.25rem;
}
</style>
