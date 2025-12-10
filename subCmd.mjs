#!/usr/bin/env node

// hello.js
import arg from "arg";

const args = arg({
  "--echo-out": [String],
  "--echo-err": [String],
  "--env-out": [String],
});

for (const echoOut of args["--echo-out"] ?? []) {
  process.stdout.write(echoOut + "\n");
}

for (const echoErr of args["--echo-err"] ?? []) {
  process.stderr.write(echoErr + "\n");
}

for (const envOut of args["--env-out"] ?? []) {
  process.stdout.write(`${envOut}=${process.env[envOut]}\n`);
}
