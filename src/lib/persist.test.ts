import { validateType } from "./persist";

import { List, Set } from "immutable";

test("validateType", async () => {
    expect(
        validateType("string[]", ["abc", "def"])
    ).toEqual(["abc", "def"]);

    expect(
        validateType("List<string>", ["abc", "def"])
    ).toEqual(List(["abc", "def"]));

    expect(
        validateType("Set<string>", ["abc", "def"])
    ).toEqual(Set(["abc", "def"]));

    expect(
        validateType("number", 1)
    ).toBe(1);
});

test("validateType throws on invalid type", async () => {

    expect(
        () => validateType("Set<string>", ["abc", 1])
    ).toThrow();

    expect(
        () => validateType("number", "1")
    ).toThrow();
});
