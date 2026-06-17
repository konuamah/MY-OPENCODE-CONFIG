import { tool } from "@opencode-ai/plugin/tool";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILL_DIR = join(__dirname, "..", "skills");
const SCRIPTS_DIR = join(__dirname, "..", "scripts");
const HTML_PATTERN = /\.(html?|htm)$/i;
const UI_FILE_PATTERN = /\.(html?|css|jsx|tsx|vue|svelte|astro)$/i;
function runBasicSeoChecks(content, filePath) {
    const issues = [];
    const fileName = filePath.split(/[\\/]/).pop() ?? filePath;
    // Check for viewport meta tag
    if (!/<meta[^>]*name=["']viewport["'][^>]*>/i.test(content)) {
        issues.push("Missing viewport meta tag — required for mobile SEO");
    }
    // Check for meta description
    if (!/<meta[^>]*name=["']description["'][^>]*>/i.test(content)) {
        issues.push("Missing meta description — add a unique meta description for SEO");
    }
    // Check for title tag
    if (!/<title>/i.test(content)) {
        issues.push("Missing <title> tag — add a descriptive page title (50-60 chars)");
    }
    // Check for h1
    if (!/<h1[^>]*>/i.test(content)) {
        issues.push("Missing <h1> heading — every page should have exactly one h1");
    }
    // Check for multiple h1s
    const h1Matches = content.match(/<h1[^>]*>/gi);
    if (h1Matches && h1Matches.length > 1) {
        issues.push(`Found ${h1Matches.length} <h1> tags — use exactly one h1 per page`);
    }
    // Check for image alt attributes
    const imgMatches = content.match(/<img[^>]*>/gi);
    if (imgMatches) {
        const noAlt = imgMatches.filter((img) => !/alt\s*=/i.test(img));
        if (noAlt.length > 0) {
            issues.push(`${noAlt.length} image(s) missing alt text — add descriptive alt attributes for accessibility and SEO`);
        }
    }
    // Check for lang attribute on html tag
    if (/<html[^>]*>/i.test(content) && !/<html[^>]*\slang\s*=/i.test(content)) {
        issues.push("Missing lang attribute on <html> — add lang for accessibility and SEO");
    }
    // Check for canonical tag
    if (!/<link[^>]*rel=["']canonical["'][^>]*>/i.test(content)) {
        issues.push("Missing canonical tag — add rel=canonical to prevent duplicate content issues");
    }
    // Check for Open Graph tags
    if (!/<meta[^>]*property=["']og:title["'][^>]*>/i.test(content)) {
        issues.push("Missing og:title meta tag — add Open Graph tags for social sharing");
    }
    if (!/<meta[^>]*property=["']og:description["'][^>]*>/i.test(content)) {
        issues.push("Missing og:description meta tag — add for social sharing SEO");
    }
    // Check for structured data (JSON-LD)
    if (!/<script[^>]*type=["']application\/ld\+json["'][^>]*>/i.test(content)) {
        issues.push("No JSON-LD structured data found — add schema markup for rich search results");
    }
    if (issues.length === 0)
        return null;
    return `🔍 SEO issues in ${fileName}:\n${issues.map((i) => `• ${i}`).join("\n")}`;
}
const statusTool = tool({
    description: "Check if the Agentic SEO plugin is loaded and active, and list available SEO skills",
    args: {},
    execute: async () => {
        const skills = [
            "seo-audit", "seo-technical", "seo-content", "seo-schema",
            "seo-page", "seo-article", "seo-sitemap", "seo-images",
            "seo-links", "seo-geo", "seo-aeo", "seo-github",
            "seo-programmatic", "seo-competitor-pages", "seo-hreflang", "seo-plan",
        ];
        const scriptsCount = (() => {
            try {
                const { readdirSync } = require("node:fs");
                return readdirSync(SCRIPTS_DIR).filter((f) => f.endsWith(".py") || f.endsWith(".mjs")).length;
            }
            catch {
                return "?";
            }
        })();
        return {
            title: "Agentic SEO Status",
            output: [
                "🔍 Agentic SEO plugin is loaded!",
                "",
                `━━━ 16 SEO Sub-Skills ━━━━━`,
                ...skills.map((s) => `  • ${s}`),
                "",
                `━━━ ${scriptsCount} Evidence-Collection Scripts ━━━━━`,
                "  Python scripts for deep SEO analysis via bash",
                "",
                "Example prompts:",
                '  "Run an SEO audit on example.com"',
                '  "Check the schema markup on my homepage"',
                '  "Analyze Core Web Vitals for my site"',
                '  "Check hreflang implementation"',
                '  "Create an SEO plan for my SaaS product"',
                "",
                "Auto-checks run after every HTML file write:",
                "  viewport, meta description, title, h1, alt text,",
                "  lang attribute, canonical, Open Graph, structured data",
            ].join("\n"),
        };
    },
});
const plugin = async (_input, _options) => {
    const hooks = {
        tool: {
            "seo-status": statusTool,
        },
        "tool.execute.before": async (_input, output) => {
            if (_input.tool !== "write" && _input.tool !== "edit")
                return;
            const filePath = output.args?.filePath;
            if (!filePath)
                return;
            if (!filePath.match(HTML_PATTERN))
                return;
            // Inject SEO reminder comment into HTML files before writing
            if (output.args.content && typeof output.args.content === "string") {
                const reminder = "<!-- seo: add meta description, title, h1, alt text, canonical, og tags, structured data, lang attribute -->";
                output.args.content = `${reminder}
${output.args.content}`;
            }
        },
        "tool.execute.after": async (input, output) => {
            if (input.tool !== "write" && input.tool !== "edit")
                return;
            const filePath = input.args?.filePath;
            if (!filePath)
                return;
            if (!filePath.match(HTML_PATTERN))
                return;
            let content = "";
            try {
                content = readFileSync(filePath, "utf8");
            }
            catch {
                return;
            }
            const seoIssues = runBasicSeoChecks(content, filePath);
            if (seoIssues) {
                output.metadata = {
                    ...output.metadata,
                    seo_check: seoIssues,
                };
            }
        },
    };
    return hooks;
};
export default plugin;
//# sourceMappingURL=index.js.map