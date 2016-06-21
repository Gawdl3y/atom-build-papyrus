# build-papyrus package for Atom
[![Downloads](https://img.shields.io/apm/dm/build-papyrus.svg)](https://atom.io/packages/build-papyrus)
[![Version](https://img.shields.io/apm/v/build-papyrus.svg)](https://atom.io/packages/build-papyrus)
[![Dependency status](https://david-dm.org/Gawdl3y/atom-build-papyrus.svg)](https://david-dm.org/Gawdl3y/atom-build-papyrus)
[![License](https://img.shields.io/apm/l/build-papyrus.svg)](LICENSE)

A build provider for the Atom [build](https://atom.io/packages/build) package that handles Papyrus projects and manual build configuration.  
For Papyrus syntax highlighting, use the [language-papyrus](https://atom.io/packages/language-papyrus) package.

## Usage
If your Papyrus compilers are not in their default locations, then you must configure the compiler paths in the package's settings.
These are used based on the active game for the project file/configuration.  
Skyrim default: `C:\Program Files (x86)\Steam\SteamApps\common\Skyrim\Papyrus Compiler\PapyrusCompiler.exe`  
Fallout 4 default:  `C:\Program Files (x86)\Steam\SteamApps\common\Fallout 4\Papyrus Compiler\PapyrusCompiler.exe`

To build, use `build:trigger` (<kbd>Ctrl</kbd><kbd>Alt</kbd><kbd>B</kbd> or <kbd>F9</kbd>).  
You can select which build target you'd like to use with `build:select-active-target` (<kbd>Ctrl</kbd><kbd>Alt</kbd><kbd>T</kbd> or <kbd>F7</kbd>).  
There are multiple build targets: default, release, and final release. Only the default target is available for Skyrim.  
The default target will use the `release` and `final` settings from the project file/configuration file.  
The release target will send the `release` argument to the compiler.  
The final release target will send both the `release` and `final` arguments to the compiler.
If you're using a project file, the `release` and `final` values in there will still be taken into account by the compiler.
Keep them `false` in the project file for the build targets to work properly.  
If you have both a project file and a fully-buildable configuration file present, targets will be available for both.

### Papyrus project files
Make sure the directory you have open in Atom contains your project file in its root.
If you add, remove, or rename a project file, make sure you run `build:refresh-targets` in the command palette.
Skyrim does not support project files.

### Manual configuration
If you aren't using project files, then you can also configure the build settings in a JSON, CSON, or YAML configuration file called `.build-papyrus.json`, `.build-papyrus.cson`, or `.build-papyrus.yml`.
This should also go in your root directory. The possible settings:

| Option            | Type     | Default                   | Details                                                                                        |
|-------------------|----------|---------------------------|------------------------------------------------------------------------------------------------|
| `game`            | String   |                           | **Required if `compiler` is not defined.** Must be one of `skyrim` or `fallout4`.              |
| `compiler`        | String   | Appropriate `game` path   | **Required if `game` is not defined.** Full path to the Papyrus compiler you wish to use.      |
| `flags`           | String   | Appropriate `game` file   | **Required if `game` is not defined.** The compiler flags file.                                |
| `output`          | String   | `.`                       | Directory for the compiler to output to                                                        |
| `imports`         | Array    |                           | **Required.** Array of strings that are full paths to script import directories.               |
| `optimize`        | Boolean  | `true`                    | Whether or not the compiler should optimize its output.                                        |
| `release`         | Boolean  | `false`                   | Whether or not the compiler should build for release (strip out debugOnly) - Note that instead of specifying this, you can select the "Papyrus release" build target. |
| `final`           | Boolean  | `false`                   | Whether or not the compiler should build for final release (strip out betaOnly) - Note that instead of specifying this, you can select the "Papyrus final release" build target. |

Triggering a build will compile the file you currently have opened.

#### Example configuration (with game)
`.build-papyrus.yml`:
```yaml
game: fallout4
output: C:\Program Files (x86)\Steam\SteamApps\common\Fallout 4\Data\Scripts\
imports:
    - C:\Program Files (x86)\Steam\SteamApps\common\Fallout 4\Data\Scripts\Source\User
    - C:\Program Files (x86)\Steam\SteamApps\common\Fallout 4\Data\Scripts\Source\DLC03
    - C:\Program Files (x86)\Steam\SteamApps\common\Fallout 4\Data\Scripts\Source\DLC02
    - C:\Program Files (x86)\Steam\SteamApps\common\Fallout 4\Data\Scripts\Source\DLC01
    - C:\Program Files (x86)\Steam\SteamApps\common\Fallout 4\Data\Scripts\Source\Base
```

#### Example configuration (without game)
`.build-papyrus.yml`:
```yaml
compiler: C:\Program Files (x86)\Steam\SteamApps\common\Fallout 4\Papyrus Compiler\PapyrusCompiler.exe
flags: Institute_Papyrus_Flags.flg
output: C:\Program Files (x86)\Steam\SteamApps\common\Fallout 4\Data\Scripts\
imports:
    - C:\Program Files (x86)\Steam\SteamApps\common\Fallout 4\Data\Scripts\Source\User
    - C:\Program Files (x86)\Steam\SteamApps\common\Fallout 4\Data\Scripts\Source\DLC03
    - C:\Program Files (x86)\Steam\SteamApps\common\Fallout 4\Data\Scripts\Source\DLC02
    - C:\Program Files (x86)\Steam\SteamApps\common\Fallout 4\Data\Scripts\Source\DLC01
    - C:\Program Files (x86)\Steam\SteamApps\common\Fallout 4\Data\Scripts\Source\Base
```

#### Example configuration (with everything)
`.build-papyrus.yml`:
```yaml
game: fallout4
compiler: C:\Program Files (x86)\Steam\SteamApps\common\Fallout 4\Papyrus Compiler\PapyrusCompiler.exe
flags: Institute_Papyrus_Flags.flg
output: C:\Program Files (x86)\Steam\SteamApps\common\Fallout 4\Data\Scripts\
imports:
    - C:\Program Files (x86)\Steam\SteamApps\common\Fallout 4\Data\Scripts\Source\User
    - C:\Program Files (x86)\Steam\SteamApps\common\Fallout 4\Data\Scripts\Source\DLC03
    - C:\Program Files (x86)\Steam\SteamApps\common\Fallout 4\Data\Scripts\Source\DLC02
    - C:\Program Files (x86)\Steam\SteamApps\common\Fallout 4\Data\Scripts\Source\DLC01
    - C:\Program Files (x86)\Steam\SteamApps\common\Fallout 4\Data\Scripts\Source\Base
optimize: true
release: false
final: false
```

## What is Papyrus?
Papyrus is a scripting language for the Creation Engine, the game engine that *The Elder Scrolls V: Skyrim* and *Fallout 4* run on.
Mods for them use this language to make things happen in the game.
Want to learn more about it?
Check out the Papyrus reference for [Skyrim](http://www.creationkit.com/index.php?title=Category:Papyrus) or [Fallout 4](http://www.creationkit.com/fallout4/index.php?title=Category:Papyrus).
