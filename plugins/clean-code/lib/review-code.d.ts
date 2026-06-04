import { type Violation } from "./heuristics";
export interface ReviewResult {
    file: string;
    violations: (Violation & {
        file: string;
    })[];
    summary: {
        total: number;
        byRule: Record<string, number>;
        bySeverity: Record<string, number>;
    };
}
export declare const reviewCodeTool: {
    description: string;
    args: {
        path: import("zod").ZodString;
    };
    execute(args: {
        path: string;
    }, context: import("@opencode-ai/plugin").ToolContext): Promise<import("@opencode-ai/plugin").ToolResult>;
};
//# sourceMappingURL=review-code.d.ts.map