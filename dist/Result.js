import { BaseError } from "make-error-cause";
import { AsyncResult } from "./AsyncResult";
export class ResultError extends BaseError {
    constructor(error) {
        super(error instanceof Error ? error.message : "", error instanceof Error ? error : undefined);
        this.name = "ResultError";
        this.detail = error;
    }
}
export const Result = {
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
export class Success extends AbstractResult {
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
export class Failure extends AbstractResult {
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
//# sourceMappingURL=Result.js.map