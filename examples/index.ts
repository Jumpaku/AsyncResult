import { AsyncResult } from "@jumpaku/async-result";

// Run this example by `cd examples && npm install && npm run debug:cjs`.

// Creation of succeeded result with given value.
AsyncResult.success("Hello").onSuccess(console.log); // => Hello
// Creation of failed result with given error.
AsyncResult.failure("Error").onFailure(console.log); // => Panic!

function panic() {
  throw new Error("Panic!");
}
function catchError(e: unknown) {
  return e as Error;
}

// `try` creates succeeded result if the given function returns a resolved promise or a value without throwing any error.
AsyncResult.try(async () => "Hello").onSuccess(console.log); // => Hello

// `try` creates failed result if the given function returns a rejected promise or throws some error.
AsyncResult.try(panic).onFailure((
  e /* The type of `e` is inferred as `unknown`. */
) => console.log((e as Error).message)); // => Panic!
AsyncResult.try(panic, catchError).onFailure((
  e /* The type of `e` is inferred as the returned type of the function given as a second parameter. */
) => console.log(e.message)); // => Panic!

function divideTenBy(divisor: number) {
  return (
    AsyncResult.success(undefined)
      // If the mapping function never throws any errors, you can use the `map` method.
      .map((v) => 10)
      // If the mapping function may throw some errors, you should use the `tryMap` method.
      .tryMap((v) => (divisor === 0 ? panic() : v / divisor), catchError)
  );
}
divideTenBy(5).onSuccess(console.log); // => 2
divideTenBy(0).onFailure((e) => console.log(e.message)); // => Panic!

function divideTenByPromise(divisor: Promise<number>) {
  return (
    AsyncResult.success(undefined)
      .map((v) => 10)
      // If the mapping function returns a `AsyncResult`, you can use the `flatMap` method.
      .flatMap((v) =>
        AsyncResult.try(
          () => divisor.then((d) => (d === 0 ? panic() : v / d)),
          catchError
        )
      )
  );
}
divideTenByPromise(Promise.resolve(5)).onSuccess(console.log); // => 2
divideTenByPromise(Promise.resolve(0)).onFailure((e) => console.log(e.message)); // => Panic!
divideTenByPromise(Promise.reject(new Error("Rejected!"))).onFailure((e) =>
  console.log(e.message)
); // => Rejected!
