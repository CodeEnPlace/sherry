#!/usr/bin/env node

import assert from "node:assert";

import sh from "./index.mjs";

function* genSync() {
  yield "--echo-out";
  yield "foo";
}

async function* genAsync() {
  yield "--echo-out";
  await new Promise((done) => setTimeout(done, 10));
  yield "foo";
}

async function test() {
  assert.deepEqual(await sh("./subCmd.mjs", "--echo-out", "foo"), "foo", "basic");
  assert.deepEqual(await sh("./subCmd.mjs", { "--echo-out": "foo" }), "foo", "key val");
  assert.deepEqual(await sh("./subCmd.mjs", { "--echo-out foo": true }), "foo", "obj truthy");
  assert.deepEqual(await sh("./subCmd.mjs", { "--echo-out foo": false }), "", "obj falsey");
  assert.deepEqual(await sh("./subCmd.mjs", ["--echo-out", "foo"]), "foo", "array");
  assert.deepEqual(await sh("./subCmd.mjs", "--echo-out", Promise.resolve("foo")), "foo", "Promise");

  assert.deepEqual(await sh("./subCmd.mjs", genSync()), "foo", "itter");
  assert.deepEqual(await sh("./subCmd.mjs", genAsync()), "foo", "async itter");

  assert.deepEqual(await sh({ env: { FOO: "bar" } })("./subCmd.mjs", "--env-out", "FOO"), "FOO=bar", "set env");

  assert.deepEqual(await sh({ outputs: "stdout" })("./subCmd.mjs", "--echo-out", "foo", "--echo-err", "bar"), "foo", "stdout");
  assert.deepEqual(await sh({ outputs: "stderr" })("./subCmd.mjs", "--echo-out", "foo", "--echo-err", "bar"), "bar", "stderr");

  await (async () => {
    let acc = [];
    for await (const line of sh("./subCmd.mjs", "--echo-out", "foo", "--echo-out", "bar")) {
      acc.push(line);
    }
    assert.deepEqual(acc, ["foo", "bar"], "streams lines");
  })();

  await (async () => {
    let acc = [];
    for await (const line of sh({ delimiter: " " })("./subCmd.mjs", "--echo-out", "'foo bar baz'")) {
      acc.push(line);
    }
    assert.deepEqual(acc, ["foo", "bar", "baz"], "streams custom delimiter");
  })();
}

test();
