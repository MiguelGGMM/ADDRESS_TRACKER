// starts a new Telegram bot instance that "polls" for updates
process.env.NTBA_FIX_319 = 1; 
const chalk = require('chalk');
const Config = require('./config');
const tokenBot = Config.TELEGRAM_BOT_KEY;
const ADDRESS_PREFIX = "41";

console.clear()

const { supported_chains, chain_rpc, chain_block_explorer, min_value_main_coin, chain_chain_id } = require('./chains/config.js');
const { getTelegramCommands, supported_commands, getCommandHelpText, error_user_command } = require('./commands/commands.js');

require('./utils/common.js').CommonCache.initialize();

var chainManagers = {};
const ChainManager = require('./chains/ChainManager');
const MethodsService = require('./services/MethodsService');
ChainManager.staticInitialize();

supported_chains.forEach((_chain) => chainManagers[_chain] = new ChainManager().initialize(_chain));

const sleep = ms => new Promise(r => setTimeout(r, ms));

const initialize = async () => {

    log('Initializing...');	
    if(!(await initialize_dev_tracker())){ return; }	
}

initialize_dev_tracker = async() => {

    // Set commands and receivers
    let telegramCommands = getTelegramCommands();
    for(let telegramCommand of telegramCommands){
        if(telegramCommand.command == '/t') telegramCommand._function = onMsgTrackWallet;
        if(telegramCommand.command == '/r') telegramCommand._function = onMsgUnTrackWallet;
        if(telegramCommand.command == '/help') telegramCommand._function = onMsgHelp;
        if(telegramCommand.command == '/decode') telegramCommand._function = onMsgDecodeTx;
        if(telegramCommand.command == '/show') telegramCommand._function = onMsgShowTracks;
    }
    ChainManager.staticInitializeBot(tokenBot, telegramCommands);

    // Launch chain listeners
    supported_chains.forEach(_chain => {  
        chainManagers[_chain].ListenTransactions();
    });

    return true;
}

const onMsgTrackWallet = async (msg, match) => {
    let [ , chain, address, label ] = match.input.split(' ');
    await chainManagers[chain].AddWalletListener(msg.chat.id, address, label);
    ChainManager.bot.sendMessage(
        msg.chat.id, 
        `Listening transactions from ${address} on ${chain} network` + (label ? ` with label '${label}'` : ``), 
        { 
            reply_to_message_id: msg.message_id 
        });
}

const onMsgUnTrackWallet = async (msg, match) => {
    console.log(JSON.stringify(input));
}

const onMsgHelp = async (msg) => {
    ChainManager.bot.sendMessage(msg.chat.id, getCommandHelpText(), { reply_to_message_id: msg.message_id });
}

const onMsgShowTracks = async (msg) => {

}

const onMsgDecodeTx = async (msg, match) => {
    let [ , transactionData ] = match.input.split(' ');
    let methodObj = MethodsService.getMethodName(transactionData);

    if(methodObj){
        let message = `Method name: ${ methodObj.method_name } `.break(1);
        message += `Parameters:`.break(1);
        methodObj.request_parameters.forEach(param => {
            message += param.break(1);
        });
        ChainManager.bot.sendMessage(msg.chat.id, message, { reply_to_message_id: msg.message_id });     
    }else{
        ChainManager.bot.sendMessage(msg.chat.id, 'Can not be decoded/error', { reply_to_message_id: msg.message_id });
    }
}

function log(...data) {
    for(var idx in data) {
        if(typeof data[idx] === 'object' || Array.isArray(data[idx])) {
            console.log(chalk.green(JSON.stringify(data[idx])));
        } else {
            console.log(chalk.green(data[idx]));
        }
    }
}

function logError(...data) {
    console.log(chalk.red(...data));
}

function local_time(){
    return new Date().toLocaleTimeString('es-ES');
}

(async() => {
    initialize();
})();