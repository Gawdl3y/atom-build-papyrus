'use babel';
'use strict';

export default {
	defaultGame: {
		title: 'Default game',
		description: 'The default game to use the compiler of for project files',
		type: 'string',
		default: 'fallout4',
		enum: [
			{ value: 'fallout4', label: 'Fallout 4' }
		]
	},
	fallout4CompilerPath: {
		title: 'Fallout 4 compiler path',
		description: 'Full path to Fallout 4\'s `PapyrusCompiler.exe`',
		type: 'string',
		default: 'C:\\Program Files (x86)\\Steam\\SteamApps\\common\\Fallout 4\\Papyrus Compiler\\PapyrusCompiler.exe'
	},
	skyrimCompilerPath: {
		title: 'Skyrim compiler path',
		description: 'Full path to Skyrim\'s `PapyrusCompiler.exe`',
		type: 'string',
		default: 'C:\\Program Files (x86)\\Steam\\SteamApps\\common\\Skyrim\\Papyrus Compiler\\PapyrusCompiler.exe'
	}
};