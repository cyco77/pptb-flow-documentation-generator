import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";

/**
 * Plugin to fix HTML for PPTB compatibility
 * - Removes type="module" and crossorigin attributes since we're using IIFE format
 * - Moves script tags from head to end of body so DOM is ready when IIFE executes
 */
function fixHtmlForPPTB(): Plugin {
  return {
    name: "fix-html-for-pptb",
    enforce: "post",
    transformIndexHtml(html) {
      // Remove type="module" and crossorigin from script tags
      // IIFE format doesn't need module type, and file:// URLs don't need crossorigin
      html = html.replace(/\s*type="module"/g, "");
      html = html.replace(/\s*crossorigin/g, "");
      // Clean up extra spaces around attributes
      html = html.replace(/\s+>/g, ">");

      // Move script tags from head to end of body
      // IIFE executes immediately, so DOM must be ready
      const scriptRegex = /(<script[^>]*src="[^"]*"[^>]*><\/script>)/g;
      const scripts: string[] = [];

      // Extract all script tags
      html = html.replace(scriptRegex, (match) => {
        scripts.push(match);
        return ""; // Remove from current position
      });

      // Insert scripts before closing body tag
      if (scripts.length > 0) {
        const scriptsHtml = "\n  " + scripts.join("\n  ");
        html = html.replace("</body>", scriptsHtml + "\n</body>");
      }

      return html;
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), fixHtmlForPPTB()],
  base: "./",
  build: {
    outDir: "dist",
    assetsDir: "assets",
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Use IIFE format for compatibility with iframe srcdoc loading
        // ES modules can have issues when loaded via file:// URLs in iframes
        format: "iife",
        // Bundle everything into a single file to avoid module loading issues
        inlineDynamicImports: true,
      },
    },
  },
});
