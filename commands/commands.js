
// Commands
const getTelegramCommands = () => {
    return [        
        { command: '/t', commandRegex: /\/t(.*?)/, _function: undefined, description: 'Track wallet, /t blockchain wallet label(optional)'},
        { command: '/r', commandRegex: /\/r(.*?)/, _function: undefined, description: 'Untrack wallet, /r blockchain wallet' },
        { command: '/show', commandRefex: /\/show/, _function: undefined, description: 'Show current tracked wallets' },
        { command: '/help', commandRegex: /\/help/, _function: undefined, description: 'How to use this bot' },
        { command: '/decode', commandRegex: /\/decode(.*?)/, _function: undefined, description: 'Decode a transaction, /decode transactionData'}
    ];
}
const supported_commands = getTelegramCommands().map(el => el.command); //["/t", "/r", "/help", "/decode"];

// Help command text
const getCommandHelpText = () => {
    let command_help_text = `You can use this bot to track wallet transactions on different chains`.break(2);
    command_help_text += `You can use the commands /t (track), /r (untrack), /help, /decode`.break(1);
    command_help_text += `Descriptions:`.break(1);
    getTelegramCommands().forEach(el => {
        command_help_text += `${el.command}: ${el.description}`.break(1);
    });
    command_help_text = command_help_text.break(2);
    command_help_text += `blockchains supported: eth, bsc, cronos, matic, avax, metis, milkomeda`;
    return command_help_text;
}

// Error format text
const error_user_command = `Error on command format, check /help`;

module.exports = {
    getTelegramCommands,
    supported_commands,
    getCommandHelpText,
    error_user_command
}