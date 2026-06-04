export interface RuleEntry {
    id: string;
    category: string;
    principle: string;
    severity: "info" | "warn" | "error";
}
export declare const RULE_CATALOG: RuleEntry[];
export declare function lookupRule(id: string): RuleEntry | undefined;
export declare function isCodeFile(ext: string): boolean;
export declare function isCommentLine(line: string, commentMarkers: string[]): boolean;
export declare function detectCommentMarkers(content: string): string[];
export declare function readFileContent(filePath: string): string | null;
export interface FileEntry {
    path: string;
    content: string;
    lines: string[];
}
export declare function collectFiles(targetPath: string, predicate?: (p: string) => boolean): FileEntry[];
//# sourceMappingURL=utils.d.ts.map