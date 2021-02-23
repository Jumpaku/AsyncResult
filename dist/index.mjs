import { BaseError } from 'make-error-cause';

class Some {
    constructor(value) {
        this.value = value;
        this.length = 1;
        this[0] = this.value;
        this[Symbol.iterator] = () => {
            const value = this.value;
            return (function* () {
                yield value;
            })();
        };
    }
    isSome() {
        return true;
    }
    isNone() {
        return false;
    }
    flatMap(f) {
        return f(this.value);
    }
    map(f) {
        return new Some(f(this.value));
    }
    orDefault(value) {
        return this.value;
    }
    orBuild(f) {
        return this.value;
    }
    orThrow(f) {
        return this.value;
    }
    orNull() {
        return this.value;
    }
    orUndefined() {
        return this.value;
    }
    takeIf(f) {
        return f(this.value) ? this : none();
    }
    takeIfNotNull() {
        return nonNull(this.value);
    }
    ifPresent(f) {
        f(this.value);
        return this;
    }
    ifAbsent(f) {
        return this;
    }
    and(other) {
        return other;
    }
    or(other) {
        return this;
    }
}
class None {
    constructor() {
        this.length = 0;
        this[Symbol.iterator] = () => (function* () { })();
    }
    isSome() {
        return false;
    }
    isNone() {
        return true;
    }
    flatMap(f) {
        return None.instance;
    }
    map(f) {
        return None.instance;
    }
    orDefault(value) {
        return value;
    }
    orBuild(f) {
        return f();
    }
    orThrow(f) {
        throw f != null ? f() : new Error("Option is None.");
    }
    orNull() {
        return null;
    }
    orUndefined() {
        return undefined;
    }
    takeIf(f) {
        return this;
    }
    takeIfNotNull() {
        return None.instance;
    }
    ifPresent(f) {
        return this;
    }
    ifAbsent(f) {
        f();
        return this;
    }
    and(other) {
        return this;
    }
    or(other) {
        return other;
    }
}
None.instance = new None();
function none() {
    return None.instance;
}
function some(value) {
    return new Some(value);
}
function nonNull(nullable) {
    return ((a) => a != null)(nullable)
        ? some(nullable)
        : none();
}

