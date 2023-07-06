const appRoot = require('app-root-path');
const VolumesBackupController = require(`${appRoot}/src/controller/volumesBackup`);


const Messenger = require(`${appRoot}/src/utils/messenger`);

function getArgvValue($argv) {
    let _index = process.argv.indexOf($argv);
    return (_index === -1) ? null : process.argv[_index + 1];
}

function checkArgv() {
    let _volume_path = getArgvValue('VOLUME_PATH'),
        _curDate = getArgvValue('CURDATE'),
        _blackList = getArgvValue('BLACKLIST');

    if (!_volume_path || !_curDate) {
        throw (`Missing required argument:`);
    }

    process.env.VOLUME_PATH = _volume_path;
    process.env.CURDATE = _curDate;
    process.env.BLACKLIST = _blackList;
}


async function main() {
    Messenger.openClose('MAIN');

    try {
        checkArgv();
        // console.log('DEBUG process.env', process.env);

        let _volumesBackupController = new VolumesBackupController();
        await _volumesBackupController.init();
        await _volumesBackupController.startBackup();

    } catch ($err) {
        throw new Error($err);
    }
}

main();