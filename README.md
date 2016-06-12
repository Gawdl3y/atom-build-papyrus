# build-papyrus package for Atom

A build provider for the Atom [build](https://atom.io/packages/build) package that handles Papyrus projects and manual build configuration.  
For Papyrus syntax highlighting, use the [language-papyrus](https://atom.io/packages/language-papyrus) package.

## Usage
If your Papyrus compilers are not in their default locations, then you must configure the compiler paths in the package's settings.  
Skyrim default: `C:\Program Files (x86)\Steam\SteamApps\common\Skyrim\Papyrus Compiler\PapyrusCompiler.exe`  
Fallout 4 default:  `C:\Program Files (x86)\Steam\SteamApps\common\Fallout 4\Papyrus Compiler\PapyrusCompiler.exe`

### Papyrus project files
Make sure the directory you have open in Atom contains your project file in its root.
If you add, remove, or rename a project file, make sure you run `build:refresh-targets` in the command palette.

### Manual configuration
If you aren't using project files (Skyrim doesn't support them), then you can also configure the build settings in a JSON, CSON, or YAML configuration file called `.build-papyrus.json`, `.build-papyrus.cson`, or `.build-papyrus.yml`.
This should also go in your root directory. The possible settings:

| Option            | Type     | Default                   | Details                                                                                        |
|-------------------|----------|---------------------------|------------------------------------------------------------------------------------------------|
| `game`            | String   |                           | Must be one of `skyrim` or `fallout4`. **Either this or `compiler` must be defined.**          |
| `compiler`        | String   | Appropriate `game` path   | Full path to the Papyrus compiler you wish to use. **Either this or `game` must be defined.**  |
| `imports`         | Array    |                           | Array of strings that are full paths to script import directories. **Required**                |
| `output`          | String   | `./`                      | Directory for the compiler to output to                                                        |
| `flags`           | String   | Appropriate `game` file   | The compiler flags file. **Required if `game` is not specified.**                              |
| `optimize`        | Boolean  | `true`                    | Whether or not the compiler should optimize its output.                                        |
| `release`         | Boolean  | `false`                   | Whether or not the compiler should build for release (strip out debugOnly)                     |
| `final`           | Boolean  | `false`                   | Whether or not the compiler should build for final release (strip out debugOnly and betaOnly)  |

## What is Papyrus?
Papyrus is a scripting language for the Creation Engine, the game engine that *The Elder Scrolls V: Skyrim* and *Fallout 4* run on.
Mods for them use this language to make things happen in the game.
Want to learn more about it?
Check out the Papyrus reference for [Skyrim](http://www.creationkit.com/index.php?title=Category:Papyrus) or [Fallout 4](http://www.creationkit.com/fallout4/index.php?title=Category:Papyrus).
