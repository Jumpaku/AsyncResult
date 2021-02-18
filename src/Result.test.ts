import { describe, expect, test, it } from "@jest/globals";
import { AsyncResult } from "./AsyncResult";
import { Result, ResultError } from "./Result";

describe("Generating Results", () => {
  test("success", () => {
    const { value, error } = Result.success(1);
    expect(value).toEqual(1);
    expect(error).toEqual(undefined);
  });
  test("failure", () => {
    const { value, error } = Result.failure("Error");
    expect(value).toEqual(undefined);
    expect(error).toEqual("Error");
  });
  describe("try", () => {
    it("generates success without catching", () => {
      const { value, error } = Result.try(() => 1);
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
    });
    it("generates success with catching", () => {
      const { value, error } = Result.try(
        () => 1,
        (e) => "Caught"
      );
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
    });
    it("generates failure with unknown error", () => {
      const { value, error } = Result.try(() => {
        throw "Error";
      });
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
    it("generates failure catching error", () => {
      const { value, error } = Result.try(
        () => {
          throw "Error";
        },
        (e) => "Caught"
      );
      expect(value).toEqual(undefined);
      expect(error).toEqual("Caught");
    });
  });
});

describe("Methods of Success", () => {
  const a = Result.try(
    () => 1,
    () => "Error"
  );
  test("isSuccess", () => {
    expect(a.isSuccess()).toEqual(true);
  });
  test("isFailure", () => {
    expect(a.isFailure()).toEqual(false);
  });
  test("match", () => {
    expect(
      a.match(
        () => 2,
        () => "X"
      )
    ).toEqual(2);
  });
  test("orDefault", () => {
    expect(a.orDefault(2)).toEqual(1);
  });
  test("orBuild", () => {
    expect(a.orRecover(() => 2)).toEqual(1);
  });
  test("orThrow", () => {
    expect(a.orThrow()).toEqual(1);
  });
  test("orThrow (Error given)", () => {
    expect(a.orThrow(() => new Error(""))).toEqual(1);
  });
  test("orNull", () => {
    expect(a.orNull()).toEqual(1);
  });
  test("orUndefined", () => {
    expect(a.orUndefined()).toEqual(1);
  });
  test("onSuccess", () => {
    let x = 0;
    a.onSuccess((v) => {
      x = 1;
    });
    expect(x).toEqual(1);
  });
  test("onFailure", () => {
    let x = 0;
    a.onFailure((e) => {
      x = 1;
    });
    expect(x).toEqual(0);
  });
  describe("and", () => {
    it("succeeds with success", () => {
      const { value, error } = a.and(Result.success(2));
      expect(value).toEqual(2);
      expect(error).toEqual(undefined);
    });
    it("fails with failure", () => {
      const { value, error } = a.and(Result.failure("Error"));
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
  });
  describe("or", () => {
    it("succeeds with success", () => {
      const { value, error } = a.or(Result.success(2));
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
    });
    it("succeeds with failure", () => {
      const { value, error } = a.or(Result.failure("Error"));
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
    });
  });
  test("map", () => {
    const { value, error } = a.map((v) => `${v + 1}`);
    expect(value).toEqual("2");
    expect(error).toEqual(undefined);
  });
  describe("mapAsync", () => {
    const mapper = (v: number) => v + 1;
    const mapperAsync = async (v: number) => v + 1;
    const thrower = (v: number) => {
      throw "Error";
      return v + 1;
    };
    const throwerAsync = async (v: number) => {
      throw "Error";
      return v + 1;
    };
    const catcher = (e: unknown) => -1;
    it("succeeds with mapper", async () => {
      const { value, error } = await a.mapAsync(mapper).promise;
      expect(value).toEqual(2);
      expect(error).toEqual(undefined);
    });
    it("succeeds with mapperAsync", async () => {
      const { value, error } = await a.mapAsync(mapperAsync).promise;
      expect(value).toEqual(2);
      expect(error).toEqual(undefined);
    });
    it("succeeds with mapper and catcher", async () => {
      const { value, error } = await a.mapAsync(mapper, catcher).promise;
      expect(value).toEqual(2);
      expect(error).toEqual(undefined);
    });
    it("succeeds with mapperAsync and catcher", async () => {
      const { value, error } = await a.mapAsync(mapperAsync, catcher).promise;
      expect(value).toEqual(2);
      expect(error).toEqual(undefined);
    });
    it("fails with thrower", async () => {
      const { value, error } = await a.mapAsync(thrower).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
    it("fails with throwerAsync", async () => {
      const { value, error } = await a.mapAsync(throwerAsync).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
    it("fails with thrower and catcher", async () => {
      const { value, error } = await a.mapAsync(thrower, catcher).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual(-1);
    });
    it("fails with throwerAsync and catcher", async () => {
      const { value, error } = await a.mapAsync(throwerAsync, catcher).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual(-1);
    });
  });
  describe("tryMap", () => {
    const mapper = (v: number) => v + 1;
    const thrower = (v: number) => {
      throw "Error";
      return v + 1;
    };
    const catcher = (e: unknown) => -1;
    it("maps with mapper", () => {
      const { value, error } = a.tryMap(mapper);
      expect(value).toEqual(2);
      expect(error).toEqual(undefined);
    });
    it("maps with mapper and catcher", () => {
      const { value, error } = a.tryMap(mapper, catcher);
      expect(value).toEqual(2);
      expect(error).toEqual(undefined);
    });
    it("fails with thrower", () => {
      const { value, error } = a.tryMap(thrower);
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
    it("fails with caught error if no error is thrown and caught", () => {
      const { value, error } = a.tryMap(thrower, catcher);
      expect(value).toEqual(undefined);
      expect(error).toEqual(-1);
    });
  });
  describe("flatMap", () => {
    it("successfully maps", () => {
      const { value, error } = a.flatMap((v) => Result.success(v + 1));
      expect(value).toEqual(2);
      expect(error).toEqual(undefined);
    });

    it("fails", () => {
      const { value, error } = a.flatMap(() => Result.failure("Next Error"));
      expect(value).toEqual(undefined);
      expect(error).toEqual("Next Error");
    });
  });
  describe("flatMapAsync", () => {
    const success = (v: number) => Result.success(v + 1);
    const successAAsync = (v: number) => AsyncResult.success(v + 1);
    const failure = (v: number) => Result.failure("Error2");
    const failureAsync = (v: number) => AsyncResult.failure("Error2");
    const thrower = (): Result<number, string> => {
      throw "Error3";
    };
    const throwerAsync = (): AsyncResult<number, string> => {
      throw "Error3";
    };
    const catcher = (v: unknown) => -1;
    it("maps with success", async () => {
      const { value, error } = await a.flatMapAsync(success).promise;
      expect(value).toEqual(2);
      expect(error).toEqual(undefined);
    });
    it("maps with successAAsync", async () => {
      const { value, error } = await a.flatMapAsync(successAAsync).promise;
      expect(value).toEqual(2);
      expect(error).toEqual(undefined);
    });
    it("maps with success and catcher", async () => {
      const { value, error } = await a.flatMapAsync(success, catcher).promise;
      expect(value).toEqual(2);
      expect(error).toEqual(undefined);
    });
    it("maps with successAAsync and catcher", async () => {
      const { value, error } = await a.flatMapAsync(successAAsync, catcher)
        .promise;
      expect(value).toEqual(2);
      expect(error).toEqual(undefined);
    });
    it("fails with failure", async () => {
      const { value, error } = await a.flatMapAsync(failure).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error2");
    });
    it("fails with failureAsync", async () => {
      const { value, error } = await a.flatMapAsync(failureAsync).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error2");
    });
    it("fails with failure and catcher", async () => {
      const { value, error } = await a.flatMapAsync(failure, catcher).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error2");
    });
    it("fails with failureAsync and catcher", async () => {
      const { value, error } = await a.flatMapAsync(failureAsync, catcher)
        .promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error2");
    });
    it("fails with thrower", async () => {
      const { value, error } = await a.flatMapAsync(thrower).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error3");
    });
    it("fails with throwerAsync", async () => {
      const { value, error } = await a.flatMapAsync(throwerAsync).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error3");
    });
    it("fails with thrower and catcher", async () => {
      const { value, error } = await a.flatMapAsync(thrower, catcher).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual(-1);
    });
    it("fails with throwerAsync and catcher", async () => {
      const { value, error } = await a.flatMapAsync(throwerAsync, catcher)
        .promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual(-1);
    });
  });
  describe("tryFlatMap", () => {
    const success = (v: number) => Result.success(v + 1);
    const failure = (v: number) => Result.failure("Error2");
    const thrower = () => {
      throw "Error3";
    };
    const catcher = (v: unknown) => -1;
    it("maps with success", () => {
      const { value, error } = a.tryFlatMap(success);
      expect(value).toEqual(2);
      expect(error).toEqual(undefined);
    });
    it("maps with success and catcher", () => {
      const { value, error } = a.tryFlatMap(success, catcher);
      expect(value).toEqual(2);
      expect(error).toEqual(undefined);
    });
    it("fails with failure", () => {
      const { value, error } = a.tryFlatMap(failure);
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error2");
    });
    it("fails with failure and catcher", () => {
      const { value, error } = a.tryFlatMap(failure, catcher);
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error2");
    });
    it("fails with thrower", () => {
      const { value, error } = a.tryFlatMap(thrower);
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error3");
    });
    it("fails with thrower and catcher", () => {
      const { value, error } = a.tryFlatMap(thrower, catcher);
      expect(value).toEqual(undefined);
      expect(error).toEqual(-1);
    });
  });
  test("recover", () => {
    const { value, error } = a.recover(() => 2);
    expect(value).toEqual(1);
    expect(error).toEqual(undefined);
  });
  describe("recoverAsync", () => {
    const recover = () => 0;
    const recoverAsync = async () => 0;
    const thrower = () => {
      throw "Error2";
    };
    const throwerAsync = async () => {
      throw "Error2";
    };
    const catcher = () => -1;
    it("leaves it as it is with recover", async () => {
      const { value, error } = await a.recoverAsync(recover).promise;
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
    });
    it("leaves it as it is with recoverAsync", async () => {
      const { value, error } = await a.recoverAsync(recoverAsync).promise;
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
    });
    it("leaves it as it is with recover and catcher", async () => {
      const { value, error } = await a.recoverAsync(recover, catcher).promise;
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
    });
    it("leaves it as it is with recoverAsync and catcher", async () => {
      const { value, error } = await a.recoverAsync(recoverAsync, catcher)
        .promise;
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
    });
    it("leaves it as it is with thrower", async () => {
      const { value, error } = await a.recoverAsync(thrower).promise;
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
    });
    it("leaves it as it is with throwerAsync", async () => {
      const { value, error } = await a.recoverAsync(throwerAsync).promise;
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
    });
    it("leaves it as it is with thrower and catcher", async () => {
      const { value, error } = await a.recoverAsync(thrower, catcher).promise;
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
    });
    it("leaves it as it is with throwerAsync and catcher", async () => {
      const { value, error } = await a.recoverAsync(throwerAsync, catcher)
        .promise;
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
    });
  });
  describe("tryRecover", () => {
    const recover = () => 0;
    const thrower = () => {
      throw "Error2";
    };
    const catcher = () => -1;
    it("leaves it as it is with recover", () => {
      const { value, error } = a.tryRecover(recover);
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
    });
    it("leaves it as it is with recover and catcher", () => {
      const { value, error } = a.tryRecover(recover, catcher);
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
    });
    it("leaves it as it is with thrower", () => {
      const { value, error } = a.tryRecover(thrower);
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
    });
    it("leaves it as it is with thrower and catcher", () => {
      const { value, error } = a.tryRecover(thrower, catcher);
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
    });
  });
  describe("flatRecover", () => {
    it("does nothing when source is success", () => {
      const { value, error } = a.flatRecover(() => Result.success(2));
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
    });
    it("does nothing even if recovery fails", () => {
      const { value, error } = a.flatRecover(() => Result.failure("Error"));
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
    });
  });
  describe("flatRecoverAsync", () => {
    const success = () => Result.success(0);
    const successAsync = () => AsyncResult.success(0);
    const failure = () => Result.failure("Error2");
    const failureAsync = () => AsyncResult.failure("Error2");
    const thrower = (): Result<number, string> => {
      throw "Error3";
    };
    const throwerAsync = (): AsyncResult<number, string> => {
      throw "Error3";
    };
    const catcher = () => -1;
    it("leaves success as it is with success", async () => {
      const { value, error } = await a.flatRecoverAsync(success).promise;
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
    });
    it("leaves success as it is with successAsync", async () => {
      const { value, error } = await a.flatRecoverAsync(successAsync).promise;
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
    });
    it("leaves success as it is with success with catcher", async () => {
      const { value, error } = await a.flatRecoverAsync(success, catcher)
        .promise;
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
    });
    it("leaves success as it is with successAsync with catcher", async () => {
      const { value, error } = await a.flatRecoverAsync(successAsync, catcher)
        .promise;
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
    });
    it("leaves success as it is with failure", async () => {
      const { value, error } = await a.flatRecoverAsync(failure).promise;
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
    });
    it("leaves success as it is with failureAsync", async () => {
      const { value, error } = await a.flatRecoverAsync(failureAsync).promise;
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
    });
    it("leaves success as it is with failure with catcher", async () => {
      const { value, error } = await a.flatRecoverAsync(failure, catcher)
        .promise;
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
    });
    it("leaves success as it is with failureAsync with catcher", async () => {
      const { value, error } = await a.flatRecoverAsync(failureAsync, catcher)
        .promise;
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
    });
    it("leaves success as it is with thrower", async () => {
      const { value, error } = await a.flatRecoverAsync(thrower).promise;
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
    });
    it("leaves success as it is with throwerAsync", async () => {
      const { value, error } = await a.flatRecoverAsync(throwerAsync).promise;
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
    });
    it("leaves success as it is with thrower with catcher", async () => {
      const { value, error } = await a.flatRecoverAsync(thrower, catcher)
        .promise;
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
    });
    it("leaves success as it is with throwerAsync with catcher", async () => {
      const { value, error } = await a.flatRecoverAsync(throwerAsync, catcher)
        .promise;
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
    });
  });
  describe("tryFlatRecover", () => {
    const success = () => Result.success(0);
    const failure = () => Result.failure("Error2");
    const thrower = () => {
      throw "Error3";
    };
    const catcher = () => -1;
    it("leaves success as it is with success", () => {
      const { value, error } = a.tryFlatRecover(success);
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
    });
    it("leaves success as it is with success with catcher", () => {
      const { value, error } = a.tryFlatRecover(success, catcher);
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
    });
    it("leaves success as it is with failure", () => {
      const { value, error } = a.tryFlatRecover(failure);
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
    });
    it("leaves success as it is with failure with catcher", () => {
      const { value, error } = a.tryFlatRecover(failure, catcher);
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
    });
    it("leaves success as it is with thrower", () => {
      const { value, error } = a.tryFlatRecover(thrower);
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
    });
    it("leaves success as it is with thrower with catcher", () => {
      const { value, error } = a.tryFlatRecover(thrower, catcher);
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
    });
  });
  test("mapError", () => {
    const { value, error } = a.mapError(() => "Mapped");
    expect(value).toEqual(1);
    expect(error).toEqual(undefined);
  });
});

describe("Methods of Failure", () => {
  const a = Result.try(
    () => {
      throw -1;
      return 1;
    },
    () => "Error"
  );
  test("isSuccess", () => {
    expect(a.isSuccess()).toEqual(false);
  });
  test("isFailure", () => {
    expect(a.isFailure()).toEqual(true);
  });
  test("match", () => {
    expect(
      a.match(
        () => 2,
        () => "X"
      )
    ).toEqual("X");
  });
  test("orDefault", () => {
    expect(a.orDefault(2)).toEqual(2);
  });
  test("orRecover", () => {
    expect(a.orRecover(() => 2)).toEqual(2);
  });
  test("orThrow", () => {
    expect(() => a.orThrow()).toThrow(new ResultError("Error"));
  });
  test("orThrow (Error given)", () => {
    expect(() => a.orThrow(() => new Error("Given error"))).toThrow(
      new Error("Given error")
    );
  });
  test("orNull", () => {
    expect(a.orNull()).toEqual(null);
  });
  test("orUndefined", () => {
    expect(a.orUndefined()).toEqual(undefined);
  });
  test("onSuccess", () => {
    let x = 0;
    a.onSuccess((v) => {
      x = 1;
    });
    expect(x).toEqual(0);
  });
  test("onFailure", () => {
    let x = 0;
    a.onFailure((e) => {
      x = 1;
    });
    expect(x).toEqual(1);
  });
  describe("and", () => {
    it("fails with success", () => {
      const { value, error } = a.and(Result.success(2));
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
    it("fails with failure", () => {
      const { value, error } = a.and(Result.failure("Error2"));
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
  });
  describe("or", () => {
    it("succeeds with success", () => {
      const { value, error } = a.or(Result.success(2));
      expect(value).toEqual(2);
      expect(error).toEqual(undefined);
    });
    it("succeeds with failure", () => {
      const { value, error } = a.or(Result.failure("Error2"));
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error2");
    });
  });
  test("map", () => {
    const { value, error } = a.map((v) => `${v + 1}`);
    expect(value).toEqual(undefined);
    expect(error).toEqual("Error");
  });
  describe("mapAsync", () => {
    const mapper = (v: number) => v + 1;
    const mapperAsync = async (v: number) => v + 1;
    const thrower = (v: number) => {
      throw "Error2";
      return v + 1;
    };
    const throwerAsync = async (v: number) => {
      throw "Error2";
      return v + 1;
    };
    const catcher = (e: unknown) => -1;
    it("reaves failure as it is with mapper", async () => {
      const { value, error } = await a.mapAsync(mapper).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
    it("reaves failure as it is with mapperAsync", async () => {
      const { value, error } = await a.mapAsync(mapperAsync).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
    it("reaves failure as it is with mapper and catcher", async () => {
      const { value, error } = await a.mapAsync(mapper, catcher).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
    it("reaves failure as it is with mapperAsync and catcher", async () => {
      const { value, error } = await a.mapAsync(mapperAsync, catcher).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
    it("reaves failure as it is with thrower", async () => {
      const { value, error } = await a.mapAsync(thrower).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
    it("reaves failure as it is with throwerAsync", async () => {
      const { value, error } = await a.mapAsync(throwerAsync).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
    it("reaves failure as it is with thrower and catcher", async () => {
      const { value, error } = await a.mapAsync(thrower, catcher).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
    it("reaves failure as it is with throwerAsync and catcher", async () => {
      const { value, error } = await a.mapAsync(throwerAsync, catcher).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
  });
  describe("tryMap", () => {
    const mapper = (v: number) => v + 1;
    const thrower = (v: number) => {
      throw "Error2";
      return v + 1;
    };
    const catcher = (e: unknown) => -1;
    it("reaves failure as it is with mapper", () => {
      const { value, error } = a.tryMap(mapper);
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
    it("reaves failure as it is with mapper and catcher", () => {
      const { value, error } = a.tryMap(mapper, catcher);
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
    it("reaves failure as it is with thrower", () => {
      const { value, error } = a.tryMap(thrower);
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
    it("reaves failure as it is with thrower and catcher", () => {
      const { value, error } = a.tryMap(thrower, catcher);
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
  });
  describe("flatMap", () => {
    it("is already failed", () => {
      const { value, error } = a.flatMap((v) => Result.success(v + 1));
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
    it("has still previous error", () => {
      const { value, error } = a.flatMap(() => Result.failure("Next Error"));
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
  });
  describe("flatMapAsync", () => {
    const success = (v: number) => Result.success(v + 1);
    const successAsync = (v: number) => AsyncResult.success(v + 1);
    const failure = (v: number) => Result.failure("Error2");
    const failureAsync = (v: number) => AsyncResult.failure("Error2");
    const thrower = (): Result<number, string> => {
      throw "Error3";
    };
    const throwerAsync = (): AsyncResult<number, string> => {
      throw "Error3";
    };
    const catcher = (v: unknown) => -1;
    it("leaves failure as it is with success", async () => {
      const { value, error } = await a.flatMapAsync(success).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
    it("leaves failure as it is with successAsync", async () => {
      const { value, error } = await a.flatMapAsync(successAsync).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
    it("leaves failure as it is with success and catcher", async () => {
      const { value, error } = await a.flatMapAsync(success, catcher).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
    it("leaves failure as it is with successAsync and catcher", async () => {
      const { value, error } = await a.flatMapAsync(successAsync, catcher)
        .promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
    it("leaves failure as it is with failure", async () => {
      const { value, error } = await a.flatMapAsync(failure).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
    it("leaves failure as it is with failureAsync", async () => {
      const { value, error } = await a.flatMapAsync(failureAsync).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
    it("leaves failure as it is with failure and catcher", async () => {
      const { value, error } = await a.flatMapAsync(failure, catcher).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
    it("leaves failure as it is with failureAsync and catcher", async () => {
      const { value, error } = await a.flatMapAsync(failureAsync, catcher)
        .promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
    it("leaves failure as it is with thrower", async () => {
      const { value, error } = await a.flatMapAsync(thrower).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
    it("leaves failure as it is with throwerAsync", async () => {
      const { value, error } = await a.flatMapAsync(throwerAsync).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
    it("leaves failure as it is with thrower and catcher", async () => {
      const { value, error } = await a.flatMapAsync(thrower, catcher).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
    it("leaves failure as it is with throwerAsync and catcher", async () => {
      const { value, error } = await a.flatMapAsync(throwerAsync, catcher)
        .promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
  });
  describe("tryFlatMap", () => {
    const success = (v: number) => Result.success(v + 1);
    const failure = (v: number) => Result.failure("Error2");
    const thrower = () => {
      throw "Error3";
    };
    const catcher = (v: unknown) => -1;
    it("leaves failure as it is with success", () => {
      const { value, error } = a.tryFlatMap(success);
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
    it("leaves failure as it is with success and catcher", () => {
      const { value, error } = a.tryFlatMap(success, catcher);
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
    it("leaves failure as it is with failure", () => {
      const { value, error } = a.tryFlatMap(failure);
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
    it("leaves failure as it is with failure and catcher", () => {
      const { value, error } = a.tryFlatMap(failure, catcher);
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
    it("leaves failure as it is with thrower", () => {
      const { value, error } = a.tryFlatMap(thrower);
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
    it("leaves failure as it is with thrower and catcher", () => {
      const { value, error } = a.tryFlatMap(thrower, catcher);
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
  });
  test("recover", () => {
    const { value, error } = a.recover(() => 2);
    expect(value).toEqual(2);
    expect(error).toEqual(undefined);
  });
  describe("recoverAsync", () => {
    const recover = () => 0;
    const recoverAsync = async () => 0;
    const thrower = () => {
      throw "Error2";
    };
    const throwerAsync = async () => {
      throw "Error2";
    };
    const catcher = () => -1;
    it("recovers with recover", async () => {
      const { value, error } = await a.recoverAsync(recover).promise;
      expect(value).toEqual(0);
      expect(error).toEqual(undefined);
    });
    it("recovers with recoverAsync", async () => {
      const { value, error } = await a.recoverAsync(recoverAsync).promise;
      expect(value).toEqual(0);
      expect(error).toEqual(undefined);
    });
    it("recovers with recover and catcher", async () => {
      const { value, error } = await a.recoverAsync(recover, catcher).promise;
      expect(value).toEqual(0);
      expect(error).toEqual(undefined);
    });
    it("recovers with recoverAsync and catcher", async () => {
      const { value, error } = await a.recoverAsync(recoverAsync, catcher)
        .promise;
      expect(value).toEqual(0);
      expect(error).toEqual(undefined);
    });
    it("fails with thrower", async () => {
      const { value, error } = await a.recoverAsync(thrower).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error2");
    });
    it("fails with throwerAsync", async () => {
      const { value, error } = await a.recoverAsync(throwerAsync).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error2");
    });
    it("fails with thrower and catcher", async () => {
      const { value, error } = await a.recoverAsync(thrower, catcher).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual(-1);
    });
    it("fails with throwerAsync and catcher", async () => {
      const { value, error } = await a.recoverAsync(throwerAsync, catcher)
        .promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual(-1);
    });
  });
  describe("tryRecover", () => {
    const recover = () => 0;
    const thrower = () => {
      throw "Error2";
    };
    const catcher = () => -1;
    it("recovers with recover", () => {
      const { value, error } = a.tryRecover(recover);
      expect(value).toEqual(0);
      expect(error).toEqual(undefined);
    });
    it("recovers with recover and catcher", () => {
      const { value, error } = a.tryRecover(recover, catcher);
      expect(value).toEqual(0);
      expect(error).toEqual(undefined);
    });
    it("fails with thrower", () => {
      const { value, error } = a.tryRecover(thrower);
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error2");
    });
    it("fails with thrower and catcher", () => {
      const { value, error } = a.tryRecover(thrower, catcher);
      expect(value).toEqual(undefined);
      expect(error).toEqual(-1);
    });
  });
  describe("flatRecover", () => {
    it("succeeds with recovered value", () => {
      const { value, error } = a.flatRecover(() => Result.success(2));
      expect(value).toEqual(2);
      expect(error).toEqual(undefined);
    });

    it("fails with new error", () => {
      const { value, error } = a.flatRecover((e) =>
        Result.failure("Next Error")
      );
      expect(value).toEqual(undefined);
      expect(error).toEqual("Next Error");
    });
  });
  describe("flatRecoverAsync", () => {
    const success = () => Result.success(0);
    const successAsync = () => AsyncResult.success(0);
    const failure = () => Result.failure("Error2");
    const failureAsync = () => AsyncResult.failure("Error2");
    const thrower = (): Result<number, string> => {
      throw "Error3";
    };
    const throwerAsync = (): AsyncResult<number, string> => {
      throw "Error3";
    };
    const catcher = () => -1;
    it("recovers with success", async () => {
      const { value, error } = await a.flatRecoverAsync(success).promise;
      expect(value).toEqual(0);
      expect(error).toEqual(undefined);
    });
    it("recovers with successAsync", async () => {
      const { value, error } = await a.flatRecoverAsync(successAsync).promise;
      expect(value).toEqual(0);
      expect(error).toEqual(undefined);
    });
    it("recovers with success with catcher", async () => {
      const { value, error } = await a.flatRecoverAsync(success, catcher)
        .promise;
      expect(value).toEqual(0);
      expect(error).toEqual(undefined);
    });
    it("recovers with successAsync with catcher", async () => {
      const { value, error } = await a.flatRecoverAsync(successAsync, catcher)
        .promise;
      expect(value).toEqual(0);
      expect(error).toEqual(undefined);
    });
    it("fails with failure", async () => {
      const { value, error } = await a.flatRecoverAsync(failure).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error2");
    });
    it("fails with failureAsync", async () => {
      const { value, error } = await a.flatRecoverAsync(failureAsync).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error2");
    });
    it("fails with failure with catcher", async () => {
      const { value, error } = await a.flatRecoverAsync(failure, catcher)
        .promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error2");
    });
    it("fails with failureAsync with catcher", async () => {
      const { value, error } = await a.flatRecoverAsync(failureAsync, catcher)
        .promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error2");
    });
    it("fails with thrower", async () => {
      const { value, error } = await a.flatRecoverAsync(thrower).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error3");
    });
    it("fails with throwerAsync", async () => {
      const { value, error } = await a.flatRecoverAsync(throwerAsync).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error3");
    });
    it("fails with thrower with catcher", async () => {
      const { value, error } = await a.flatRecoverAsync(thrower, catcher)
        .promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual(-1);
    });
    it("fails with throwerAsync with catcher", async () => {
      const { value, error } = await a.flatRecoverAsync(throwerAsync, catcher)
        .promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual(-1);
    });
  });
  describe("tryFlatRecover", () => {
    const success = () => Result.success(0);
    const failure = () => Result.failure("Error2");
    const thrower = () => {
      throw "Error3";
    };
    const catcher = () => -1;
    it("recovers with success", () => {
      const { value, error } = a.tryFlatRecover(success);
      expect(value).toEqual(0);
      expect(error).toEqual(undefined);
    });
    it("recovers with success with catcher", () => {
      const { value, error } = a.tryFlatRecover(success, catcher);
      expect(value).toEqual(0);
      expect(error).toEqual(undefined);
    });
    it("fails with failure", () => {
      const { value, error } = a.tryFlatRecover(failure);
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error2");
    });
    it("fails with failure with catcher", () => {
      const { value, error } = a.tryFlatRecover(failure, catcher);
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error2");
    });
    it("fails with thrower", () => {
      const { value, error } = a.tryFlatRecover(thrower);
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error3");
    });
    it("fails with thrower with catcher", () => {
      const { value, error } = a.tryFlatRecover(thrower, catcher);
      expect(value).toEqual(undefined);
      expect(error).toEqual(-1);
    });
  });
  test("mapError", () => {
    const { value, error } = a.mapError(() => "Mapped");
    expect(value).toEqual(undefined);
    expect(error).toEqual("Mapped");
  });
});
