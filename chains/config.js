const supported_chains = ["eth", "bsc", "matic", "cronos", "avax", "metis", "milkomeda"]

const chain_chain_id = {
    "eth":1,
    "bsc":56,
    "matic":137,
    "cronos":25,
    "avax":43114,
    "metis":1088,
    "milkomeda":2001
}

const chain_rpc = {
    "eth":"https://mainnet.infura.io/v3",
    "bsc":"https://bsc-dataseed.binance.org",
    "matic":"https://polygon-rpc.com",
    "cronos":"https://evm.cronos.org",
    "avax":"https://api.avax.network/ext/bc/C/rpc",
    "metis":"https://andromeda.metis.io/?owner=1088",
    "milkomeda":"https://rpc-mainnet-cardano-evm.c1.milkomeda.com"
}

const chain_block_explorer = {
    "eth":"https://etherscan.io",
    "bsc":"https://bscscan.com",
    "matic":"https://polygonscan.com",
    "cronos":"https://cronoscan.com",
    "avax":"https://snowtrace.io",
    "metis":"https://andromeda-explorer.metis.io",
    "milkomeda":"https://explorer-mainnet-cardano-evm.c1.milkomeda.com"
}

const min_value_main_coin = {
    "eth": 0.05,
    "bsc": 0.5,
    "matic": 120,
    "cronos": 400,
    "avax": 2.5,
    "metis": 1.5,
    "milkomeda": 200
}

const getChainData = (_chain) => {
    return {
        chain: _chain,
        id: chain_chain_id[_chain],
        rpc: chain_rpc[_chain],
        block_explorer: chain_block_explorer[_chain],
        min_value_main_coin: min_value_main_coin[_chain]
    }
}

const getChainsData = () => {
    return supported_chains.map((_chain) => {
        return getChainData(_chain);
    });
}

module.exports = {
    getChainData,
    getChainsData,
    supported_chains,
    chain_chain_id,
    chain_rpc,
    chain_block_explorer,
    min_value_main_coin
}