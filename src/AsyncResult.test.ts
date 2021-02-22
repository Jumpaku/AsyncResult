import { describe, expect, test } from "@jest/globals";
import { AsyncResult } from "./AsyncResult";
import { Result } from "./Result";

describe("AsyncResult Creation", () => {
  describe("of", () => {
    const resolvedSuccess = Promise.resolve(Result.success(1));
    const resolvedFailure = Promise.resolve(Result.failure("Error"));
    const rejected = Promise.reject("Error2");
    const catcher = () => -1;
    it("succeeds with success", async () => {
      const { value, error } = await AsyncResult.of(Result.success(1)).promise;
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
    });
    it("fails with failure", async () => {
      const { value, error } = await AsyncResult.of(Result.failure("Error"))
        .promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
    it("succeeds with resolved success", async () => {
      const { value, error } = await AsyncResult.of(resolvedSuccess).promise;
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
    });
    it("succeeds with resolved success and catcher", async () => {
      const { value, error } = await AsyncResult.of(resolvedSuccess, catcher)
        .promise;
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
    });
    it("fails with resolved failure", async () => {
      const { value, error } = await AsyncResult.of(resolvedFailure).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
    it("fails with resolved success and catcher", async () => {
      const { value, error } = await AsyncResult.of(resolvedFailure, catcher)
        .promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
    it("fails with rejected", async () => {
      const { value, error } = await AsyncResult.of(rejected).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error2");
    });
    it("fails with rejected and catcher", async () => {
      const { value, error } = await AsyncResult.of(rejected, catcher).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual(-1);
    });
  });
  test("success", async () => {
    const { value, error } = await AsyncResult.success(1).promise;
    expect(value).toEqual(1);
    expect(error).toEqual(undefined);
  });
  test("failure", async () => {
    const { value, error } = await AsyncResult.failure("Error").promise;
    expect(value).toEqual(undefined);
    expect(error).toEqual("Error");
  });
  describe("try", () => {
    const trier = () => 1;
    const trierAsync = async () => 1;
    const thrower = () => {
      throw "Error";
    };
    const throwerAsync = async () => {
      throw "Error";
    };
    const catcher = (e: unknown) => -1;
    it("succeeds with trier", async () => {
      const { value, error } = await AsyncResult.try(trier).promise;
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
    });
    it("succeeds with trier and catcher", async () => {
      const { value, error } = await AsyncResult.try(trier, catcher).promise;
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
    });
    it("succeeds with trierAsync", async () => {
      const { value, error } = await AsyncResult.try(trierAsync).promise;
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
    });
    it("succeeds with trierAsync and catcher", async () => {
      const { value, error } = await AsyncResult.try(trierAsync, catcher)
        .promise;
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
    });
    it("fails with thrower", async () => {
      const { value, error } = await AsyncResult.try(thrower).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
    it("fails with thrower and catcher", async () => {
      const { value, error } = await AsyncResult.try(thrower, catcher).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual(-1);
    });
    it("fails with throwerAsync", async () => {
      const { value, error } = await AsyncResult.try(throwerAsync).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
    it("fails with throwerAsync and catcher", async () => {
      const { value, error } = await AsyncResult.try(throwerAsync, catcher)
        .promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual(-1);
    });
  });
});

describe("Methods when resolved as success", () => {
  const a = AsyncResult.success(1);
  test("match", async () => {
    expect(
      await a.match(
        () => 2,
        () => "X"
      )
    ).toEqual(2);
  });
  test("value", async () => {
    expect(await a.value()).toEqual(1);
  });
  test("error", async () => {
    expect(await a.error()).toEqual(undefined);
  });
  test("orNull", async () => {
    expect(await a.orNull()).toEqual(1);
  });
  test("orUndefined", async () => {
    expect(await a.orUndefined()).toEqual(1);
  });
  test("orReject", async () => {
    expect(await a.orReject()).toEqual(1);
  });
  test("orDefault", async () => {
    expect(await a.orDefault(0)).toEqual(1);
  });
  test("orRecover", async () => {
    expect(await a.orRecover(() => 0)).toEqual(1);
  });
  test("onSuccess", async () => {
    let x = 0;
    await a.onSuccess((v) => {
      x = v;
    }).promise;
    expect(x).toEqual(1);
  });
  test("onFailure", async () => {
    let x = 0;
    await a.onFailure((v) => {
      x = v;
    }).promise;
    expect(x).toEqual(0);
  });
  describe("and", () => {
    it("succeeds with success", async () => {
      const { value, error } = await a.and(AsyncResult.success(2)).promise;
      expect(value).toEqual(2);
      expect(error).toEqual(undefined);
    });
    it("fails with failure", async () => {
      const { value, error } = await a.and(AsyncResult.failure("Error"))
        .promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
  });
  describe("or", () => {
    it("succeeds with success", async () => {
      const { value, error } = await a.or(AsyncResult.success(2)).promise;
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
    });
    it("succeeds with failure", async () => {
      const { value, error } = await a.or(AsyncResult.failure("Error")).promise;
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
    });
  });
  describe("then", () => {
    it("resolves with (it) => it.value", () => {
      const actual = a.then((it) => it.value);
      return expect(actual).resolves.toEqual(1);
    });
    it("resolves with (it) => it.error", () => {
      const actual = a.then((it) => it.error);
      return expect(actual).resolves.toEqual(undefined);
    });
    it("rejects with (it) => { throw 'Error'; }", () => {
      const actual = a.then(() => {
        throw "Error";
      });
      return expect(actual).rejects.toEqual("Error");
    });
    it("resolves with (it) => it.value and () => -1", () => {
      const actual = a.then(
        (it) => it.value,
        () => -1
      );
      return expect(actual).resolves.toEqual(1);
    });
    it("resolves with (it) => it.error and () => -1", () => {
      const actual = a.then(
        (it) => it.error,
        () => -1
      );
      return expect(actual).resolves.toEqual(undefined);
    });
    it("rejects with (it) => { throw 'Error'; } and () => -1", () => {
      const actual = a.then(
        () => {
          throw "Error";
        },
        () => -1
      );
      return expect(actual).rejects.toEqual("Error");
    });
    it("resolves without augments", async () => {
      const actual: Result<number, never> = await a.then();
      expect(actual.value).toEqual(1);
      expect(actual.error).toEqual(undefined);
    });
  });
  test("map", async () => {
    const { value, error } = await a.map((v) => v + 1).promise;
    expect(value).toEqual(2);
    expect(error).toEqual(undefined);
  });
  describe("tryMap", () => {
    const mapper = (v: number) => v + 1;
    const thrower = (v: number) => {
      throw "Error2";
      return v + 1;
    };
    const catcher = (e: unknown) => -1;
    it("succeeds with mapper", async () => {
      const { value, error } = await a.tryMap(mapper).promise;
      expect(value).toEqual(2);
      expect(error).toEqual(undefined);
    });
    it("succeeds with mapper and catcher", async () => {
      const { value, error } = await a.tryMap(mapper, catcher).promise;
      expect(value).toEqual(2);
      expect(error).toEqual(undefined);
    });
    it("fails with thrower", async () => {
      const { value, error } = await a.tryMap(thrower).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error2");
    });
    it("fails with thrower and catcher", async () => {
      const { value, error } = await a.tryMap(thrower, catcher).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual(-1);
    });
  });
  describe("flatMap", () => {
    it("succeeds", async () => {
      const { value, error } = await a.flatMap((v) =>
        AsyncResult.success(v + 1)
      ).promise;
      expect(value).toEqual(2);
      expect(error).toEqual(undefined);
    });
    it("fails", async () => {
      const { value, error } = await a.flatMap(() =>
        AsyncResult.failure("Next Error")
      ).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Next Error");
    });
  });
  describe("tryFlatMap", () => {
    const success = (v: number) => AsyncResult.success(v + 1);
    const failure = (v: number) => AsyncResult.failure("Error2");
    const thrower = () => {
      throw "Error3";
    };
    const catcher = (v: unknown) => -1;
    it("maps with success", async () => {
      const { value, error } = await a.tryFlatMap(success).promise;
      expect(value).toEqual(2);
      expect(error).toEqual(undefined);
    });
    it("maps with success and catcher", async () => {
      const { value, error } = await a.tryFlatMap(success, catcher).promise;
      expect(value).toEqual(2);
      expect(error).toEqual(undefined);
    });
    it("fails with failure", async () => {
      const { value, error } = await a.tryFlatMap(failure).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error2");
    });
    it("fails with failure and catcher", async () => {
      const { value, error } = await a.tryFlatMap(failure, catcher).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error2");
    });
    it("fails with thrower", async () => {
      const { value, error } = await a.tryFlatMap(thrower).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error3");
    });
    it("fails with thrower and catcher", async () => {
      const { value, error } = await a.tryFlatMap(thrower, catcher).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual(-1);
    });
  });
  test("recover", async () => {
    const { value, error } = await a.recover(() => 2).promise;
    expect(value).toEqual(1);
    expect(error).toEqual(undefined);
  });
  describe("tryRecover", () => {
    const recover = () => 0;
    const thrower = () => {
      throw "Error2";
    };
    const catcher = () => -1;
    it("leaves it as it is with recover", async () => {
      const { value, error } = await a.tryRecover(recover).promise;
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
    });
    it("leaves it as it is with recover and catcher", async () => {
      const { value, error } = await a.tryRecover(recover, catcher).promise;
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
    });
    it("leaves it as it is with thrower", async () => {
      const { value, error } = await a.tryRecover(thrower).promise;
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
    });
    it("leaves it as it is with thrower and catcher", async () => {
      const { value, error } = await a.tryRecover(thrower, catcher).promise;
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
    });
  });
  describe("flatRecover", () => {
    it("does nothing when source is success", async () => {
      const { value, error } = await a.flatRecover(() => AsyncResult.success(2))
        .promise;
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
    });
    it("does nothing even if recovery fails", async () => {
      const { value, error } = await a.flatRecover(() =>
        AsyncResult.failure("Error")
      ).promise;
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
    });
  });
  describe("tryFlatRecover", () => {
    const success = () => AsyncResult.success(0);
    const failure = () => AsyncResult.failure("Error2");
    const thrower = () => {
      throw "Error3";
    };
    const catcher = () => -1;
    it("leaves success as it is with success", async () => {
      const { value, error } = await a.tryFlatRecover(success).promise;
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
    });
    it("leaves success as it is with success with catcher", async () => {
      const { value, error } = await a.tryFlatRecover(success, catcher).promise;
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
    });
    it("leaves success as it is with failure", async () => {
      const { value, error } = await a.tryFlatRecover(failure).promise;
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
    });
    it("leaves success as it is with failure with catcher", async () => {
      const { value, error } = await a.tryFlatRecover(failure, catcher).promise;
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
    });
    it("leaves success as it is with thrower", async () => {
      const { value, error } = await a.tryFlatRecover(thrower).promise;
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
    });
    it("leaves success as it is with thrower with catcher", async () => {
      const { value, error } = await a.tryFlatRecover(thrower, catcher).promise;
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
    });
  });
});

describe("Methods when resolved as failure", () => {
  const a: AsyncResult<number, string> = AsyncResult.failure("Error");
  test("match", async () => {
    expect(
      await a.match(
        () => 2,
        () => "X"
      )
    ).toEqual("X");
  });
  test("value", async () => {
    expect(await a.value()).toEqual(undefined);
  });
  test("error", async () => {
    expect(await a.error()).toEqual("Error");
  });
  test("orNull", async () => {
    expect(await a.orNull()).toEqual(null);
  });
  test("orUndefined", async () => {
    expect(await a.orUndefined()).toEqual(undefined);
  });
  test("orReject", async () => {
    await expect(
      a.orReject(() => {
        throw "Error2";
      })
    ).rejects.toEqual("Error2");
  });
  test("orDefault", async () => {
    expect(await a.orDefault(0)).toEqual(0);
  });
  test("orRecover", async () => {
    expect(await a.orRecover(() => 0)).toEqual(0);
  });
  test("onSuccess", async () => {
    let x = 0;
    await a.onSuccess((v) => {
      x = v;
    }).promise;
    expect(x).toEqual(0);
  });
  test("onFailure", async () => {
    let x: string | number = 0;
    await a.onFailure((v) => {
      x = v;
    }).promise;
    expect(x).toEqual("Error");
  });
  describe("and", () => {
    it("fails with success", async () => {
      const { value, error } = await a.and(AsyncResult.success(2)).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
    it("fails with failure", async () => {
      const { value, error } = await a.and(AsyncResult.failure("Error2"))
        .promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
  });
  describe("or", () => {
    it("succeeds with success", async () => {
      const { value, error } = await a.or(AsyncResult.success(2)).promise;
      expect(value).toEqual(2);
      expect(error).toEqual(undefined);
    });
    it("fails with failure", async () => {
      const { value, error } = await a.or(AsyncResult.failure("Error2"))
        .promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error2");
    });
  });
  describe("then", () => {
    it("resolves with (it) => it.value", () => {
      const actual = a.then((it) => it.value);
      return expect(actual).resolves.toEqual(undefined);
    });
    it("resolves with (it) => it.error", () => {
      const actual = a.then((it) => it.error);
      return expect(actual).resolves.toEqual("Error");
    });
    it("rejects with (it) => { throw 'Error'; }", () => {
      const actual = a.then(() => {
        throw "Error2";
      });
      return expect(actual).rejects.toEqual("Error2");
    });
    it("resolves with (it) => it.value and () => -1", () => {
      const actual = a.then(
        (it) => it.value,
        () => -1
      );
      return expect(actual).resolves.toEqual(undefined);
    });
    it("resolves with (it) => it.error and () => -1", () => {
      const actual = a.then(
        (it) => it.error,
        () => -1
      );
      return expect(actual).resolves.toEqual("Error");
    });
    it("rejects with (it) => { throw 'Error'; } and () => -1", () => {
      const actual = a.then(
        () => {
          throw "Error2";
        },
        () => -1
      );
      return expect(actual).rejects.toEqual("Error2");
    });
    it("resolves without augments", async () => {
      const actual: Result<number, never> = await a.then();
      expect(actual.value).toEqual(undefined);
      expect(actual.error).toEqual("Error");
    });
  });
  test("map", async () => {
    const { value, error } = await a.map((v) => `${v + 1}`).promise;
    expect(value).toEqual(undefined);
    expect(error).toEqual("Error");
  });
  describe("tryMap", () => {
    const mapper = (v: number) => v + 1;
    const thrower = (v: number) => {
      throw "Error2";
      return v + 1;
    };
    const catcher = (e: unknown) => -1;
    it("reaves failure as it is with mapper", async () => {
      const { value, error } = await a.tryMap(mapper).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
    it("reaves failure as it is with mapper and catcher", async () => {
      const { value, error } = await a.tryMap(mapper, catcher).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
    it("reaves failure as it is with thrower", async () => {
      const { value, error } = await a.tryMap(thrower).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
    it("reaves failure as it is with thrower and catcher", async () => {
      const { value, error } = await a.tryMap(thrower, catcher).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
  });
  describe("flatMap", () => {
    it("is already failed", async () => {
      const { value, error } = await a.flatMap((v) =>
        AsyncResult.success(v + 1)
      ).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
    it("has still previous error", async () => {
      const { value, error } = await a.flatMap(() =>
        AsyncResult.failure("Next Error")
      ).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
  });
  describe("tryFlatMap", () => {
    const success = (v: number) => AsyncResult.success(v + 1);
    const failure = (v: number) => AsyncResult.failure("Error2");
    const thrower = () => {
      throw "Error3";
    };
    const catcher = (v: unknown) => -1;
    it("leaves failure as it is with success", async () => {
      const { value, error } = await a.tryFlatMap(success).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
    it("leaves failure as it is with success and catcher", async () => {
      const { value, error } = await a.tryFlatMap(success, catcher).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
    it("leaves failure as it is with failure", async () => {
      const { value, error } = await a.tryFlatMap(failure).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
    it("leaves failure as it is with failure and catcher", async () => {
      const { value, error } = await a.tryFlatMap(failure, catcher).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
    it("leaves failure as it is with thrower", async () => {
      const { value, error } = await a.tryFlatMap(thrower).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
    it("leaves failure as it is with thrower and catcher", async () => {
      const { value, error } = await a.tryFlatMap(thrower, catcher).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
  });
  test("recover", async () => {
    const { value, error } = await a.recover(() => 2).promise;
    expect(value).toEqual(2);
    expect(error).toEqual(undefined);
  });
  describe("tryRecover", () => {
    const recover = () => 0;
    const thrower = () => {
      throw "Error2";
    };
    const catcher = () => -1;
    it("recovers with recover", async () => {
      const { value, error } = await a.tryRecover(recover).promise;
      expect(value).toEqual(0);
      expect(error).toEqual(undefined);
    });
    it("recovers with recover and catcher", async () => {
      const { value, error } = await a.tryRecover(recover, catcher).promise;
      expect(value).toEqual(0);
      expect(error).toEqual(undefined);
    });
    it("fails with thrower", async () => {
      const { value, error } = await a.tryRecover(thrower).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error2");
    });
    it("fails with thrower and catcher", async () => {
      const { value, error } = await a.tryRecover(thrower, catcher).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual(-1);
    });
  });
  describe("flatRecover", () => {
    it("succeeds with recovered value", async () => {
      const { value, error } = await a.flatRecover(() => AsyncResult.success(2))
        .promise;
      expect(value).toEqual(2);
      expect(error).toEqual(undefined);
    });
    it("fails with new error", async () => {
      const { value, error } = await a.flatRecover((e) =>
        AsyncResult.failure("Next Error")
      ).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Next Error");
    });
  });
});
