const fs = require('fs');
const path = require('path');
const appRoot = require('app-root-path');
const archiver = require('archiver');

const CONFIG = require(`${appRoot}/src/config/config`);
const Messenger = require(`${appRoot}/src/utils/messenger`);

class Workspace {
    _allDockerFolder;

    constructor() {
        let _self = this;
        if (!process.env.VOLUME_PATH) throw new Error('process.env.VOLUME_PATH is undefined!');
        if (!process.env.CURDATE) throw new Error('process.env.CURDATE is undefined!');
    }
    
    //---------------------------------------------------------------
    //------------------------------Init---------------------------------

    async init() {
        let _self = this;
        await _self.setupWorkspace();
        await _self.scanVolumePath();
        await _self.createDistFolder();
    }

    setupWorkspace = async () => {
        Messenger.openClose('WORKSPACE:SETUP WORK SPACE');
        let _self = this,
            _workspaceLoc = CONFIG.DIRECTORY.WORKSPACE,
            _isWorkspaceExist = fs.existsSync(_workspaceLoc);

        if (_isWorkspaceExist) {
            await clearWorkspace();
        }
        await fs.promises.mkdir(_workspaceLoc);

        Messenger.openClose('/WORKSPACE:SETUP WORK SPACE');

        async function clearWorkspace() {
            let _workspaceFolderStat = await fs.promises.lstat(_workspaceLoc),
                _isDirectory = _workspaceFolderStat.isDirectory();
            if (_isDirectory) {
                try {
                    await fs.promises.rm(_workspaceLoc, { recursive: true });
                } catch ($err) {
                    Messenger.error('[CLEAR_WORKSPACE_FAIL]');
                }
            }
        }
    }

    scanVolumePath = async () => {
        Messenger.openClose('WORKSPACE:SCAN DOCKER VOLUME');
        let _self = this,
            _isVolumePathExist = fs.existsSync(process.env.VOLUME_PATH);

        if (_isVolumePathExist) {
            _self._allDockerFolder = await getAllDockerVolumes();
        } else {
            throw new Error(`${process.env.VOLUME_PATH} is not exist`);
        }

        async function getAllDockerVolumes() {
            try {
                //ignore hidden files
                return await fs.promises.readdir(process.env.VOLUME_PATH).then(list => list.filter(item => !/(^|\/)\.[^/.]/g.test(item)));
            } catch (err) {
                Messenger.openClose('WORKSPACE:[SCAN_DOCKER_VOLUME_FAIL]');
                throw new Error('Error occurred while reading directory:', err)
            }
        }
        Messenger.openClose('/WORKSPACE:SCAN DOCKER VOLUME');
    }

    createDistFolder = async () => {
        Messenger.openClose('WORKSPACE:CREATE DIST FOLDER');
        let _self = this,
            _workspaceLoc = CONFIG.DIRECTORY.WORKSPACE,
            _distFolderLoc = path.join(CONFIG.DIRECTORY.DIST, process.env.CURDATE),
            _isWorkspaceExist = fs.existsSync(_workspaceLoc);

        if (_isWorkspaceExist) {
            await fs.promises.mkdir(_distFolderLoc);

            // for (let i = 0; i < _self._allDockerFolder.length; i++){
            //     let _distPath = path.join(CONFIG.DIRECTORY.DIST, process.env.CURDATE, _self._allDockerFolder[i]);
            //     await fs.promises.mkdir(_distPath);
            // }
        } else {
            throw new Error('WORKSPACE:[CREATE_DIST_FOLDER_FAIL]');
        }

        Messenger.openClose('/WORKSPACE:CREATE DIST FOLDER');
    }

    //---------------------------------------------------------------
    //------------------------------Start backup---------------------------------

    async zipAll(){
        Messenger.openClose('WORKSPACE:ZIP ALL Docker Volumes');
        let _self = this;
        for (let i = 0; i < _self._allDockerFolder.length; i++){
            let _eachDocker = _self._allDockerFolder[i],
                _eachDockerDestPath = path.join(CONFIG.DIRECTORY.DIST, process.env.CURDATE, _eachDocker),
                _eachDockerSrcPath = path.join(process.env.VOLUME_PATH, _eachDocker);
            
            await _self.createZip(_eachDockerSrcPath, _eachDockerDestPath, _eachDocker);
        }

        Messenger.openClose('/WORKSPACE:ZIP ALL Docker Volumes');
    }

    createZip = async ($srcDir, $destDir, $folder) => {
        let _self = this;

        let myPromise = new Promise(async (resolve, reject) => {
            Messenger.print(`CREATING ZIP ... (${$srcDir})`);
            let _totalSize = await _self.getFolderTotalSize($srcDir);
            let _compressedSize = 0
            let _progressTrackerInterval;
            Messenger.print(`TOTAL SIZE: ${_totalSize}`);

            let _ws = fs.createWriteStream($destDir + '.zip');
            let _archive = archiver('zip');

            _ws.on('close', function () {
                Messenger.print[`FINISHED ZIP: (${$srcDir})`];
                Messenger.print[`DESTINATION OF ZIP: (${$folder + '.zip'})`];
                clearInterval(_progressTrackerInterval);
                resolve();
            });

            _archive.pipe(_ws);
            _archive.directory($srcDir, false);
            _archive.finalize();

            _progressTrackerInterval = setInterval(progressTracker, 1000);

            function progressTracker() {
                let _processed = _archive.pointer();
                Messenger.print(`ZIP PROGRESS (${$srcDir}): ${(_processed / _totalSize * 100)}%`, true);
            }
        });
        return myPromise;
    }

    getFolderTotalSize = async($folderDir) => {
        const _self = this,
              _arrayOfFiles = await _self.getAllFiles($folderDir);
        let _totalSize = 0;
        for(let i = 0; i < _arrayOfFiles.length; i++){
            const _filePath = _arrayOfFiles[i];
            const _fileStat = await fs.promises.stat(_filePath);
            _totalSize += _fileStat.size;
        }
        return _totalSize;
    }

    getAllFiles = async($dirPath, $arrayOfFiles) => {
        const _self = this;
        let _files = await fs.promises.readdir($dirPath);
        $arrayOfFiles = $arrayOfFiles || [];
        for(let i = 0; i < _files.length; i++){
            const _subPath = path.join($dirPath, _files[i]);
            const _subPathStat = await fs.promises.lstat(_subPath);
            const _subPathIsDir = _subPathStat.isDirectory();
            if(_subPathIsDir){
                $arrayOfFiles = await _self.getAllFiles(_subPath, $arrayOfFiles);
            }else{
                $arrayOfFiles.push(_subPath);
            }
        }
        return $arrayOfFiles;
    }
}

module.exports = Workspace;
