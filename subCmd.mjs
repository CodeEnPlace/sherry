#!/usr/bin/env node

const args = process.argv.slice(2);

let i = 0;
while (i < args.length) {
  const flag = args[i++];
  const val = args[i++];

  switch (flag) {
    case "--echo-out":
      process.stdout.write(val + "\n");
      break;
    case "--echo-err":
      process.stderr.write(val + "\n");
      break;
    case "--env-out":
      process.stdout.write(`${val}=${process.env[val]}\n`);
      break;
    case "--exit-code":
      process.exitCode = Number(val);
      break;
  }
}
