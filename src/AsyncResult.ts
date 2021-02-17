import { Result } from "./Result";

export class AsyncResult<V, E> {
  static success<V>(v: V): AsyncResult<V, never> {
    return AsyncResult.resolve(Result.success(v));
  }
  static failure<E>(e: E): AsyncResult<never, E> {
    return AsyncResult.resolve(Result.failure(e));
  }
  static try<V>(tryFun: () => V | Promise<V>): AsyncResult<V, unknown>;
  static try<V, E>(
    tryFun: () => V | Promise<V>,
    catchFun: (e: unknown) => E
  ): AsyncResult<V, E>;
  static try<V, E>(
    tryFun: () => V | Promise<V>,
    catchFun?: (e: unknown) => E
  ): AsyncResult<V, E | unknown> {
    const promise = new Promise<V>((resolve, reject) => {
      try {
        resolve(tryFun());
      } catch (error) {
        reject(error);
      }
    }).then(Result.success);
    return catchFun == null
      ? new AsyncResult<V, unknown>(promise.catch((e) => Result.failure(e)))
      : new AsyncResult<V, E>(
          promise.catch((e) => Result.failure(catchFun(e)))
        );
  }

  static resolve<V, E>(result: Result<V, E>): AsyncResult<V, E> {
    return new AsyncResult(Promise.resolve(result));
  }

  static of<V, E>(result: Promise<Result<V, E>>): AsyncResult<V, unknown>;
  static of<V, E, F>(
    result: Promise<Result<V, E>>,
    catchFun: (error: unknown) => F
  ): AsyncResult<V, E | F>;
  static of<V, E, F>(
    result: Result<V, E> | Promise<Result<V, E>>,
    catchFun?: (error: unknown) => F
  ): AsyncResult<V, E | F | unknown> {
    const promise = Promise.resolve(result);
    return catchFun == null
      ? new AsyncResult(
          promise.catch((error: unknown) => Result.failure(error))
        )
      : new AsyncResult<V, E | F>(
          promise.catch((error: unknown) => Result.failure(catchFun(error)))
        );
  }

  private constructor(readonly promise: Promise<Result<V, E>>) {}

