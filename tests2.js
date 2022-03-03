const {expect} = require('chai');
const consoleLog = console.log;
const init = require('./lib.js');
const createLogs = () => {
  const logs = [];
  return {
    logs, 
    hooks: {
      log: (arg)=> logs.push(arg),
      beforeHook: (tree, node, build) =>{
        node._log = console.log;
        console.log = (...args) => tree.log({id: node.id, data: args});
      },
      afterHook: (tree, node, build) => {
        console.log = node._log;
      },
    }
  }
}

const t1 = async ()=>{
  const {logs, hooks} = createLogs();
  const {it, exec} = init(hooks);
  it('should work');
  try {
    await exec();
    expect(console.log).to.eql(consoleLog);
  }catch(err){
    console.error(err);
  }
}

const t2 = async ()=>{
  const {logs, hooks} = createLogs();
  const {it, exec} = init(hooks);
  it('should work');
  try {
    await exec();
    expect(logs).to.deep.eql([
      { id: '0', name: 'Test root', type: 'GROUP', flag: 'START' },
      { id: '0.0', name: 'should work', type: 'TEST', flag: 'TODO' },
      { id: '0', name: 'Test root', type: 'GROUP', flag: 'END' }
    ]);
  }catch(err){
    console.error(err);
  }
}

const t3 = async ()=>{
  const {logs, hooks} = createLogs();
  const {it, exec} = init(hooks);
  it.todo('should work', () => {});
  try {
    await exec();
    expect(logs).to.deep.eql([
      { id: '0', name: 'Test root', type: 'GROUP', flag: 'START' },
      { id: '0.0', name: 'should work', type: 'TEST', flag: 'TODO' },
      { id: '0', name: 'Test root', type: 'GROUP', flag: 'END' }
    ]);
  }catch(err){
    console.error(err);
  }
}

const t4 = async ()=>{
  const {logs, hooks} = createLogs();
  const {it, exec} = init(hooks);
  it.skip('should work', () => {});
  try {
    await exec();
    expect(logs).to.deep.eql([
      { id: '0', name: 'Test root', type: 'GROUP', flag: 'START' },
      { id: '0.0', name: 'should work', type: 'TEST', flag: 'SKIP' },
      { id: '0', name: 'Test root', type: 'GROUP', flag: 'END' }
    ]);
  }catch(err){
    console.error(err);
  }
}

const t5 = async ()=>{
  const {logs, hooks} = createLogs();
  const {it, exec} = init(hooks);
  it('should work', () => Promise.reject());
  try {
    await exec();
    expect(logs).to.deep.eql([
      { id: '0', name: 'Test root', type: 'GROUP', flag: 'START' },
      { id: '0.0', name: 'should work', flag: 'RUN' },
      { id: '0.0', flag: 'FAIL' },
      { id: '0', name: 'Test root', type: 'GROUP', flag: 'END' }
    ]);
  }catch(err){
    console.error(err);
  }
}

const t6 = async ()=>{
  const {logs, hooks} = createLogs();
  const {define, exec} = init(hooks);
    define('test', ({it}) => {
      it('should work');
    })
  try {
    await exec();
    expect(logs).to.deep.eql([
      { id: '0', name: 'Test root', type: 'GROUP', flag: 'START' },
      { id: '0.0', name: 'test', type: 'GROUP', flag: 'START' },
      { id: '0.0.0', name: 'should work', type: 'TEST', flag: 'TODO' },
      { id: '0.0', name: 'test', type: 'GROUP', flag: 'END' },
      { id: '0', name: 'Test root', type: 'GROUP', flag: 'END' }
    ]);
  }catch(err){
    console.error(err);
  }
}

(async ()=>{
  await t1();
  await t2();
  await t3();
  await t4();
  await t5();
  await t6();
})()
