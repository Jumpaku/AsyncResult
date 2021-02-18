import { BaseError } from "make-error-cause";
import { AsyncResult } from "./AsyncResult";

export class ResultError<E> extends BaseError {
  readonly name: string = "ResultError";
  readonly detail: E;
  constructor(error: E) {
    super(
      error instanceof Error ? error.message : "",
      error instanceof Error ? error : undefined
    );
    this.detail = error;
  }
}

export const Result = class {
  static success<V>(value: V): Result<V, never> {
    return new Success<V, never>(value);
  }
  static failure<E>(error: E): Result<never, E> {
    return new Failure<never, E>(error);
  }
  static try<V>(tryFun: () => V): Result<V, unknown>;
  static try<V, E>(
    tryFun: () => V,
    catchFun: (error: unknown) => E
  ): Result<V, E>;
  static try<V, E>(
    tryFun: () => V,
    catchFun?: (error: unknown) => E
  ): Result<V, unknown> | Result<V, E> {
    try {
      return Result.success(tryFun());
    } catch (error: unknown) {
      return catchFun == null
        ? Result.failure(error)
        : Result.failure(catchFun(error));
    }
  }
  static isResult<V, E>(obj: unknown): obj is Result<V, E> {
    return obj instanceof AbstractResult;
  }
  private constructor() {}
};

