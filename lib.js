const init = (initOpts) => {
  const tree = {
    pass: true,
    log: console.log, 
    beforeNodeHook: () => null,
    afterNodeHook: () => null,
    beforeHook: () => null,
    afterHook: () => null,
    ...initOpts,
  }

  const createTest = (name, opts, fn) => {
    const id = opts.getId();
    

    const exec = async (run) => run(async () => {
      if(!fn || opts.todo) return tree.log(id, name, 'TODO');
      if(opts.skip || (tree.only && !tree.only.startsWith(id))) {
        return tree.log(id, name, 'SKIP');
      };
      tree.log(id, '!', name);
      try {
        await fn();
        tree.log(id, '= PASS');
        return true;
      } catch (err) {
        err?.message && tree.log(id, '? ', err.message);
        tree.log(id, '= FAIL');
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

    const addFlags = (flags, fn) => {
      flags.forEach(flag => {
        fn[flag] = (name, fn) => fn(name, fn, {[flag]: true});
      });
      return fn;
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
      if(opts.skip || (tree.only && !tree.only.startsWith(node.id))){
        tree.log(node.id, nodeName, 'SKIP');
        return;
      }
      try {
        await tree.beforeHook(tree, node, build);
        await tree.log(node.id, nodeName);
        await runAll(run)
      } catch(err) {
        await tree.log(node.id, "err ? ", err.message);
      } finally {
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
