<template>
  <div>
    <v-container fluid style="max-width: 900px;">
      <v-card class="mx-auto">
        <v-card-title>
          <span class="headline">Wallet Status</span>
        </v-card-title>
        <v-card-text class="text-center">
          <v-container v-if="!hasWallet"
            ><v-btn x-large color="primary" class="ma-2" @click.stop="createMnemonic"
              >Create Wallet</v-btn
            ><v-btn x-large class="ma-2" @click="showRestoreMnemonic">Restore Wallet</v-btn>
          </v-container>
          <v-container v-if="hasWallet" fluid justify="center"
            ><v-btn x-large color="primary" class="ma-2" @click="backupMnemonic"
              >Backup Wallet</v-btn
            ><v-btn x-large class="ma-2" @click="forgetState">Forget Wallet</v-btn>
          </v-container>
        </v-card-text></v-card
      >
    </v-container>
    <v-container fluid style="max-width: 900px;">
      <v-card v-if="hasWallet" class="mx-auto mt-10">
        <v-container>
          <v-row>
            <v-col>
              <v-list-item>
                <v-list-item-content>
                  <v-list-item-title class="headline mb-1">
                    {{ balanceInDash }} Dash
                    <v-tooltip bottom>
                      <template v-slot:activator="{ on }">
                        <v-btn
                          fab
                          absolute
                          small
                          right
                          :loading="isRefreshingBalance"
                          style="z-index: 4;"
                          @click="refreshWallet"
                          v-on="on"
                        >
                          <v-icon color="primary" dark>mdi-refresh</v-icon>
                        </v-btn>
                      </template>
                      <span>Refresh Balance</span>
                    </v-tooltip>
                  </v-list-item-title>
                  <v-list-item-subtitle
                    >{{ confirmedBalanceInDash }} confirmed</v-list-item-subtitle
                  >
                  <v-list-item-subtitle
                    >{{ unconfirmedBalanceInDash }} unconfirmed</v-list-item-subtitle
                  >
                </v-list-item-content>
              </v-list-item>
              <v-list-item>
                <v-list-item-content>
                  <v-list-item-title class="headline mb-2"
                    >Receiving address
                    <v-tooltip v-model="addressCopied" right>
                      <!-- eslint-disable-next-line vue/no-unused-var -->
                      <template v-slot:activator="notneeded">
                        <v-icon class="ml-1 mt-n1" @click="copyReceivingAddressToClipboard"
                          >mdi-clipboard-multiple-outline</v-icon
                        >
                      </template>
                      <span>Copied</span>
                    </v-tooltip>
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    <pre
                      style="font-size: 1.5em;"
                      class="text-wrap"
                      @click="copyReceivingAddressToClipboard"
                      >{{ getWallet.unusedAddress }}
                    </pre>
                    <v-tooltip right>
                      <template v-slot:activator="{ on }">
                        <v-btn small class="my-2" @click="goToFaucet" v-on="on">Get Dash</v-btn>
                      </template>
                      <span>Receive free Dash from the Faucet</span>
                    </v-tooltip>
                  </v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-col>

            <v-col style="text-align: center;">
              <div style="display: inline-block;" @click="copyReceivingAddressToClipboard">
                <qrcode
                  :value="getWallet.unusedAddress"
                  :options="{ width: 200 }"
                  style="margin-top: -5px;"
                ></qrcode>
              </div>
            </v-col>
          </v-row>
        </v-container>

        <v-card-actions>
          <v-row row d-flex nowrap justify="center" class="px-2">
            <v-text-field
              v-model="sendToAddress"
              :error="!sendToAddressValid"
              label="Send Dash to Address"
              :disabled="!getWallet.balance"
              outlined
              hint="Enter a valid Dash Address"
            ></v-text-field>
            <!-- <v-btn
            x-large
            :disabled="!sendToAddressValid"
            color="primary"
            @click="sendDashDialog = true"
          >Send</v-btn>-->
          </v-row>
        </v-card-actions>
      </v-card>
    </v-container>
    <v-container v-if="hasWallet" fluid style="max-width: 900px;">
      <v-expansion-panels :accordion="true" :multiple="true" hover max-width="700px">
        <v-expansion-panel max-width="700px">
          <v-expansion-panel-header>Addresses</v-expansion-panel-header>
          <v-expansion-panel-content>
            <v-card outlined>
              <v-simple-table dense>
                <thead>
                  <tr>
                    <th>Receiving Address</th>
                    <th>Balance</th>
                    <th>Used</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="address in getWallet.addresses"
                    :key="address.id"
                    :style="
                      address.used
                        ? ' background: rgba(255, 82, 82, 0.3);'
                        : ' background: rgba(76, 175, 80, 0.3);'
                    "
                  >
                    <td>{{ address.address }}</td>
                    <td>
                      {{ fromDuffsToDash(address.unconfirmedBalanceSat + address.balanceSat) }}
                    </td>
                    <td>{{ address.used }}</td>
                  </tr>
                </tbody>
              </v-simple-table>
            </v-card>
          </v-expansion-panel-content>
        </v-expansion-panel>
        <v-expansion-panel>
          <v-expansion-panel-header>Coins</v-expansion-panel-header>
          <v-expansion-panel-content>
            <v-card outlined>
              <v-simple-table dense>
                <thead>
                  <tr>
                    <th>Address</th>
                    <th>Balance</th>
                    <th>Transaction Id</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(utxo, i) in getWallet.utxos" :key="i">
                    <td>{{ utxo.address }}</td>
                    <td>{{ fromDuffsToDash(utxo.satoshis) }}</td>
                    <td>
                      <a
                        :href="
                          'http://insight.evonet.networks.dash.org:3001/insight/tx/' + utxo.txId
                        "
                        target="_bank"
                        >{{ utxo.txId }}</a
                      >
                    </td>
                  </tr>
                </tbody>
              </v-simple-table>
            </v-card>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-container>
    <v-dialog v-model="mnemonicDialog" persistent max-width="600px">
      <v-card>
        <v-card-title>
          <span class="headline">{{ mnemonicDialogTitle }}</span>
        </v-card-title>
        <v-card-text>
          <v-alert dense outlined color="blue">
            <div><strong>Important:</strong> Backup your recovery phrase or loose your coins!</div>
          </v-alert>
          <v-textarea
            ref="mnemonic"
            v-model="mnemonicText"
            :label="mnemonicDialogLabel"
            auto-grow
            outlined
            :loading="mnemonicDialogLoading"
            :readonly="!mnemonicDialogIsRestore"
            rows="3"
            row-height="25"
            :clearable="mnemonicDialogIsRestore"
            clear-icon="mdi-backspace"
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-btn x-large @click="mnemonicDialog = false">Close</v-btn>
          <v-spacer></v-spacer>
          <v-btn v-if="mnemonicDialogIsRestore" x-large color="primary" @click="restoreMnemonic"
            >Restore Wallet</v-btn
          >
          <v-btn
            v-if="!mnemonicDialogIsRestore"
            x-large
            color="primary"
            @click="copyMnemonicToClipboard"
            >Copy Passphrase</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="sendDashDialog" persistent max-width="600px">
      <v-card>
        <v-card-title>
          <span class="headline">Send Dash</span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row>
              <v-col>
                <v-list-item>
                  <v-list-item-content>
                    <v-list-item-title class="headline mb-2">Send To</v-list-item-title>
                    <v-list-item-subtitle>
                      <pre style="font-size: 1.2em;" class="text-wrap"
                        >{{ getWallet.unusedAddress }}
                    </pre
                      >
                    </v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>
                <v-list-item>
                  <v-list-item-content>
                    <v-list-item-title class="headline mb-2">Amount</v-list-item-title>
                    <v-list-item-subtitle>
                      <v-text-field
                        ref="sendtoamount"
                        v-model="sendToAmount"
                        :error="!sendToAmountValid"
                        class="mt-1"
                        outlined
                        required
                        autofocus
                        @keydown.enter.prevent="submitSendDash"
                      ></v-text-field>
                    </v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-btn x-large outlined color="secondary" text @click="sendToAddress = ''">Cancel</v-btn>
          <v-spacer></v-spacer>
          <v-btn x-large :disabled="!sendToAmountValid" color="primary" @click="submitSendDash"
            >Confirm</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import Vue from "vue";
