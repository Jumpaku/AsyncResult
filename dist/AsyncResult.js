import { Result } from "./Result";
export class AsyncResult {
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
//# sourceMappingURL=AsyncResult.js.map