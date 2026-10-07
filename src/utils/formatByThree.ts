export function formatByThree(value: string): string {
    return value.match(/.{1,3}/g)?.join(" ") ?? value;
}
