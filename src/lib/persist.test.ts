import { validateType } from "./persist";

import { List, Map, Set } from "immutable";

test.only("validateType", async () => {
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

    expect(
        validateType("Map<string, List<string>>", { l: ["1"] })
    ).toEqual(Map({ l: List(["1"]) }));
});

test.only("validateType throws on invalid type", async () => {

    expect(
        () => validateType("Set<string>", ["abc", 1])
    ).toThrow();

    expect(
        () => validateType("number", "1")
    ).toThrow();
});
