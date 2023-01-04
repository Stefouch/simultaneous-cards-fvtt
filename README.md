<center>
<h1>Simultaneous Cards</h1>
<p>A system-agnostic Foundry module for the simultaneous choice of cards between all the players and the GM!</p>
</center>

# How to Use

1. Install the module
2. Add some tokens on the scene
3. In the token tools, click the `Simultaneous Cards` button, or create a macro (see below)
4. Configure the participants
5. Choose your cards and reveal them!

<img src="https://raw.githubusercontent.com/Stefouch/simultaneous-cards-fvtt/main/static/assets/screenshots/demog.gif" title="Simultaneous Cards Foundry Module Demo"/>

## Macro

Instead of using the control button, you can create your own macro with one of the following lines of code:

```js
// Create a new instance.
game.simoc.app.create();

// Add the ID or name of a cards stack to filter out the others.
game.simoc.app.create('abcd1234');

// You can add more than one ID or name.
game.simoc.app.create(['abcd1234', 'efgh5678']);
```

# Contributing

## Setup

```bash
# Install the Node packages
npm install

# Build the distribution
npm run dev

# Then link the project
# Unix
ln -s dist/* /absolute/path/to/foundry/data/module-name

# Windows
mklink /J /absolute/path/to/link /absolute/path/to/this/repo/dist
```

# License

GPLv3

This module contains parts of the [SWADE](https://gitlab.com/peginc/swade) game system licensed under the Apache 2.0 license.
