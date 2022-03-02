const init = (initOpts) => {
  const tree = {
    log: console.log, 
    beforeNodeHook: () => null,
    afterNodeHook: () => null,
    beforeHook: () => null,
    afterHook: () => null,
    ...initOpts,
  }

  const createTest = (name, opts, fn) => {
    const id = opts.getId();
    return async (run) => run(async () => {
      tree.log(id, '!', name);
      try {
        await fn();
        tree.log(id, '= PASS');
        return true;
      } catch (err) {
        err?.message && tree.log(id, '? ', err.message);
        tree.log(id, '= FAIL');
        return false;
      }
    });
  };

  const baseRunner = (fn) => fn();

  const createNode = (nodeName, opts) => {
    const node = {
      id: opts?.getId ? opts.getId() : require('worker_threads').threadId,
      nextId: 0,
      beforeAll: [],
      beforeEach: [],
      afterAll: [],
      afterEach: [],
      children: [],
      getId: () => [node.id, (node.nextId++)].join('.'),
    };

    const build = {
      define: (subName, fn) => {
        const {exec, node: newNode, ...childBuild} = createNode(subName, {getId: node.getId});
        tree.beforeNodeHook(tree, newNode, childBuild);
        fn(childBuild);
        tree.afterNodeHook(tree, newNode,  childBuild);
        node.children.push(exec);
      },
      it: (testName, fn) => node.children.push(createTest(testName, {getId: node.getId}, fn)),
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

    return {
      ...build,
      node,
      exec: async (run = baseRunner) => {
        try {
          await tree.beforeHook(tree, node, build);
          await tree.log(node.id, nodeName);
          await runAll(run)
        } catch(err) {
          await tree.log(node.id, "err ? ", err.message);
        } finally {
          await tree.afterHook(tree, node, build);
        }
      },
    };
  };

  return createNode('Test root', {});
}

module.exports = init;