abstract class AbstractResult<V, E> {
  private assertsThisIsResult(): asserts this is Result<V, E> {
    if (!this.isSuccess() && !this.isFailure()) throw new Error();
  }
  abstract isSuccess(): this is Success<V, E>;
  abstract isFailure(): this is Failure<V, E>;
  match<X, Y>(onSuccess: (value: V) => X, onFailure: (error: E) => Y): X | Y {
    this.assertsThisIsResult();
    return this.isSuccess() ? onSuccess(this.value) : onFailure(this.error);
  }
  orDefault(value: V): V {
    return this.isSuccess() ? this.value : value;
  }
  orRecover(f: (error: E) => V): V {
    this.assertsThisIsResult();
    return this.isSuccess() ? this.value : f(this.error);
  }
  orThrow<F>(f?: (e: E) => F): V {
    this.assertsThisIsResult();
    if (this.isFailure())
      throw f != null ? f(this.error) : new ResultError(this.error);
    return this.value;
  }
  orNull(): V | null {
    return this.isSuccess() ? this.value : null;
  }
  orUndefined(): V | undefined {
    return this.isSuccess() ? this.value : undefined;
  }
  onSuccess(f: (value: V) => void): Result<V, E> {
    if (this.isSuccess()) f(this.value);
    this.assertsThisIsResult();
    return this;
  }
  onFailure(f: (error: E) => void): Result<V, E> {
    this.assertsThisIsResult();
    if (this.isFailure()) f(this.error);
    return this;
  }
  and<U, F>(other: Result<U, F>): Result<V | U, E | F> {
    return this.isFailure() ? this : other;
  }
  or<U, F>(other: Result<U, F>): Result<V | U, E | F> {
    return this.isSuccess() ? this : other;
  }
  map<U>(neverThrowFun: (value: V) => U): Result<U, E> {
    this.assertsThisIsResult();
    return this.isSuccess()
      ? Result.success(neverThrowFun(this.value))
      : this.castValue();
  }
  mapAsync<U>(tryFun: (value: V) => U | Promise<U>): AsyncResult<U, unknown>;
  mapAsync<U, F>(
    tryFun: (value: V) => U | Promise<U>,
    catchFun: (error: unknown) => F
  ): AsyncResult<U, F>;
  mapAsync<U, F>(
    tryFun: (value: V) => U | Promise<U>,
    catchFun?: (error: unknown) => F
  ): AsyncResult<U, F | unknown> {
    return catchFun == null
      ? this.match(
          (v) => AsyncResult.try(() => tryFun(v)),
          (e) => AsyncResult.failure(e)
        )
      : this.match(
          (v) => AsyncResult.try(() => tryFun(v), catchFun),
          (e) => AsyncResult.failure(e)
        );
  }
  tryMap<U>(tryFun: (value: V) => U): Result<U, unknown>;
  tryMap<U, F>(
    tryFun: (value: V) => U,
    catchFun: (error: unknown) => F
  ): Result<U, E | F>;
  tryMap<U, F>(
    tryFun: (value: V) => U,
    catchFun?: (error: unknown) => F
  ): Result<U, E | F | unknown> {
    return (catchFun == null
      ? Result.try(() => this.map(tryFun))
      : Result.try(() => this.map(tryFun), catchFun)
    ).flatMap((it) => it);
  }
  flatMap<U, F>(neverThrowFun: (value: V) => Result<U, F>): Result<U, E | F> {
    this.assertsThisIsResult();
    return this.isSuccess() ? neverThrowFun(this.value) : this.castValue();
  }
  flatMapAsync<U, F>(
    tryFun: (value: V) => Result<U, F> | AsyncResult<U, F>
  ): AsyncResult<U, unknown>;
  flatMapAsync<U, F, G>(
    tryFun: (value: V) => Result<U, F> | AsyncResult<U, F>,
    catchFun: (error: unknown) => G
  ): AsyncResult<U, E | F | G>;
  flatMapAsync<U, F, G>(
    tryFun: (value: V) => Result<U, F> | AsyncResult<U, F>,
    catchFun?: (error: unknown) => G
  ): AsyncResult<U, E | F | G | unknown> {
    this.assertsThisIsResult();
    if (this.isFailure()) return AsyncResult.of(this.castValue());
    try {
      const result = tryFun(this.value);
      return Result.isResult(result) ? AsyncResult.of(result) : result;
    } catch (error: unknown) {
      return catchFun == null
        ? AsyncResult.failure(error)
        : AsyncResult.failure(catchFun(error));
    }
  }
  tryFlatMap<U, F>(tryFun: (value: V) => Result<U, F>): Result<U, unknown>;
  tryFlatMap<U, F, G>(
    tryFun: (value: V) => Result<U, F>,
    catchFun: (error: unknown) => G
  ): Result<U, E | F | G>;
  tryFlatMap<U, F, G>(
    tryFun: (value: V) => Result<U, F>,
    catchFun?: (error: unknown) => G
  ): Result<U, E | F | G | unknown> {
    return (catchFun == null
      ? Result.try(() => this.flatMap(tryFun))
      : Result.try(() => this.flatMap(tryFun), catchFun)
    ).flatMap((it) => it);
  }
  recover(neverThrowFun: (error: E) => V): Result<V, never> {
    this.assertsThisIsResult();
    return this.isFailure()
      ? Result.success(neverThrowFun(this.error))
      : this.castError();
  }
  recoverAsync<F>(
    tryFun: (error: E) => V | Promise<V>
  ): AsyncResult<V, unknown>;
  recoverAsync<F>(
    tryFun: (error: E) => V | Promise<V>,
    catchFun: (error: unknown) => F
  ): AsyncResult<V, F>;
  recoverAsync<F>(
    tryFun: (error: E) => V | Promise<V>,
    catchFun?: (error: unknown) => F
  ): AsyncResult<V, F | unknown> {
    this.assertsThisIsResult();
    const f = async () => {
      this.assertsThisIsResult();
      return this.isSuccess() ? this.value : tryFun(this.error);
    };
    return catchFun == null ? AsyncResult.try(f) : AsyncResult.try(f, catchFun);
  }
  tryRecover(tryFun: (error: E) => V): Result<V, unknown>;
  tryRecover<F>(
    tryFun: (error: E) => V,
    catchFun: (error: unknown) => F
  ): Result<V, F>;
  tryRecover<F>(
    tryFun: (error: E) => V,
    catchFun?: (error: unknown) => F
  ): Result<V, F | unknown> {
    return (catchFun == null
      ? Result.try(() => this.recover(tryFun))
      : Result.try(() => this.recover(tryFun), catchFun)
    ).flatMap((it) => it);
  }
  flatRecover<F>(neverThrowFun: (error: E) => Result<V, F>): Result<V, F> {
    this.assertsThisIsResult();
    return this.isFailure() ? neverThrowFun(this.error) : this.castError();
  }
  flatRecoverAsync<F>(
    tryFun: (error: E) => Result<V, F> | AsyncResult<V, F>
  ): AsyncResult<V, unknown>;
  flatRecoverAsync<F, G>(
    tryFun: (error: E) => Result<V, F> | AsyncResult<V, F>,
    catchFun: (error: unknown) => G
  ): AsyncResult<V, F | G>;
  flatRecoverAsync<F, G>(
    tryFun: (error: E) => Result<V, F> | AsyncResult<V, F>,
    catchFun?: (error: unknown) => G
  ): AsyncResult<V, F | G | unknown> {
    this.assertsThisIsResult();
    if (this.isSuccess()) return AsyncResult.of(this);
    try {
      const result = tryFun(this.error);
      return Result.isResult(result) ? AsyncResult.of(result) : result;
    } catch (error: unknown) {
      return catchFun == null
        ? AsyncResult.failure(error)
        : AsyncResult.failure(catchFun(error));
    }
  }
  tryFlatRecover<F>(tryFun: (error: E) => Result<V, F>): Result<V, unknown>;
  tryFlatRecover<F, G>(
    tryFun: (error: E) => Result<V, F>,
    catchFun: (error: unknown) => G
  ): Result<V, F | G>;
  tryFlatRecover<F, G>(
    tryFun: (error: E) => Result<V, F>,
    catchFun?: (error: unknown) => G
  ): Result<V, F | G | unknown> {
    return (catchFun == null
      ? Result.try(() => this.flatRecover(tryFun))
      : Result.try(() => this.flatRecover(tryFun), catchFun)
    ).flatMap((it) => it);
  }
  mapError<F>(f: (error: E) => F): Result<V, F> {
    this.assertsThisIsResult();
    return this.isFailure() ? Result.failure(f(this.error)) : this.castError();
  }
}

export class Success<V, E> extends AbstractResult<V, E> {
  constructor(readonly value: V) {
    super();
  }
  readonly error = undefined;
  isSuccess(): this is Success<V, E> {
    return true;
  }
  isFailure(): this is Failure<V, E> {
    return false;
  }
  castError<F>(): Success<V, F> {
    return (this as any) as Success<V, F>;
  }
}

export class Failure<V, E> extends AbstractResult<V, E> {
  constructor(readonly error: E) {
    super();
  }
  readonly value = undefined;
  isSuccess(): this is Success<V, E> {
    return false;
  }
  isFailure(): this is Failure<V, E> {
    return true;
  }
  castValue<U>(): Failure<U, E> {
    return (this as any) as Failure<U, E>;
  }
}

export type Result<V, E> = Success<V, E> | Failure<V, E>;