class AsyncResult {
    constructor(promise) {
        this.promise = promise;
    }
    static of(result, catchFun) {
        if (Result.isResult(result))
            return new AsyncResult(Promise.resolve(result));
        return catchFun == null
            ? new AsyncResult(result.catch((error) => Result.failure(error)))
            : new AsyncResult(result.catch((error) => Result.failure(catchFun(error))));
    }
    static success(v) {
        return AsyncResult.of(Result.success(v));
    }
    static failure(e) {
        return AsyncResult.of(Result.failure(e));
    }
    static try(tryFun, catchFun) {
        const promise = new Promise((resolve, reject) => {
            try {
                resolve(tryFun());
            }
            catch (error) {
                reject(error);
            }
        }).then(Result.success);
        return catchFun == null
            ? AsyncResult.of(promise)
            : AsyncResult.of(promise, catchFun);
    }
    then(onfulfilled, onrejected) {
        return this.promise.then(onfulfilled, onrejected);
    }
    match(onSuccess, onFailure) {
        return this.promise.then((result) => result.match(onSuccess, onFailure));
    }
    value() {
        return this.promise.then((r) => r.value);
    }
    error() {
        return this.promise.then((r) => r.error);
    }
    orNull() {
        return this.promise.then((r) => r.orNull());
    }
    orUndefined() {
        return this.promise.then((r) => r.orUndefined());
    }
    orReject(f) {
        return this.promise.then((r) => (f == null ? r.orThrow() : r.orThrow(f)));
    }
    orDefault(value) {
        return this.promise.then((r) => r.orDefault(value));
    }
    orRecover(neverThrowFun) {
        return this.promise.then((r) => r.orRecover(neverThrowFun));
    }
    onSuccess(neverThrowFun) {
        this.promise.then((r) => r.onSuccess(neverThrowFun));
        return this;
    }
    onFailure(neverThrowFun) {
        this.promise.then((r) => r.onFailure(neverThrowFun));
        return this;
    }
    and(other) {
        return new AsyncResult(this.promise.then((r0) => other.promise.then((r1) => r0.and(r1))));
    }
    or(other) {
        return new AsyncResult(this.promise.then((r0) => other.promise.then((r1) => r0.or(r1))));
    }
    map(neverThrowFun) {
        return new AsyncResult(this.promise.then((result) => result.map(neverThrowFun)));
    }
    tryMap(tryFun, catchFun) {
        return (catchFun == null
            ? AsyncResult.try(() => this.promise.then((it) => it.tryMap(tryFun)))
            : AsyncResult.try(() => this.promise.then((it) => it.tryMap(tryFun, catchFun)), catchFun)).flatMap((it) => AsyncResult.of(it));
    }
    flatMap(neverThrowFun) {
        const promise = new Promise(async (resolve) => {
            (await this.promise)
                .onSuccess((value) => resolve(neverThrowFun(value).promise))
                .onFailure((error) => resolve(Result.failure(error)));
        });
        return new AsyncResult(promise);
    }
    tryFlatMap(tryFun, catchFun) {
        if (catchFun == null) {
            const promise = this.promise
                .then(async (r) => r.isFailure() ? r.castValue() : tryFun(r.value).promise)
                .catch((error) => Result.failure(error));
            return AsyncResult.of(promise);
        }
        else {
            const promise = this.promise
                .then(async (r) => r.isFailure() ? r.castValue() : tryFun(r.value).promise)
                .catch((error) => Result.failure(catchFun(error)));
            return AsyncResult.of(promise);
        }
    }
    recover(neverThrowFun) {
        return new AsyncResult(this.promise.then((result) => result.recover(neverThrowFun)));
    }
    tryRecover(tryFun, catchFun) {
        return catchFun == null
            ? AsyncResult.of(this.match(Result.success, (e) => Result.try(() => tryFun(e))))
            : AsyncResult.of(this.match(Result.success, (e) => Result.try(() => tryFun(e), catchFun)));
    }
    flatRecover(neverThrowFun) {
        const promise = new Promise(async (resolve) => {
            (await this.promise)
                .onSuccess((value) => resolve(Result.success(value)))
                .onFailure((error) => resolve(neverThrowFun(error).promise));
        });
        return new AsyncResult(promise);
    }
    tryFlatRecover(tryFun, catchFun) {
        const promise = new Promise(async (resolve) => {
            (await this.promise)
                .onSuccess((value) => resolve(Result.success(value)))
                .onFailure((error) => {
                try {
                    resolve(tryFun(error).promise);
                }
                catch (e) {
                    if (catchFun == null)
                        resolve(Result.failure(e));
                    else
                        resolve(Result.failure(catchFun(e)));
                }
            });
        });
        return new AsyncResult(promise);
    }
}

