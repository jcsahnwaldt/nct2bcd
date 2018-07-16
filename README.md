## nct2bcd

Automatically copy [Node.js](http://nodejs.org) compatibility data from [node-compat-table](https://github.com/williamkapke/node-compat-table) (NCT) to [browser-compat-data](https://github.com/mdn/browser-compat-data) (BCD). More precisely, to your own branch of browser-compat-data, which you can then use for a pull request.

**Warning: Work in progress! This tool hasn't been thoroughly tested yet and may overwrite your files or make demons fly out of your nose.**

## Instructions

##### Clone this project

```
git clone git@github.com:jcsahnwaldt/nct2bcd.git
cd nct2bcd/
```

##### Clone your branch of `browser-compat-data`

(Change `YOUR_BRANCH_NAME` and `YOUR_USER_NAME` to the appropriate values)

```
git clone --branch YOUR_BRANCH_NAME git@github.com:YOUR_USER_NAME/browser-compat-data.git
```

##### Clone `node-compat-table`:

```
git clone --branch gh-pages https://github.com/williamkapke/node-compat-table.git
```

Note: Cloning git repos into subfolders of a parent repo seems strange, but I tried using git submodules instead and all solutions I found were rather inconvenient. I guess submodules are not meant for this use case. Or maybe I don't know git well enough. If you want, you can clone the `browser-compat-data` and `node-compat-table` repos to another location. Just use the appropriate paths when you run the commands below.

##### Run `init_bcd.js` to init (**and overwrite!**) `bcd.json`:

```
node init_bcd.js browser-compat-data bcd.json
```

This reads all `*.json` files in `browser-compat-data/javascript`, builds a mapping from browser-compat-data property paths to file names, and saves the mapping in `bcd.json`. Any previous data in that file will be overwritten. If the file doesn't exist, it is created.

##### Run `init_nct.js` to init (**and overwrite!**) `nct.json`:

```
node init_nct.js node-compat-table nct.json
```

This reads `node-compat-table/testers.json`, builds a skeleton mapping from node-compat-table property paths to bcd property paths, and saves the mapping in `nct.json`. If `nct.json` already exists, the script may add new data, but will try to preserve existing mappings. If the file doesn't exist, it is created.

##### Run `update_nct.js` to update (**and overwrite!**) `nct.json`:

```
node update_nct.js node-compat-table nct.json
```

This reads `node-compat-table/results/v8/*.json` and adds the version data to `nct.json`. If `nct.json` already exists, the script may add new data, but will try to preserve existing data. If the file doesn't exist, the script fails.

##### Run `update_bcd.js` to update (**and overwrite!**) `*.json` files in `browser-compat-data/javascript`:

```
node update_bcd.js nct.json bcd.json browser-compat-data
```

This reads version data from `nct.json`, reads mappings to `browser-compat-data` files from `bcd.json`, and adds version data to `browser-compat-data/javascript/{,**/}*.json` files. If a file that the script wants to update doesn't exist, the script fails. If the file exists, the script adds new data, but will try to preserve existing data.
