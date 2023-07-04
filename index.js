const appRoot = require('app-root-path');
const DockerBackupController = require(`${appRoot}/src/controller/dockerBackup`);

const Messenger = require(`${appRoot}/src/utils/messenger`);

function getArgvValue($argv) {
    let _index = process.argv.indexOf($argv);
    return (_index === -1) ? null : process.argv[_index + 1];
}

function checkArgv() {
    let _volume_path = getArgvValue('VOLUME_PATH'),
        _curDate = getArgvValue('CURDATE');

    if (!_volume_path || !_curDate) {
        throw (`Missing required argument:`);
    }

    process.env.VOLUME_PATH = _volume_path;
    process.env.CURDATE = _curDate;
}


async function main() {
    Messenger.openClose('MAIN');

    try {
        checkArgv();
        // console.log('DEBUG process.env', process.env);

        let _dockerBackupController = new DockerBackupController();
        await _dockerBackupController.init();
        await _dockerBackupController.startBackup();

    } catch ($err) {
        throw new Error($err);
    }
}

main();