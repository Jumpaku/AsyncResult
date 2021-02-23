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
export function none() {
    return None.instance;
}
export function some(value) {
    return new Some(value);
}
export function nonNull(nullable) {
    return ((a) => a != null)(nullable)
        ? some(nullable)
        : none();
}
//# sourceMappingURL=Option.js.map