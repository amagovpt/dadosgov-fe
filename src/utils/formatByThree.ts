export function formatByThree(value: string | number): string {
    if (typeof value === "number") {
        // Numbers group from the right (1000 -> "1 000"), like thousands separators.
        return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    }
    return value.match(/.{1,3}/g)?.join(" ") ?? value;
}
