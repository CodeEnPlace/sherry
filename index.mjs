import { spawn } from "node:child_process";

export default makeSherry({ outputs: "stdout", delimiter: "\n", shell: process.env.SHELL, env: process.env });

function makeSherry(config) {
  return function sherry(...args) {
    if (args.length === 1 && typeof args[0] === "object") {
      return makeSherry({
        ...config,
        ...args[0],
        env: {
          ...config.env,
          ...(args[0].env ?? {}),
        },
      });
    }

    async function makeProc() {
      const cmdAcc = [];
      async function resolveArgs(x) {
        if (typeof x === "string") {
          cmdAcc.push(x);
          return;
        }
        if (typeof x === "number") {
          cmdAcc.push(x.toString());
          return;
        }

        if (x[Symbol.iterator]) {
          for (const el of x) await resolveArgs(el);
          return;
        }

        if (x[Symbol.asyncIterator]) {
          for await (const el of x) await resolveArgs(el);
          return;
        }

        if (typeof x === "object") {
          if (typeof x.then === "function") {
            await resolveArgs(await x);
            return;
          }

          for (const [key, val] of Object.entries(x)) {
            if (typeof val === "boolean" && val) await resolveArgs(key);
            if (typeof val === "string") {
              await resolveArgs(key);
              await resolveArgs(val);
            }
          }
        }
      }

      await resolveArgs(args);

      const cmd = cmdAcc.join(" ");

      const proc = spawn(config.shell, ["-c", cmd], { env: config.env });

      let buffer = "";
      let code = null;
      let done = () => {};
      let fail = () => {};
      let poll = () => {
        if (buffer.includes(config.delimiter)) {
          const [head, ...tail] = buffer.split(config.delimiter);
          buffer = tail.join(config.delimiter);
          done({ done: code !== null, value: head });
        }

        if (code !== null) done({ done: code !== null, value: null });
      };

      const stream = config.outputs === "stderr" ? "stderr" : "stdout";
      proc[stream].on("data", (data) => {
        buffer += data;
        poll();
      });

      proc.on("close", (c) => {
        code = c;
        poll();
      });

      return {
        [Symbol.asyncIterator]() {
          return {
            next() {
              return new Promise((d, f) => {
                done = d;
                fail = f;
              });
            },
            return() {
              // I don't know what this does, and I'm not finding out
              return { done: true };
            },
          };
        },
      };
    }

    return {
      then: async (done, fail) => {
        try {
          const acc = [];

          for await (const chunk of await makeProc()) acc.push(chunk);

          done(acc.join(config.delimiter));
        } catch (e) {
          fail(e);
        }
      },

      [Symbol.asyncIterator]() {
        let iter = makeProc();

        return {
          next() {
            return new Promise(async (done, f) => {
              if (iter.then) {
                let resolvedProc = await iter;
                iter = resolvedProc[Symbol.asyncIterator]();
              }
              done(await iter.next());
            });
          },
          return() {
            // I don't know what this does, and I'm not finding out
            return { done: true };
          },
        };
      },
    };
  };
}
