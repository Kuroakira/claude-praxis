function isRecord(value) {
    return typeof value === "object" && value !== null;
}
export function getString(obj, key) {
    if (!isRecord(obj))
        return "";
    const val = obj[key];
    return typeof val === "string" ? val : "";
}
export function getBoolean(obj, key) {
    if (!isRecord(obj))
        return false;
    const val = obj[key];
    return typeof val === "boolean" ? val : false;
}
export function getRecord(obj, key) {
    if (!isRecord(obj))
        return {};
    const val = obj[key];
    return isRecord(val) ? val : {};
}
