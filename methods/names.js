const blacklist_methods = [
    "approve",
    "swapExactETHForTokensSupportingFeeOnTransferTokens",
    "swapExactTokensForETHSupportingFeeOnTransferTokens",
    "swapExactTokensForTokens"
]
const ignored_methods = [
    "sign_szabo_bytecode",
    "many_msg_babbage"
]

module.exports = {
    blacklist_methods,
    ignored_methods
}