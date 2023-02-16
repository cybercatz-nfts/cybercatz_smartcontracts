const fs = require('fs');
const path = require('path');

task("export-abi-bytecode", "Export the ABI and bytecode of a contract")
    .addParam("contract", "The name of the contract")
    .setAction(async (taskArgs, hre) => {
        const artifactsPath = path.join(hre.config.paths.root, 'artifacts');
        const contractName = taskArgs.contract;
        const contractArtifactPath = path.join(artifactsPath, 'contracts', `${contractName}.sol`, `${contractName}.json`);

        if (!fs.existsSync(contractArtifactPath)) {
            throw new Error(`Contract artifact not found for ${contractName}`);
        }

        const contractArtifact = JSON.parse(fs.readFileSync(contractArtifactPath));
        const abi = JSON.stringify(contractArtifact.abi, null, 2);
        const abiPath = path.join(hre.config.paths.root + '/exports', 'abi', `${contractName}.json`);
        const bytecode = contractArtifact.bytecode;
        const bytecodePath = path.join(hre.config.paths.root + '/exports', 'bycode', `${contractName}.ts`);

        if (!fs.existsSync(path.dirname(abiPath))) {
            fs.mkdirSync(path.dirname(abiPath), { recursive: true });
        }

        if (!fs.existsSync(path.dirname(bytecodePath))) {
            fs.mkdirSync(path.dirname(bytecodePath), { recursive: true });
        }

        fs.writeFileSync(abiPath, abi);
        fs.writeFileSync(bytecodePath, `export const bytecode = "${bytecode}";`);
    });
