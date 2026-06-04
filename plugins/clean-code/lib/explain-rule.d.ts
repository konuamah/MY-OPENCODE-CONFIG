export declare const explainRuleTool: {
    description: string;
    args: {
        rule: import("zod").ZodString;
    };
    execute(args: {
        rule: string;
    }, context: import("@opencode-ai/plugin").ToolContext): Promise<import("@opencode-ai/plugin").ToolResult>;
};
//# sourceMappingURL=explain-rule.d.ts.map