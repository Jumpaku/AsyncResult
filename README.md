# AsyncResult

A typescript library that provides `Result` and `AsyncResult`.

- `Result<V, E>` represents a result of a computation.

  - It has a value of the type `V` if the computation is succeeded.
  - It has an error of the type `E` if the computation is failed.

- `AsyncResult<V, E>` represents an asynchronous result of a computation.

  - It is implemented as a wrapper of `Promise<Result<V, E>>`.

## Examples

- [examples/index.ts](examples/index.ts)

## API

- Result: [dist/Result.d.ts](dist/Result.d.ts)
- AsyncResult: [dist/AsyncResult.d.ts](dist/AsyncResult.d.ts)

## Contributing

### Commit massages

- feat
- build
- fix
- docs

https://github.com/angular/angular/blob/22b96b9/CONTRIBUTING.md#-commit-message-guidelines
