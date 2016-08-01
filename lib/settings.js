'use babel';
'use strict';

export default {
	defaultGame: {
		title: 'Default game',
		description: 'The default game to use the compiler of for project files',
		order: 1,
		type: 'string',
		default: 'fallout4',
		enum: [
			{ value: 'fallout4', label: 'Fallout 4', description: 'Fallout 4' }
		]
	},
	skyrimCompilerPath: {
		title: 'Skyrim compiler path',
		description: 'Full path to Skyrim\'s `PapyrusCompiler.exe`',
		order: 2,
		type: 'string',
		default: 'C:\\Program Files (x86)\\Steam\\SteamApps\\common\\Skyrim\\Papyrus Compiler\\PapyrusCompiler.exe'
	},
	fallout4CompilerPath: {
		title: 'Fallout 4 compiler path',
		description: 'Full path to Fallout 4\'s `PapyrusCompiler.exe`',
		order: 3,
		type: 'string',
		default: 'C:\\Program Files (x86)\\Steam\\SteamApps\\common\\Fallout 4\\Papyrus Compiler\\PapyrusCompiler.exe'
	}
};
