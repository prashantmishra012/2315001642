import axios from 'axios';

const VALID_STACKS = ['backend', 'frontend'] as const;
const VALID_LEVELS = ['debug', 'info', 'warn', 'error', 'fatal'] as const;

const BACKEND_PACKAGES = ['cache', 'controller', 'cron_job', 'db', 'domain', 'handler', 'repository', 'route', 'service'];
const FRONTEND_PACKAGES = ['api', 'component', 'hook', 'page', 'state', 'style'];
const COMMON_PACKAGES = ['auth', 'config', 'middleware', 'utils'];

type Stack = typeof VALID_STACKS[number];
type Level = typeof VALID_LEVELS[number];

function isValidPackage(stack: Stack, pkg: string): boolean {
    if (COMMON_PACKAGES.includes(pkg)) return true;
    if (stack === 'backend' && BACKEND_PACKAGES.includes(pkg)) return true;
    if (stack === 'frontend' && FRONTEND_PACKAGES.includes(pkg)) return true;
    return false;
}

export async function Log(stack: string, level: string, pkg: string, message: string): Promise<void> {
    if (!VALID_STACKS.includes(stack as Stack)) throw new Error(`[Log Middleware] Invalid stack: ${stack}`);
    if (!VALID_LEVELS.includes(level as Level)) throw new Error(`[Log Middleware] Invalid level: ${level}`);
    if (!isValidPackage(stack as Stack, pkg)) throw new Error(`[Log Middleware] Invalid package "${pkg}" for stack "${stack}"`);

    // In frontend, the env is VITE_AFFORDMED_API_TOKEN. In backend, it's AFFORDMED_API_TOKEN.
    const token = typeof process !== 'undefined' && process.env && process.env.AFFORDMED_API_TOKEN 
        ? process.env.AFFORDMED_API_TOKEN 
        // @ts-ignore
        : (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_AFFORDMED_API_TOKEN : null);

    if (!token) throw new Error(`[Log Middleware] AFFORDMED_API_TOKEN environment variable is missing.`);

    const apiUrl = 'http://4.224.186.213/evaluation-service/logs';

    try {
        await axios.post(
            apiUrl,
            { stack, level, package: pkg, message },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
    } catch (error: any) {
        throw new Error(`[Log Middleware] Failed to send log: ${error.message}`);
    }
}
