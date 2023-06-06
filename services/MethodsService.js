const AbiCoder = require('ethers').utils.AbiCoder;
const getAddress = require('ethers').utils.getAddress;
const _4bytesBaseURL = 'https://www.4byte.directory/api/v1/signatures/';
const { blacklist_methods, ignored_methods } = require('../methods/names.js');
const axios = require('axios');
const ADDRESS_PREFIX = "0x";

class MethodsService {

    static validData = (data) => data && data["results"] && data["results"].length > 0;
    static invalidParameters = (parameters_types) => parameters_types == undefined || (parameters_types.length == 1 && parameters_types[0] == '');
    static getParametersTypesFromTextSignature = (text_signature) => text_signature.split('(')[1].split(')')[0].split(',');

    static async getMethodName(transactionData) {
        let answer,
            data_sighash = transactionData.replace('0x', '').substring(0, 8);
        // https://www.4byte.directory/docs/
        await axios.get(`${_4bytesBaseURL}?format=json&hex_signature=${data_sighash}`, 
            { 
                timeout:5000 
            }).then(async (response) => {
                answer = await MethodsService.process4bytesResponse(response, transactionData); 
            });
        return answer;
    }

    static async process4bytesResponse(response, transactionData){
        let answer = {
            method_name: 'unknown',
            request_parameters: [],
            blacklist: false
        },
        data = response["data"];

        if(MethodsService.validData(data)) {                                            
            // Array if there is several options? //TODO
            for(var index in data["results"]){
                let result = await MethodsService.process4bytesResult(data["results"][index], transactionData);
                if(result){
                    answer.method_name = result.method_name;
                    answer.request_parameters = result.request_parameters;
                    answer.blacklist = result.blacklist;
                    break;
                }
            }
        }

        return answer;
    }

    static async process4bytesResult(result, transactionData){
        let text_signature = result['text_signature'];
        let method_name = text_signature.split('(')[0],
            data_sighash = transactionData.replace('0x', '').substring(0, 8),
            request_parameters = [],
            blacklist = false;

        // Ignore if blacklist or ignored methods
        if(blacklist_methods.concat(ignored_methods).indexOf(method_name) > -1){
            method_name = 'unknown';
            blacklist = true;
        }
        else{
            // Decode the request
            let parameters_types = MethodsService.getParametersTypesFromTextSignature(text_signature);
            if(MethodsService.invalidParameters(parameters_types)){
                parameters_types = [];
            }
            try
            {
                let output = transactionData.replace(data_sighash, '00000000');
                request_parameters = await MethodsService.decodeParams(parameters_types, output, true);  
            }
            catch { }
        }

        return {
            method_name: method_name,
            request_parameters: request_parameters,
            blacklist: blacklist
        }
    }

    static async decodeParams(types, output, ignoreMethodHash) {

        if (!output || typeof output === 'boolean') {
            ignoreMethodHash = output;
            output = types;
        }
    
        if (ignoreMethodHash && output.replace(/^0x/, '').length % 64 === 8)
            output = '0x' + output.replace(/^0x/, '').substring(8);
    
        const abiCoder = new AbiCoder();
    
        if (output.replace(/^0x/, '').length % 64)
            throw new Error('The encoded string is not valid. Its length must be a multiple of 64.');

        return abiCoder.decode(types, output).reduce((obj, arg, index) => {
            if (types[index] == 'address')
                arg = ADDRESS_PREFIX + arg.substr(2).toLowerCase();
            obj.push(types[index] + ': ' + arg);
            return obj;
        }, []);
    }

    static getAddressFormatted(_address) {
        return getAddress(_address);
    }
}

module.exports = MethodsService
