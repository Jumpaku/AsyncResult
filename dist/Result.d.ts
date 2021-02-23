import { BaseError } from "make-error-cause";
import { AsyncResult } from "./AsyncResult";
export declare class ResultError<E> extends BaseError {
    readonly name: string;
    readonly detail: E;
    constructor(error: E);
}
interface ResultTry {
    <V>(tryFun: () => V): Result<V, unknown>;
    <V, E>(tryFun: () => V, catchFun: (error: unknown) => E): Result<V, E>;
}
export declare const Result: {
    success: <V>(value: V) => Result<V, never>;
    failure: <E>(error: E) => Result<never, E>;
    try: ResultTry;
    isResult: <V, E>(obj: unknown) => obj is Result<V, E>;
};
declare abstract class AbstractResult<V, E> {
    private assertsThisIsResult;
    abstract isSuccess(): this is Success<V, E>;
    abstract isFailure(): this is Failure<V, E>;
    match<X, Y>(onSuccess: (value: V) => X, onFailure: (error: E) => Y): X | Y;
    orDefault(value: V): V;
    orRecover(f: (error: E) => V): V;
    orThrow<F>(f?: (e: E) => F): V;
    orNull(): V | null;
    orUndefined(): V | undefined;
    onSuccess(f: (value: V) => void): Result<V, E>;
    onFailure(f: (error: E) => void): Result<V, E>;
    and<U, F>(other: Result<U, F>): Result<V | U, E | F>;
    or<U, F>(other: Result<U, F>): Result<V | U, E | F>;
    map<U>(neverThrowFun: (value: V) => U): Result<U, E>;
    mapAsync<U>(tryFun: (value: V) => U | Promise<U>): AsyncResult<U, unknown>;
    mapAsync<U, F>(tryFun: (value: V) => U | Promise<U>, catchFun: (error: unknown) => F): AsyncResult<U, F>;
    tryMap<U>(tryFun: (value: V) => U): Result<U, unknown>;
    tryMap<U, F>(tryFun: (value: V) => U, catchFun: (error: unknown) => F): Result<U, E | F>;
    flatMap<U, F>(neverThrowFun: (value: V) => Result<U, F>): Result<U, E | F>;
    flatMapAsync<U, F>(tryFun: (value: V) => Result<U, F> | AsyncResult<U, F>): AsyncResult<U, unknown>;
    flatMapAsync<U, F, G>(tryFun: (value: V) => Result<U, F> | AsyncResult<U, F>, catchFun: (error: unknown) => G): AsyncResult<U, E | F | G>;
    tryFlatMap<U, F>(tryFun: (value: V) => Result<U, F>): Result<U, unknown>;
    tryFlatMap<U, F, G>(tryFun: (value: V) => Result<U, F>, catchFun: (error: unknown) => G): Result<U, E | F | G>;
    recover(neverThrowFun: (error: E) => V): Result<V, never>;
    recoverAsync<F>(tryFun: (error: E) => V | Promise<V>): AsyncResult<V, unknown>;
    recoverAsync<F>(tryFun: (error: E) => V | Promise<V>, catchFun: (error: unknown) => F): AsyncResult<V, F>;
    tryRecover(tryFun: (error: E) => V): Result<V, unknown>;
    tryRecover<F>(tryFun: (error: E) => V, catchFun: (error: unknown) => F): Result<V, F>;
    flatRecover<F>(neverThrowFun: (error: E) => Result<V, F>): Result<V, F>;
    flatRecoverAsync<F>(tryFun: (error: E) => Result<V, F> | AsyncResult<V, F>): AsyncResult<V, unknown>;
    flatRecoverAsync<F, G>(tryFun: (error: E) => Result<V, F> | AsyncResult<V, F>, catchFun: (error: unknown) => G): AsyncResult<V, F | G>;
    tryFlatRecover<F>(tryFun: (error: E) => Result<V, F>): Result<V, unknown>;
    tryFlatRecover<F, G>(tryFun: (error: E) => Result<V, F>, catchFun: (error: unknown) => G): Result<V, F | G>;
    mapError<F>(f: (error: E) => F): Result<V, F>;
}
export declare class Success<V, E> extends AbstractResult<V, E> {
    readonly value: V;
    constructor(value: V);
    readonly error: undefined;
    isSuccess(): this is Success<V, E>;
    isFailure(): this is Failure<V, E>;
    castError<F>(): Success<V, F>;
}
export declare class Failure<V, E> extends AbstractResult<V, E> {
    readonly error: E;
    constructor(error: E);
    readonly value: undefined;
    isSuccess(): this is Success<V, E>;
    isFailure(): this is Failure<V, E>;
    castValue<U>(): Failure<U, E>;
}
export declare type Result<V, E> = Success<V, E> | Failure<V, E>;
export {};
