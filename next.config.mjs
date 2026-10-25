/** Test output is isolated from the production build. No API proxy is used. */
const config = { distDir: process.env.NEXT_DIST_DIR || ".next" };
export default config;