import VueQrcode from "@chenfengyuan/vue-qrcode";
import dashcore from "@dashevo/dashcore-lib";
import { mapGetters, mapActions } from "vuex";

Vue.component(VueQrcode.name, VueQrcode);
const { Address, Unit } = dashcore;

export default {
  data() {
    return {
      addressCopied: false,
      sendToAddress: "",
      sendToAmount: null,
      isRefreshingBalance: false,
      dialog: true,
      mnemonicDialog: false,
      mnemonicDialogIsRestore: false,
      mnemonicDialogTitle: "Create Mnemonic",
      mnemonicDialogLabel: "Generating Wallet ..",
      mnemonicDialogLoading: true,
      mnemonicText: "",
    };
  },
  computed: {
    ...mapGetters(["hasWallet", "getWallet", "identityLists", "isSyncing", "isError"]),
    sendDashDialog() {
      if (this.sendToAddressValid && this.sendToAddress != "") {
        return true;
      } else {
        return false;
      }
    },
    balanceInDash() {
      const { balance } = this.getWallet;
      return Unit.fromSatoshis(balance).toBTC();
    },
    confirmedBalanceInDash() {
      const { confirmedBalance } = this.getWallet;
      return Unit.fromSatoshis(confirmedBalance).toBTC();
    },
    unconfirmedBalanceInDash() {
      const { unconfirmedBalance } = this.getWallet;
      return Unit.fromSatoshis(unconfirmedBalance).toBTC();
    },
    sendToAddressValid() {
      const { sendToAddress } = this;
      return sendToAddress ? Address.isValid(sendToAddress, "testnet") : true;
    },
    sendToAmountValid() {
      const { sendToAmount, getWallet } = this;
      const { balance } = getWallet;
      const satoshis = Unit.fromBTC(sendToAmount).toSatoshis();

      if (satoshis <= balance && satoshis > 0) {
        return true;
      } else {
        return false;
      }
    },
  },
  watch: {
    sendDashDialog() {
      setTimeout(() => this.$refs.sendtoamount.focus(), 150);
      // this.$refs.sendtoamount.focus();
    },
  },
  methods: {
    ...mapActions(["searchDashNames", "sendDash", "setMnemonic", "setSyncing"]),
    refreshWallet() {
      this.isRefreshingBalance = true;
      this.$store.dispatch("refreshWallet");
      setTimeout(() => {
        this.isRefreshingBalance = false;
      }, 1000);
    },
    goToFaucet() {
      window.open("http://faucet.evonet.networks.dash.org/", "_blank");
    },
    async forgetState() {
      this.mnemonicText = "";
      this.$store.commit("resetState");
    },
    copyMnemonicToClipboard() {
      let mnemonic = this.$refs.mnemonic.$el.querySelector("textarea");
      mnemonic.select();
      document.execCommand("copy");
      window.getSelection().removeAllRanges();
    },
    async copyReceivingAddressToClipboard() {
      try {
        const el = document.createElement("textarea");
        el.value = this.getWallet.unusedAddress;
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
        this.addressCopied = true;
        setTimeout(() => {
          this.addressCopied = false;
        }, 1000);
      } catch (e) {
        this.showSnackError(e);
      }
    },
    async showCreateMnemonic(ms) {
      return new Promise((resolve) => {
        this.mnemonicDialogLabel = "Generating wallet ..";
        this.mnemonicDialogLoading = true;
        this.mnemonicDialog = true;
        this.mnemonicDialogTitle = "Create Mnemonic";
        this.mnemonicDialogIsRestore = false;
        setTimeout(resolve, ms);
      });
    },
    async createMnemonic() {
      // Delay needed so viewport doesn't freeze up
      this.$store.commit("setSyncing", true);
      this.showCreateMnemonic(200).then(async () => {
        this.$store.commit("resetState");
        this.$store.commit("setMnemonic", null); // This creates a new mnemonic
        await this.$store.dispatch("initWallet");
        this.mnemonicText = this.getWallet.mnemonic;
        this.mnemonicDialogLabel = "Wallet";
        this.mnemonicDialogLoading = false;
      });
    },
    async backupMnemonic() {
      this.mnemonicDialog = true;
      this.mnemonicDialogTitle = "Backup Mnemonic";
      this.mnemonicDialogLabel = "Wallet";
      this.mnemonicDialogIsRestore = false;
      this.mnemonicDialogLoading = false;
      this.mnemonicText = this.getWallet.mnemonic;
    },
    async showRestoreMnemonic() {
      this.mnemonicDialog = true;
      this.mnemonicDialogTitle = "Restore Mnemonic";
      this.mnemonicDialogLabel = "Enter your 12 word recovery phrase";
      this.mnemonicDialogLoading = false;
      this.mnemonicDialogIsRestore = true;
    },
    async restoreMnemonic() {
      this.mnemonicDialogLoading = true;
      const mnemonic = this.mnemonicText;
      console.log(mnemonic);
      this.$store.commit("resetState");
      this.$store.commit("setMnemonic", mnemonic);
      await this.$store.dispatch("initWallet");
      this.mnemonicText = this.getWallet.mnemonic;
      this.mnemonicDialogLoading = false;
    },
    fromDuffsToDash(duffs) {
      return Unit.fromSatoshis(duffs).toBTC();
    },
    submitSendDash(event) {
      event.stopImmediatePropagation();
      event.preventDefault();

      const { sendToAddress, sendDash } = this;
      const satoshis = Unit.fromBTC(this.sendToAmount).toSatoshis();
      sendDash({ sendToAddress, satoshis }).then(() => (this.sendToAddress = ""));
    },
  },
};
</script>