  value(): Promise<V | undefined> {
    return this.promise.then((r) => r.value);
  }
  error(): Promise<E | undefined> {
    return this.promise.then((r) => r.error);
  }
  orNull(): Promise<V | null> {
    return this.promise.then((r) => r.orNull());
  }
  orUndefined(): Promise<V | undefined> {
    return this.promise.then((r) => r.orUndefined());
  }
  orReject(): Promise<V> {
    return this.promise.then((r) => r.orThrow());
  }
  orDefault(value: V): Promise<V> {
    return this.promise.then((r) => r.orDefault(value));
  }
  orRecover(neverThrowFun: (e: E) => V): Promise<V> {
    return this.promise.then((r) => r.orRecover(neverThrowFun));
  }
  match<X, Y>(
    onSuccess: (value: V) => X,
    onFailure: (error: E) => Y
  ): Promise<X | Y> {
    return this.promise.then((result) => result.match(onSuccess, onFailure));
  }
  map<U>(neverThrowFun: (v: V) => U): AsyncResult<U, E> {
    return new AsyncResult(
      this.promise.then((result) => result.map(neverThrowFun))
    );
  }
  tryMap<U>(tryFun: (v: V) => U): AsyncResult<U, unknown>;
  tryMap<U, F>(
    tryFun: (v: V) => U,
    catchFun: (error: unknown) => F
  ): AsyncResult<U, E | F>;
  tryMap<U, F>(
    tryFun: (v: V) => U,
    catchFun?: (error: unknown) => F
  ): AsyncResult<U, E | F | unknown> {
    return (catchFun == null
      ? AsyncResult.try(() => this.map(tryFun))
      : AsyncResult.try(() => this.map(tryFun), catchFun)
    ).flatMap((it) => it);
  }
  flatMap<U, F>(
    neverThrowFun: (v: V) => AsyncResult<U, F>
  ): AsyncResult<U, E | F> {
    const promise = new Promise<Result<U, E | F>>(async (resolve) => {
      (await this.promise)
        .onSuccess((value) => resolve(neverThrowFun(value).promise))
        .onFailure((error) => resolve(Result.failure(error)));
    });
    return new AsyncResult<U, E | F>(promise);
  }
  tryFlatMap<U, F>(
    tryFun: (v: V) => AsyncResult<U, F>
  ): AsyncResult<U, unknown>;
  tryFlatMap<U, F, G>(
    tryFun: (v: V) => AsyncResult<U, F>,
    catchFun: (error: unknown) => G
  ): AsyncResult<U, E | F | G>;
  tryFlatMap<U, F, G>(
    tryFun: (v: V) => AsyncResult<U, F>,
    catchFun?: (error: unknown) => G
  ): AsyncResult<U, E | F | G | unknown> {
    return (catchFun == null
      ? AsyncResult.try(() => this.flatMap(tryFun))
      : AsyncResult.try(() => this.flatMap(tryFun), catchFun)
    ).flatMap((it) => it);
  }
  recover(neverThrowFun: (e: E) => V): AsyncResult<V, never> {
    return new AsyncResult<V, never>(
      this.promise.then((result) => result.recover(neverThrowFun))
    );
  }
  tryRecover(tryFun: (error: E) => V): AsyncResult<V, unknown>;
  tryRecover<F>(
    tryFun: (error: E) => V,
    catchFun: (error: unknown) => F
  ): AsyncResult<V, F>;
  tryRecover<F>(
    tryFun: (error: E) => V,
    catchFun?: (error: unknown) => F
  ): AsyncResult<V, F | unknown> {
    return (catchFun == null
      ? AsyncResult.try(() => this.recover(tryFun))
      : AsyncResult.try(() => this.recover(tryFun), catchFun)
    ).flatMap((it) => it);
  }
  flatRecover<F>(
    neverThrowFun: (e: E) => AsyncResult<V, F>
  ): AsyncResult<V, F> {
    const promise = new Promise<Result<V, F>>(async (resolve) => {
      (await this.promise)
        .onSuccess((value) => resolve(Result.success(value)))
        .onFailure((error) => resolve(neverThrowFun(error).promise));
    });
    return new AsyncResult<V, F>(promise);
  }
  tryFlatRecover<F>(
    tryFun: (error: E) => AsyncResult<V, F>
  ): AsyncResult<V, unknown>;
  tryFlatRecover<F>(
    tryFun: (error: E) => AsyncResult<V, F>,
    catchFun: (error: unknown) => F
  ): AsyncResult<V, F>;
  tryFlatRecover<F, G>(
    tryFun: (error: E) => AsyncResult<V, F>,
    catchFun?: (error: unknown) => G
  ): AsyncResult<V, F | G | unknown> {
    return (catchFun == null
      ? AsyncResult.try(() => this.flatRecover(tryFun))
      : AsyncResult.try(() => this.flatRecover(tryFun), catchFun)
    ).flatMap((it) => it);
  }
  onSuccess(neverThrowFun: (value: V) => void): AsyncResult<V, E> {
    this.promise.then((r) => r.onSuccess(neverThrowFun));
    return this;
  }
  onFailure(neverThrowFun: (e: E) => void): AsyncResult<V, E> {
    this.promise.then((r) => r.onFailure(neverThrowFun));
    return this;
  }
  and<U, F>(other: AsyncResult<U, F>): AsyncResult<V | U, E | F> {
    return new AsyncResult<V | U, E | F>(
      this.promise.then((r0) => other.promise.then((r1) => r0.and(r1)))
    );
  }
  or<U, F>(other: AsyncResult<U, F>): AsyncResult<V | U, E | F> {
    return new AsyncResult<V | U, E | F>(
      this.promise.then((r0) => other.promise.then((r1) => r0.or(r1)))
    );
  }
}
