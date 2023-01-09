const chalk = require('chalk');
const CacheManager = require('./CacheManager');
//const { CommonCache } = require('../utils/common.js').default;
const MethodsService = require('../services/MethodsService.js');
const TelegramService = require('../services/TelegramService.js');
const AsyncLock = require('async-lock');

class ChainManager {
    cacheManager = new CacheManager();
    // Blocking
    listeners_wallets_lock;
    key_lock;
    static key_lock_common;
    static commonCache_lock;
    static bot;

    static staticInitialize() {
        if(!ChainManager.key_lock_common){
            ChainManager.key_lock_common = '1';
            ChainManager.commonCache_lock = new AsyncLock({maxPending: 1000});
        }
    }

    static staticInitializeBot(botToken, telegramCommands){
        if(!ChainManager.bot){
            ChainManager.bot = TelegramService.initialize(botToken);
            ChainManager.bot.setMyCommands(telegramCommands);
            for(const tgCommand of telegramCommands){
                ChainManager.bot.onText(tgCommand.commandRegex, tgCommand._function);
            }            
        }
    }

    initialize(_chain) {
        this.cacheManager = new CacheManager().initialize(_chain);
        this.key_lock = _chain;
        this.listeners_wallets_lock = new AsyncLock({maxPending: 1000});
        return this;
    }

    AddWalletListener = async (userId, address, label = '') => {
        this.listeners_wallets_lock.acquire(this.key_lock, (async () => this.cacheManager.AddWalletListener(userId, address, label)));
    }

    RemoveWalletListener = async (userId, address) => {
        this.listeners_wallets_lock.acquire(this.key_lock, (async () => this.cacheManager.RemoveWalletListener(userId, address)));
    }

    GetWalletsListened = async (userId) => {
        return this.cacheManager.GetWalletsListened(userId);
    }

    ListenTransactions = () => {
        this.cacheManager.rpc_provider.on("block", this.GetBlockTransactions);
    }

    GetBlockTransactions = async (blockNumber) => {
        let users = Object.keys(this.cacheManager.listeners_wallets);
        if(users.length > 0){
            let result = await this.cacheManager.rpc_provider.getBlockWithTransactions(blockNumber);            
            if(result && result.transactions) {
                result.transactions.forEach(async (transaction) => await this.NotifyTransaction(transaction));
            }
        }
    }

    NotifyTransaction = async (transaction) => {
        try{                                    
            let wallet_listeners_in = await this.cacheManager.GetWalletListeners(transaction.to),
                wallet_listeners_out = await this.cacheManager.GetWalletListeners(transaction.from);
            
            if(wallet_listeners_in.length > 0 || wallet_listeners_out.length > 0){
                let method_name = 'unknown',
                    request_parameters = [],                    
                    value = '',
                    data = transaction.data.replace('0x', '');
                
                // Get methods name and decoded parameters
                if(data != ''){
                    let answer = await MethodsService.getMethodName(transaction.data);
                    // Blacklisted/ignored?
                    if(answer && answer.blacklist) return;
                    if(answer){
                        request_parameters = answer.request_parameters;
                        method_name = answer.method_name;
                    }
                }

                // Track recipients, we skip low transfers (< 200$)
                let track_recipient = false;
                if(data == ''){
                    method_name = 'transfer';
                    value = transaction.value.div(Math.pow(10, 18));
                    if(min_value_main_coin[chain] > parseInt(value)){
                        return;
                    }
                    else{
                        track_recipient = true;                                        
                    }
                }

                // Contract creation?
                if(data.length > 1500 && method_name == 'unknown'){
                    method_name = 'creationContract??'
                }

                // Notify incoming transaction
                if(wallet_listeners_in != undefined){
                    wallet_listeners_in.forEach(async (wallet_listener) => {
                        await this.SendMessageTx('IN', method_name, transaction.to, transaction.hash, request_parameters, wallet_listener);
                    });                    
                }

                // Notify outcoming transaction
                if(wallet_listeners_out != undefined){
                    wallet_listeners_out.forEach(async (wallet_listener) => {
                        await this.SendMessageTx('OUT', method_name, transaction.from, transaction.hash, request_parameters, wallet_listener);
                        if(track_recipient){
                            await this.AddWalletListener(wallet_listener.user, ethers.utils.getAddress(transaction.to), 'Recip_' + wallet_listener.label);
                        }
                    });                    
                }
            }
        }
        catch(err){
            this.logError(`NotifyTransaction (${this.cacheManager.chain}) Error: ${err.toString()}`);
        }
    }

    SendMessageTx = async(inout, method_name, toOrFrom, hash, request_parameters, wallet_listener) => {

        // Bot initialized?
        if(!ChainManager.bot) return;
        let message = this.notificationText(inout, method_name, toOrFrom, hash, request_parameters, wallet_listener.label);

        await ChainManager.bot.sendMessage(wallet_listener.user, message);
    }

    notificationText = (inout, method_name, toOrfrom, hash, request_parameters, label)=> {

        var msg_text = '';
        if(label) msg_text += `${label}`.break(1);
        msg_text += `${this.cacheManager.chain.toUpperCase()} ${inout} ${method_name}`.break(2);
        msg_text += `Dev address: [${toOrfrom.substring(0, 5)}](${this.cacheManager.address_explorer}${toOrfrom})`.break(1);
        msg_text += `Tx hash: [${hash.substring(0, 5)}](${this.cacheManager.tx_explorer}${hash})`;
        if(request_parameters.length > 0){
            msg_text = msg_text.break(2);
            msg_text += `Transaction parameters:`.break(1) + `${request_parameters.join('\n')}`;
        }
    
        return msg_text;
    }

    logError(...data) {
        console.log(chalk.red(...data));
    }
}

module.exports = ChainManager;