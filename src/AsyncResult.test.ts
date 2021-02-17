import { describe, expect, test } from "@jest/globals";
import { AsyncResult } from "./AsyncResult";
import { Result } from "./Result";

describe("AsyncResult Creation", () => {
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
  describe("resolve", () => {
    it("succeeds with success", async () => {
      const { value, error } = await AsyncResult.resolve(Result.success(1))
        .promise;
      expect(value).toEqual(1);
      expect(error).toEqual(undefined);
    });
    it("fails with failure", async () => {
      const { value, error } = await AsyncResult.resolve(
        Result.failure("Error")
      ).promise;
      expect(value).toEqual(undefined);
      expect(error).toEqual("Error");
    });
  });
  describe("of", () => {
    const resolvedSuccess = Promise.resolve(Result.success(1));
    const resolvedFailure = Promise.resolve(Result.failure("Error"));
    const rejected = Promise.reject("Error2");
    const catcher = () => -1;
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
});

describe("Methods when resolved as success", () => {
  const a = AsyncResult.success(1);
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
  test("match", async () => {
    expect(
      await a.match(
        () => 2,
        () => "X"
      )
    ).toEqual(2);
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
  test("map", async () => {
    const { value, error } = await a.map((v) => v + 1).promise;
    expect(value).toEqual(2);
    expect(error).toEqual(undefined);
  });
});
