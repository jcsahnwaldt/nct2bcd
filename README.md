## Warning! Work in progress! Not yet ready to use!

Automatically copy [Node.js](http://nodejs.org) compatibility data from [node-compat-table](https://github.com/williamkapke/node-compat-table) to [browser-compat-data](https://github.com/mdn/browser-compat-data). More precisely, to your own branch of browser-compat-data, which you can then use for a pull request.

## Instructions

Clone this project:

```
git clone git@github.com:jcsahnwaldt/nct2bcd.git
cd nct2bcd/
```

Clone your branch of `browser-compat-data` (change `YOUR_BRANCH_NAME` and `YOUR_USER_NAME` to the appropriate values):

```
git clone --branch YOUR_BRANCH_NAME git@github.com:YOUR_USER_NAME/browser-compat-data.git
```

Clone `node-compat-table`:

```
git clone --branch gh-pages https://github.com/williamkapke/node-compat-table.git
```

**Note: I tried using git submodules instead, but everything I tried seemed rather inconvenient. I guess submodules are not meant for this use case. Or maybe I don't know git well enough.**

Run `init_bcd.js` to init (**and overwrite!**) `bcd.json`:

```
node init_bcd.js browser-compat-data bcd.json
```

This reads all `*.json` files in `browser-compat-data/javascript`, builds a mapping from browser-compat-data property paths to file names, and saves the mapping in `bcd.json`.

Run `init_nct.js` to init (**and maybe overwrite!**) `nct.json`:

```
node init_nct.js node-compat-table nct.json
```

This reads `node-compat-table/testers.json`, builds a skeleton mapping from node-compat-table property paths to bcd property paths, and saves the mapping in `nct.json`. If `nct.json` already exists, the script adds new data, but tries to preserve existing mappings. **Note:** this hasn't been tested much. 
