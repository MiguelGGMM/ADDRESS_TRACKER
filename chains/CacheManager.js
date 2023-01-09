const ethers = require('ethers');
const { getChainData } = require('./config.js');
const _ = require('lodash');

class CacheManager {
    chain;
    address_explorer;
    tx_explorer;
    rpc_provider;
    //last_block;
    // Wallet -> Listeners objs []
    listeners_wallets;

    initialize (_chain) {
        let chain_obj = getChainData(_chain);
        this.chain = chain_obj.chain;
        this.address_explorer = chain_obj.block_explorer + '/address/';
        this.tx_explorer = chain_obj.block_explorer + '/tx/';
        this.rpc_provider = new ethers.providers.JsonRpcProvider(chain_obj.rpc);
        this.listeners_wallets = {};
        return this;
    }

    GetWalletListeners = async (address) => {
        let users = Object.keys(this.listeners_wallets);
        let answer = [];
        for(const user of users){
            let indexExistingObj = _.findIndex(this.listeners_wallets[user], x => x.address == address);
            if(indexExistingObj > -1){
                answer.push({
                    user: user,
                    label: this.listeners_wallets[user][indexExistingObj].label
                });
            }
        }
        return answer;
    }

    AddWalletListener = async (userId, address, label = '') => {
        this.listeners_wallets[userId] ??= [];
        let indexExistingObj = _.findIndex(this.listeners_wallets[userId], x => x.address == address);

        if(indexExistingObj == -1){
            this.listeners_wallets[userId].push({
                address: address,
                label: label
            });
        }else this.listeners_wallets[userId][indexExistingObj].label = label;
        // //using update
        // _.update(this, `listeners_wallets[${userId}][${indexExistingObj}].label`, (x) => { 
        //     return label; 
        // });
        // //
    }

    RemoveWalletListener = async (userId, address) => {
        if(!this.listeners_wallets[userId]) return;
        RemoveWalletListenerBase(userId, _.findIndex(this.listeners_wallets[userId], x => x.address == address));
    }

    RemoveWalletListenerBase = async (userId, index) => {
        if(index != -1) this.listeners_wallets[userId].splice(index, 1);
        if(this.listeners_wallets[userId].length == 0) delete this.listeners_wallets[userId];
    }
}

module.exports = CacheManager;