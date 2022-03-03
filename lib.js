const init = (initOpts) => {
  const tree = {
    pass: true,
    log: (event) => console.log(event.id, event.name, event.message, event.flag), 
    beforeNodeHook: () => null,
    afterNodeHook: () => null,
    beforeHook: () => null,
    afterHook: () => null,
    ...initOpts,
  }

  const createTest = (name, opts, fn) => {
    const id = opts.getId();
    if(opts.only) tree.only = id;

    const exec = async (run) => run(async () => {
      if(!fn || opts.todo) return tree.log({id, name, type: 'TEST', flag: 'TODO'});
      if(opts.skip || (tree.only && !tree.only.startsWith(id.substring(0,tree.only.length)))) {
        return tree.log({id, name, type: 'TEST', flag: 'SKIP'});
      };
      tree.log({id, name, flag: 'RUN'});
      try {
        await fn();
        tree.log({id, flag: 'PASS'});
        return true;
      } catch (err) {
        err?.message && tree.log({id, message: err.message, err});
        tree.log({id, flag: 'FAIL'});
        tree.pass = false;
        return false;
      }
    });

    exec.id = id;

    return exec;
  };

  const baseRunner = (fn) => fn();

  const createNode = (nodeName, opts) => {
    const node = {
      id: "" + (opts?.getId ? opts.getId() : require('worker_threads').threadId),
      nextId: 0,
      skip: opts.skip,
      beforeAll: [],
      beforeEach: [],
      afterAll: [],
      afterEach: [],
      children: [],
      getId: () => [node.id, (node.nextId++)].join('.'),
    };
    if(opts.only) tree.only = id;

    const log = (arg) => tree.log({id: node.id, name: nodeName, type: 'GROUP', ...arg});

    const addFlags = (flags, mainFn) => {
      flags.forEach(flag => {
        mainFn[flag] = (name, fn) => mainFn(name, fn, {[flag]: true});
      });
      return mainFn;
    }

    const it = addFlags(['skip', 'only', 'todo'], (testName, fn, flags = {}) => {
      node.children.push(createTest(testName, {getId: node.getId, ...flags}, fn));
    });

    const define = addFlags(['skip'], (subName, fn, flags = {}) => {
      const {exec, ...childBuild} = createNode(subName, {getId: node.getId, ...flags});
      tree.beforeNodeHook(tree, exec.node, childBuild);
      fn(childBuild);
      tree.afterNodeHook(tree, exec.node,  childBuild);
      node.children.push(exec);
    });

    const build = {
      define,
      it,
      beforeAll: (fn) => node.beforeAll.push(fn),
      beforeEach: (fn) => node.beforeEach.push(fn),
      afterAll: (fn) => node.afterAll.unshift(fn),
      afterEach: (fn) => node.afterEach.unshift(fn),
    }

    const execAll = async (arr, arg) => {
      for(const item of arr) {
        await item(arg);
      }
    };

    const wrap = (fn) => async () => {
      await execAll(node.beforeEach);
      const ret = await fn();
      await execAll(node.afterEach);
      return ret;
    };

    const runAll = async (run) => {
      await execAll(node.beforeAll);
      await execAll(node.children, (fn) => run(wrap(fn)));
      await execAll(node.afterAll);
    }

    const exec = async (run = baseRunner) => {
      if(opts.skip || (tree.only && !tree.only.startsWith(node.id.substring(0, tree.only.length)))){
        log({ flag: 'SKIP'});
        return;
      }
      try {
        await tree.beforeHook(tree, node, build);
        await log({flag: 'START'});
        await runAll(run)
      } catch(err) {
        await log({message: err.message, err});
      } finally {
        await log({flag: 'END'});
        await tree.afterHook(tree, node, build);
      }
      return tree.pass;
    }
    exec.node = node;

    return {
      ...build,
      exec,
    };
  };

  return createNode('Test root', {});
}

module.exports = init;
