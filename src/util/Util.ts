import { Venti } from "../structures/Venti";

export class Util {
    public constructor(public readonly client: Venti) {}

    public static isValidURL(url: string): boolean {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
}
