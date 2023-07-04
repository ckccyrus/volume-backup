const fs = require('fs');
const appRoot = require('app-root-path');

const Messenger = require(`${appRoot}/src/utils/messenger`);
const Workspace = require(`${appRoot}/src/components/workspace`);

class DockerBackupController {

    constructor() { }

    async init() {
        let _self = this;
        await _self.initWorkspace();
    }

    initWorkspace = async () => {
        Messenger.openClose('CONTROLLER:INIT WORKSPACE');
        let _self = this;
        _self._workspace = new Workspace();
        await _self._workspace.init();
        Messenger.openClose('CONTROLLER:/INIT WORKSPACE');
    }

    async startBackup() {
        Messenger.openClose('CONTROLLER:START BACKUP');
        let _self = this;
        await _self._workspace.zipAll();
        Messenger.openClose('CONTROLLER:/START BACKUP');
    }
}

module.exports = DockerBackupController;