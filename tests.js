const {expect} = require('chai');

const createNode = require('./lib.js');

const logs = []
const node = createNode({
  log: (...args)=> logs.push(args),
  beforeNodeHook: (tree, node, build) =>{
    Object.keys(build).forEach(n => {
      node['_bak_' + n] = global[n];
      global[n] = build[n];
    })
  },
  afterNodeHook: (tree, node, build) => {
    Object.keys(build).forEach(n => {
      global[n] = node['_bak_' + n];
    })
  },
  beforeHook: (tree, node, build) =>{
    node._log = console.log;
    console.log = (...args) => tree.log(node.id, ...args);
  },
  afterHook: (tree, node, build) => {
    console.log = node._log;
  },
});
const {define, exec} = node;
global.define = define;

require('./jestlike.spec');

(async () => {
  console.log(require('util').inspect(node, {showHidden: false, depth: null, colors: true}))

  await exec();

  console.log(logs);
  expect(logs).to.deep.eql([
    [ 0, 'Test root' ],
    [ '0.0', 'First level' ],
    [ '0.0', 'ba' ],
    [ '0.0.0', 'failing' ],
    [ '0.0.0', 'ba -- no -- THROW' ],
    [ '0.0.0', 'err ? ', 'shit' ],
    [ '0.0.1', 'second' ],
    [ '0.0.1', 'ba =============================' ],
    [ '0.0.1', 'be' ],
    [ '0.0.1', 'be 2' ],
    [ '0.0.1.0', '!', 'should work' ],
    [ '0.0.1.0', '= PASS' ],
    [ '0.0.1', 'ae 2' ],
    [ '0.0.1', 'ae' ],
    [ '0.0.1', 'be' ],
    [ '0.0.1', 'be 2' ],
    [ '0.0.1.1', '!', 'should fail' ],
    [ '0.0.1.1', '? ', 'Nothing works' ],
    [ '0.0.1.1', '= FAIL' ],
    [ '0.0.1', 'ae 2' ],
    [ '0.0.1', 'ae' ],
    [ '0.0.1', 'aa =============================' ],
    [ '0.0', 'be' ],
    [ '0.0.2', '!', 'should work' ],
    [ '0.0.2', '= PASS' ],
    [ '0.0', 'ae' ],
    [ '0.0', 'be' ],
    [ '0.0.3', '!', 'should fail' ],
    [ '0.0.3', '= FAIL' ],
    [ '0.0', 'ae' ],
    [ '0.0', 'aa' ]
  ]);
})()
