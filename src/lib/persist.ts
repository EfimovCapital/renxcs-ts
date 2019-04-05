import { List, Set } from "immutable";

/**
 * TYPE can be (recursively defined):
 *
 * 1) result of `typeof` ("object", "number", "string")
 * 2) TYPE[]
 * 3) List<TYPE>
 * 4) Set<TYPE>
 */
type TYPE = string;

const isArrayType = (type: TYPE) => type.slice(-2) === "[]";
const isListType = (type: TYPE) => type.slice(0, 5) === "List<" && type.slice(-1) === ">";
const isSetType = (type: TYPE) => type.slice(0, 4) === "Set<" && type.slice(-1) === ">";

/**
 * validateType takes two parameters - a target type and a value, and checks
 * that the value can be converted to that type, returning the converted value
 * or throwing an error. Only List/Set conversions are supported.
 *
 * It is used for for deserializing JSON to Immutable types.
 *
 * Example:
 *      validateType("string", "abc") => "abc"
 *      validateType("number", 1) => 1
 *      validateType("string", 1) => Err
 *      validateType("List<string>", [ "abc" ]) => List [ "abc" ]
 *      validateType("Set<string>", [ "abc" ]) => Set { "abc" }
 *
 * @param type The expected type as either X or X[] (etc.) where X is the output
 * of `typeof`
 * @param object The value to check the type of
 */
export const validateType = (type: TYPE, object: unknown): unknown => {
    if (isArrayType(type)) {
        const subtype = type.slice(0, -2);
        return (object as unknown[]).map((e) => validateType(subtype, e));
    } else if (isListType(type)) {
        const subtype = type.slice(5, -1);
        return List((object as unknown[]).map((e) => validateType(subtype, e)));
    } else if (isSetType(type)) {
        const subtype = type.slice(4, -1);
        return Set((object as unknown[]).map((e) => validateType(subtype, e)));
    }
    if (typeof object === type) {
        return object;
    }
    throw new Error(`Unexpected value of type ${typeof object} (expected ${type})`);
};
