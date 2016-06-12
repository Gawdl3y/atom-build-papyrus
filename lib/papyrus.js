'use babel';
'use strict';

import fs from 'fs';
import path from 'path';
import EventEmitter from 'events';
import { CompositeDisposable } from 'atom';
import { $ } from 'atom-space-pen-views';
import settings from './settings';
import PapyrusBuildProvider from './build-provider';
import ConfigView from './config-view';

let disposables = null;

// Get the directory path and file path from an event (lifted straight from remote-sync)
function getEventPath(e) {
	let target = $(e.target).closest('.file, .directory, .tab')[0];
	if(target !== null) target = atom.workspace.getActiveTextEditor();
	const fullPath = target ? (target.getPath ? target.getPath() : null) : null;
	if(!fullPath) return [];
	const [projectPath] = atom.project.relativizePath(fullPath);
	return [projectPath, fullPath];
}

// Show the configuration panel
function configure(e) {
	// Get the project path
	let [projectPath] = getEventPath(e);
	if(!projectPath) return;
	projectPath = fs.realpathSync(projectPath);

	// Find the current config file, if it exists
	let configFile = null;
	const files = fs.readdirSync(projectPath);
	for(const fileName of files) {
		const filePath = path.join(projectPath, fileName);
		if(fs.statSync(filePath).isFile()) {
			const baseName = path.basename(fileName);
			if(!this.configFile && (baseName === '.build-papyrus.json' || baseName === '.build-papyrus.cson' || baseName === '.build-papyrus.yml')) {
				configFile = filePath;
			}
		}
	}

	// Create the panel
	const emitter = new EventEmitter();
	emitter.on('configured', () => {
		console.log('whoa dude');
	});
	const view = new ConfigView(projectPath, configFile, emitter);
	view.attach();
}

// Atom package stuff
export default {
	config: settings,

	provideBuilder() {
		return PapyrusBuildProvider;
	},

	activate() {
		if(!disposables) disposables = new CompositeDisposable();
		disposables.add(atom.commands.add('atom-workspace', { 'build-papyrus:configure': configure }));
	},

	deactivate() {
		disposables.dispose();
		disposables = null;
	}
};
