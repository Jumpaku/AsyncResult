export * from "./Option";
export * from "./Result";
export * from "./AsyncResult";

import { AsyncResult } from "./AsyncResult";

const x = AsyncResult.try(() => 1).tryRecover(
  (e) => 0,
  (e) => "2"
);
const y = x.flatMap(() => AsyncResult.success("A"));
const z = (async () => {
  return await y.promise;
})();
