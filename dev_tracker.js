// starts a new Telegram bot instance that "polls" for updates
process.env.NTBA_FIX_319 = 1; 
const chalk = require('chalk');
const Config = require('./config');
const tokenBot = Config.TELEGRAM_BOT_KEY;
const ADDRESS_PREFIX = "41";

console.clear()

const { supported_chains } = require('./chains/config.js');
const { getTelegramCommands, getCommandHelpText } = require('./commands/commands.js');

require('./utils/common.js').CommonCache.initialize();

var chainManagers = {};
const ChainManager = require('./chains/ChainManager');
const MethodsService = require('./services/MethodsService');
ChainManager.staticInitialize();

supported_chains.forEach((_chain) => chainManagers[_chain] = new ChainManager().initialize(_chain));

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

//#region Commands receivers
const onMsgTrackWallet = async (msg, match) => {
    let [ , chain, address, label ] = match.input.split(' ');
    let message = `Unknown error`;
    if(supported_chains.includes(chain)){
        address = getAddressFromText(address);
        if(address){
            await chainManagers[chain].AddWalletListener(msg.chat.id, address, label);
            message = `Listening transactions from ${address} on ${chain} network` + (label ? ` with label '${label}'` : ``);
        }
        else{
            message = `Invalid address: ${address}`;
        }
    }else{
        message = `Unrecognized chain: ${chain}`;
    }
    ChainManager.bot.sendMessage(msg.chat.id, message, { reply_to_message_id: msg.message_id });
}

const onMsgUnTrackWallet = async (msg, match) => {
    let [ , chain, address ] = match.input.split(' ');
    let message = `Unknown error`;
    if(supported_chains.includes(chain)){
        address = getAddressFromText(address);
        if(address){
            await chainManagers[chain].RemoveWalletListener(msg.chat.id, address);
            message = `Stopped listening transactions from ${address} on ${chain} network`;
        }else{
            message = `Invalid address: ${address}`;
        }
    }else{
        message = `Unrecognized chain: ${chain}`;
    }
    ChainManager.bot.sendMessage(msg.chat.id, message, { reply_to_message_id: msg.message_id });
}

const onMsgShowTracks = async (msg) => {
    let message = '';
    for(const chain of supported_chains){
        let walletsListened = await chainManagers[chain].GetWalletsListened(msg.chat.id);
        if(walletsListened){
            message += `On ${chain} chain:`.break(1);
            for(const walletListened of walletsListened){
                message += (`Address: ${walletListened.address}` + (walletListened.label ? ` with label ${walletListened.label}` : ``)).break(1);
            }
            message = message.break(1);
        }
    }
    if(message){
        ChainManager.bot.sendMessage(msg.chat.id, message, { reply_to_message_id: msg.message_id });    
    }else{
        ChainManager.bot.sendMessage(msg.chat.id, `No tracks registered`, { reply_to_message_id: msg.message_id });    
    }
}

const onMsgDecodeTx = async (msg, match) => {
    let [ , transactionData ] = match.input.split(' ');
    let methodObj;
    let error = false;

    try{
        methodObj = await MethodsService.getMethodName(transactionData);
    }catch{ error = true; }

    if(methodObj){
        let message = `Method name: ${ methodObj.method_name } `.break(1);
        message += `Parameters:`.break(1);
        methodObj.request_parameters.forEach(param => {
            message += param.break(1);
        });
        ChainManager.bot.sendMessage(msg.chat.id, message, { reply_to_message_id: msg.message_id });     
    }else{
        if(!error){
            ChainManager.bot.sendMessage(msg.chat.id, 'Can not be decoded', { reply_to_message_id: msg.message_id });
        }else{
            ChainManager.bot.sendMessage(msg.chat.id, 'Error', { reply_to_message_id: msg.message_id });
        }
    }
}

const onMsgHelp = async (msg) => {
    ChainManager.bot.sendMessage(msg.chat.id, getCommandHelpText(), { reply_to_message_id: msg.message_id });
}
//#endregion

const getAddressFromText = (text) => {
    const regex = /0x[0-9a-fA-F]{40}/g;
    const matches = text.match(regex);
    if (matches && matches.length) {
        return matches[0];
    }
    return null;
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

(async() => {
    initialize();
})();