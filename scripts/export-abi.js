const fs = require('fs');
const path = require('path');

task("export-abi", "Export the ABI of a contract")
    .addParam("contract", "The name of the contract")
    .setAction(async (taskArgs, hre) => {
        const artifactsPath = hre.config.paths.artifacts;
        const contractName = taskArgs.contract;
        const contractArtifactPath = path.join(artifactsPath, `contracts/${contractName}.sol/${contractName}.json`);

        if (!fs.existsSync(contractArtifactPath)) {
            throw new Error(`Contract artifact not found for ${contractName}, in the path ${contractArtifactPath}`);
        }

        const contractArtifact = JSON.parse(fs.readFileSync(contractArtifactPath));
        const abi = JSON.stringify(contractArtifact.abi, null, 2);
        const abiPath = path.join(__dirname, 'abi', contractName + '.abi');

        if (!fs.existsSync(path.join(__dirname, 'abi'))) {
            fs.mkdirSync(path.join(__dirname, 'abi'));
        }

        fs.writeFileSync(abiPath, abi);
    });