class ResultError extends BaseError {
    constructor(error) {
        super(error instanceof Error ? error.message : "", error instanceof Error ? error : undefined);
        this.name = "ResultError";
        this.detail = error;
    }
}
const Result = {
    success(value) {
        return new Success(value);
    },
    failure(error) {
        return new Failure(error);
    },
    try: (tryFun, catchFun) => {
        try {
            return Result.success(tryFun());
        }
        catch (error) {
            return catchFun == null
                ? Result.failure(error)
                : Result.failure(catchFun(error));
        }
    },
    isResult(obj) {
        return obj instanceof AbstractResult;
    },
};
class AbstractResult {
    assertsThisIsResult() {
        if (!this.isSuccess() && !this.isFailure())
            throw new Error();
    }
    match(onSuccess, onFailure) {
        this.assertsThisIsResult();
        return this.isSuccess() ? onSuccess(this.value) : onFailure(this.error);
    }
    orDefault(value) {
        return this.isSuccess() ? this.value : value;
    }
    orRecover(f) {
        this.assertsThisIsResult();
        return this.isSuccess() ? this.value : f(this.error);
    }
    orThrow(f) {
        this.assertsThisIsResult();
        if (this.isFailure())
            throw f != null ? f(this.error) : new ResultError(this.error);
        return this.value;
    }
    orNull() {
        return this.isSuccess() ? this.value : null;
    }
    orUndefined() {
        return this.isSuccess() ? this.value : undefined;
    }
    onSuccess(f) {
        if (this.isSuccess())
            f(this.value);
        this.assertsThisIsResult();
        return this;
    }
    onFailure(f) {
        this.assertsThisIsResult();
        if (this.isFailure())
            f(this.error);
        return this;
    }
    and(other) {
        return this.isFailure() ? this : other;
    }
    or(other) {
        return this.isSuccess() ? this : other;
    }
    map(neverThrowFun) {
        this.assertsThisIsResult();
        return this.isSuccess()
            ? Result.success(neverThrowFun(this.value))
            : this.castValue();
    }
    mapAsync(tryFun, catchFun) {
        return catchFun == null
            ? this.match((v) => AsyncResult.try(() => tryFun(v)), (e) => AsyncResult.failure(e))
            : this.match((v) => AsyncResult.try(() => tryFun(v), catchFun), (e) => AsyncResult.failure(e));
    }
    tryMap(tryFun, catchFun) {
        return (catchFun == null
            ? Result.try(() => this.map(tryFun))
            : Result.try(() => this.map(tryFun), catchFun)).flatMap((it) => it);
    }
    flatMap(neverThrowFun) {
        this.assertsThisIsResult();
        return this.isSuccess() ? neverThrowFun(this.value) : this.castValue();
    }
    flatMapAsync(tryFun, catchFun) {
        this.assertsThisIsResult();
        if (this.isFailure())
            return AsyncResult.of(this.castValue());
        try {
            const result = tryFun(this.value);
            return Result.isResult(result) ? AsyncResult.of(result) : result;
        }
        catch (error) {
            return catchFun == null
                ? AsyncResult.failure(error)
                : AsyncResult.failure(catchFun(error));
        }
    }
    tryFlatMap(tryFun, catchFun) {
        return (catchFun == null
            ? Result.try(() => this.flatMap(tryFun))
            : Result.try(() => this.flatMap(tryFun), catchFun)).flatMap((it) => it);
    }
    recover(neverThrowFun) {
        this.assertsThisIsResult();
        return this.isFailure()
            ? Result.success(neverThrowFun(this.error))
            : this.castError();
    }
    recoverAsync(tryFun, catchFun) {
        this.assertsThisIsResult();
        const f = async () => {
            this.assertsThisIsResult();
            return this.isSuccess() ? this.value : tryFun(this.error);
        };
        return catchFun == null ? AsyncResult.try(f) : AsyncResult.try(f, catchFun);
    }
    tryRecover(tryFun, catchFun) {
        return (catchFun == null
            ? Result.try(() => this.recover(tryFun))
            : Result.try(() => this.recover(tryFun), catchFun)).flatMap((it) => it);
    }
    flatRecover(neverThrowFun) {
        this.assertsThisIsResult();
        return this.isFailure() ? neverThrowFun(this.error) : this.castError();
    }
    flatRecoverAsync(tryFun, catchFun) {
        this.assertsThisIsResult();
        if (this.isSuccess())
            return AsyncResult.of(this);
        try {
            const result = tryFun(this.error);
            return Result.isResult(result) ? AsyncResult.of(result) : result;
        }
        catch (error) {
            return catchFun == null
                ? AsyncResult.failure(error)
                : AsyncResult.failure(catchFun(error));
        }
    }
    tryFlatRecover(tryFun, catchFun) {
        return (catchFun == null
            ? Result.try(() => this.flatRecover(tryFun))
            : Result.try(() => this.flatRecover(tryFun), catchFun)).flatMap((it) => it);
    }
    mapError(f) {
        this.assertsThisIsResult();
        return this.isFailure() ? Result.failure(f(this.error)) : this.castError();
    }
}
class Success extends AbstractResult {
    constructor(value) {
        super();
        this.value = value;
        this.error = undefined;
    }
    isSuccess() {
        return true;
    }
    isFailure() {
        return false;
    }
    castError() {
        return this;
    }
}
class Failure extends AbstractResult {
    constructor(error) {
        super();
        this.error = error;
        this.value = undefined;
    }
    isSuccess() {
        return false;
    }
    isFailure() {
        return true;
    }
    castValue() {
        return this;
    }
}

export { AsyncResult, Failure, Result, ResultError, Success, nonNull, none, some };
//# sourceMappingURL=index.mjs.map
