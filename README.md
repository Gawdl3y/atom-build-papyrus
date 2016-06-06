# build-papyrus package for Atom

A build provider for the Atom [build](https://atom.io/packages/build) package that handles Papyrus projects for Fallout 4.  
For Papyrus syntax highlighting, use the [language-papyrus](https://atom.io/packages/language-papyrus) package.

## Usage
If your Fallout 4 Papyrus compiler is not in the default location (`C:\\Program Files (x86)\\Steam\\SteamApps\\common\\Fallout 4\\Papyrus Compiler\\PapyrusCompiler.exe`), then the compiler path setting must be configured to you appropriate path.

Only Papyrus project file (`.ppj`) builds are supported currently.
Make sure the directory you have open in Atom contains your project file in its root.
If you add, remove, or rename a project file, make sure you run `build:refresh-targets` in the command palette.

## Information
Papyrus is a scripting language for the Creation Engine, the game engine that *The Elder Scrolls V: Skyrim* and *Fallout 4* run on.
Mods for them use this language to make things happen in the game.
Want to learn more about it?
Check out the Papyrus reference for [Skyrim](http://www.creationkit.com/index.php?title=Category:Papyrus) or [Fallout 4](http://www.creationkit.com/fallout4/index.php?title=Category:Papyrus).
