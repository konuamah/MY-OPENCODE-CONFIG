export interface Violation {
    rule: string;
    line: number;
    severity: "info" | "warn" | "error";
    message: string;
    suggestion: string;
}
export interface CheckContext {
    filePath: string;
    content: string;
    lines: string[];
}
export declare function checkMagicValues(ctx: CheckContext): Violation[];
export declare function checkTooManyParams(ctx: CheckContext): Violation[];
export declare function checkSingleLetterNames(ctx: CheckContext): Violation[];
export declare function checkFlagArgs(ctx: CheckContext): Violation[];
export declare function checkCommentedOutCode(ctx: CheckContext): Violation[];
export declare function checkDeepNesting(ctx: CheckContext): Violation[];
export declare function checkDeadFunctions(ctx: CheckContext): Violation[];
export declare function runAllChecks(ctx: CheckContext): Violation[];
//# sourceMappingURL=heuristics.d.ts.map