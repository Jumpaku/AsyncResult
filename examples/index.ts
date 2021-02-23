import { Result } from "@jumpaku/async-result";

async function example() {
  Result.success("Hello").onSuccess(console.log); // => Hello
}

example();
