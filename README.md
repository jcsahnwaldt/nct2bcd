## Warning! Work in progress! Not yet ready to use!

Automatically copy [Node.js](http://nodejs.org) compatibility data from [node-compat-table](https://github.com/williamkapke/node-compat-table) to [browser-compat-data](https://github.com/mdn/browser-compat-data). More precisely, to your own branch of browser-compat-data, which you can then use for a pull request.

## Instructions

Clone this project:

```
git clone git@github.com:jcsahnwaldt/nct2bcd.git
cd nct2bcd/
```

Clone `browser-compat-data` (change `YOUR_BRANCH_NAME` and `YOUR_USER_NAME` to the appropriate values):

```
git clone --single-branch --branch YOUR_BRANCH_NAME git@github.com:YOUR_USER_NAME/browser-compat-data.git
```

Clone `node-compat-table`:

```
git clone --single-branch --branch gh-pages https://github.com/williamkapke/node-compat-table.git
```

**Note: I tried using git submodules instead, but everything I tried seemed rather inconvenient. I guess submodules are not meant for this use case. Or maybe I don't know git well enough.**

Run `init_bcd.js` to init (**overwrite**) `bcd.json`:

```
node init_bcd.js browser-compat-data bcd.json
```

This reads all `*.json` files in `browser-compat-data/javascript`, builds a mapping from browser-compat-data property paths to file names, and saves the mapping in `bcd.json`.
