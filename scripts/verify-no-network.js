#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const scanTargets = [
	'src',
	'scripts',
	'snippets',
	'language-configuration.json',
	'package.json',
];

const allowedRuntimeDependencies = new Set([
	'@asciidoctor/core',
	'asciidoctor-kroki-embedded',
	'asciidoctor-numbered-captions',
]);

const blockedPatterns = [
	{
		name: 'browser network API',
		pattern: /\b(fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(/,
	},
	{
		name: 'Node network module import',
		pattern: /\b(?:import|from|require)\b[^;\n]*(?:node:)?(?:http|https|http2|net|tls|dgram|dns)\b/,
	},
	{
		name: 'process execution API',
		pattern: /\b(?:child_process|spawn|execFile|exec|fork)\b/,
	},
	{
		name: 'remote URL literal in extension-controlled code',
		pattern: /(?:https?:|ftp:|wss?:)\/\//,
	},
	{
		name: 'webview CSP allows remote network access',
		pattern: /(?:connect-src|img-src|media-src|font-src|script-src|style-src)[^;"']*(?:https?:|wss?:|\*)/,
	},
	{
		name: 'Asciidoctor remote URI reads enabled',
		pattern: /['"]allow-uri-read['"]\s*:\s*(?:true|['"]true['"])/,
	},
	{
		name: 'unsafe Asciidoctor mode',
		pattern: /\bsafe\s*:\s*['"]unsafe['"]/,
	},
];

const expectedText = [
	{
		file: 'src/extension.ts',
		text: "'allow-uri-read': false",
		message: 'Asciidoctor conversion must explicitly disable allow-uri-read.',
	},
	{
		file: 'src/extension.ts',
		text: "safe: 'safe'",
		message: 'Asciidoctor conversion must run in safe mode or stricter.',
	},
	{
		file: 'src/extension.ts',
		text: "default-src 'none'",
		message: 'Webview CSP must deny all loads by default.',
	},
	{
		file: 'src/extension.ts',
		text: "setBlockedGlobal('fetch')",
		message: 'Webview must install a fetch guard before loading vendored preview scripts.',
	},
	{
		file: 'src/extension.ts',
		text: "setBlockedGlobal('XMLHttpRequest')",
		message: 'Webview must install an XMLHttpRequest guard before loading vendored preview scripts.',
	},
];

const vendoredFiles = [
	{
		file: 'media/mermaid.min.js',
		patterns: [
			/\bfetch\s*\(/,
			/\bXMLHttpRequest\b/,
			/\bWebSocket\b/,
			/\bEventSource\b/,
			/\bnavigator\.sendBeacon\b/,
			/\bimportScripts\s*\(/,
		],
	},
	{
		file: 'media/mathjax/tex-chtml.js',
		patterns: [
			/\bfetch\s*\(/,
			/\bXMLHttpRequest\b/,
			/\bWebSocket\b/,
			/\bEventSource\b/,
			/\bnavigator\.sendBeacon\b/,
			/\bimportScripts\s*\(/,
		],
	},
	{
		file: 'media/mathjax-newcm/chtml.js',
		patterns: [
			/\bfetch\s*\(/,
			/\bXMLHttpRequest\b/,
			/\bWebSocket\b/,
			/\bEventSource\b/,
			/\bnavigator\.sendBeacon\b/,
			/\bimportScripts\s*\(/,
		],
	},
	{
		file: 'media/plantuml.js',
		patterns: [
			/\bfetch\s*\(/,
			/\bXMLHttpRequest\b/,
			/\bWebSocket\b/,
			/\bEventSource\b/,
			/\bnavigator\.sendBeacon\b/,
			/\bimportScripts\s*\(/,
		],
	},
	{
		file: 'media/viz-global.js',
		patterns: [
			/\bfetch\s*\(/,
			/\bXMLHttpRequest\b/,
			/\bWebSocket\b/,
			/\bEventSource\b/,
			/\bnavigator\.sendBeacon\b/,
			/\bimportScripts\s*\(/,
		],
	},
	{
		file: 'media/graphre.js',
		patterns: [
			/\bfetch\s*\(/,
			/\bXMLHttpRequest\b/,
			/\bWebSocket\b/,
			/\bEventSource\b/,
			/\bnavigator\.sendBeacon\b/,
			/\bimportScripts\s*\(/,
		],
	},
	{
		file: 'media/nomnoml.js',
		patterns: [
			/\bfetch\s*\(/,
			/\bXMLHttpRequest\b/,
			/\bWebSocket\b/,
			/\bEventSource\b/,
			/\bnavigator\.sendBeacon\b/,
			/\bimportScripts\s*\(/,
		],
	},
	{
		file: 'media/vega.min.js',
		patterns: [
			/\bfetch\s*\(/,
			/\bXMLHttpRequest\b/,
			/\bWebSocket\b/,
			/\bEventSource\b/,
			/\bnavigator\.sendBeacon\b/,
			/\bimportScripts\s*\(/,
		],
	},
	{
		file: 'media/vega-lite.min.js',
		patterns: [
			/\bfetch\s*\(/,
			/\bXMLHttpRequest\b/,
			/\bWebSocket\b/,
			/\bEventSource\b/,
			/\bnavigator\.sendBeacon\b/,
			/\bimportScripts\s*\(/,
		],
	},
	{
		file: 'media/vega-interpreter.js',
		patterns: [
			/\bfetch\s*\(/,
			/\bXMLHttpRequest\b/,
			/\bWebSocket\b/,
			/\bEventSource\b/,
			/\bnavigator\.sendBeacon\b/,
			/\bimportScripts\s*\(/,
		],
	},
	{
		file: 'media/json5.min.js',
		patterns: [
			/\bfetch\s*\(/,
			/\bXMLHttpRequest\b/,
			/\bWebSocket\b/,
			/\bEventSource\b/,
			/\bnavigator\.sendBeacon\b/,
			/\bimportScripts\s*\(/,
		],
	},
	{
		file: 'media/wavedrom-skin-default.js',
		patterns: [
			/\bfetch\s*\(/,
			/\bXMLHttpRequest\b/,
			/\bWebSocket\b/,
			/\bEventSource\b/,
			/\bnavigator\.sendBeacon\b/,
			/\bimportScripts\s*\(/,
		],
	},
	{
		file: 'media/wavedrom.min.js',
		patterns: [
			/\bfetch\s*\(/,
			/\bXMLHttpRequest\b/,
			/\bWebSocket\b/,
			/\bEventSource\b/,
			/\bnavigator\.sendBeacon\b/,
			/\bimportScripts\s*\(/,
		],
	},
	{
		file: 'media/bitfield.js',
		patterns: [
			/\bfetch\s*\(/,
			/\bXMLHttpRequest\b/,
			/\bWebSocket\b/,
			/\bEventSource\b/,
			/\bnavigator\.sendBeacon\b/,
			/\bimportScripts\s*\(/,
		],
	},
];

const failures = [];

for (const file of listFiles(scanTargets)) {
	const rel = path.relative(root, file);
	const text = fs.readFileSync(file, 'utf8');
	const lines = text.split(/\r?\n/);

	for (const [index, line] of lines.entries()) {
		for (const blocked of blockedPatterns) {
			if (isAllowedPackageMetadataUrl(rel, blocked.name, line)) {
				continue;
			}

			if (blocked.pattern.test(line)) {
				failures.push(`${rel}:${index + 1}: ${blocked.name}: ${line.trim()}`);
			}
		}
	}
}

for (const expected of expectedText) {
	const file = path.join(root, expected.file);
	const text = fs.readFileSync(file, 'utf8');
	if (!text.includes(expected.text)) {
		failures.push(`${expected.file}: ${expected.message}`);
	}
}

verifyRuntimeDependencies();
verifyVendoredFiles();

if (failures.length > 0) {
	console.error('No-network verification failed:');
	for (const failure of failures) {
		console.error(`- ${failure}`);
	}
	process.exitCode = 1;
} else {
	console.log('No-network verification passed.');
}

function listFiles(targets) {
	const files = [];

	for (const target of targets) {
		const absolute = path.join(root, target);
		if (!fs.existsSync(absolute)) {
			continue;
		}

		const stat = fs.statSync(absolute);
		if (stat.isDirectory()) {
			for (const entry of fs.readdirSync(absolute)) {
				if (entry === 'node_modules' || entry === 'out' || entry === '.vscode-test') {
					continue;
				}

				files.push(...listFiles([path.join(target, entry)]));
			}
		} else if (/\.(?:js|ts|json|mjs|cjs)$/i.test(absolute)) {
			if (path.relative(root, absolute) !== 'scripts/verify-no-network.js') {
				files.push(absolute);
			}
		}
	}

	return files;
}

function verifyRuntimeDependencies() {
	const manifestPath = path.join(root, 'package.json');
	const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
	const dependencies = Object.keys(manifest.dependencies ?? {});

	for (const dependency of dependencies) {
		if (!allowedRuntimeDependencies.has(dependency)) {
			failures.push(`package.json: runtime dependency "${dependency}" is not in the no-network allowlist.`);
		}
	}
}

function isAllowedPackageMetadataUrl(rel, blockedName, line) {
	return rel === 'package.json'
		&& blockedName === 'remote URL literal in extension-controlled code'
		&& (
			/"url"\s*:\s*"https:\/\/github\.com\/YoshihideShirai\/asciidoc-local-preview-vscode\.git"/.test(line)
			|| /"asciidoctor-kroki-embedded"\s*:\s*"git\+https:\/\/github\.com\/YoshihideShirai\/asciidoctor-kroki-embedded\.git"/.test(line)
			|| /"asciidoctor-numbered-captions"\s*:\s*"git\+https:\/\/github\.com\/YoshihideShirai\/asciidoctor-numbered-captions\.git#v1\.0\.0"/.test(line)
		);
}

function verifyVendoredFiles() {
	const guardSource = fs.readFileSync(path.join(root, 'src/extension.ts'), 'utf8');
	const hasWebviewNetworkGuard = guardSource.includes("setBlockedGlobal('fetch')")
		&& guardSource.includes("setBlockedGlobal('XMLHttpRequest')")
		&& guardSource.includes("setBlockedGlobal('WebSocket')")
		&& guardSource.includes("setBlockedGlobal('EventSource')")
		&& guardSource.includes("sendBeacon");

	for (const vendored of vendoredFiles) {
		const file = path.join(root, vendored.file);
		if (!fs.existsSync(file)) {
			failures.push(`${vendored.file}: vendored file is missing.`);
			continue;
		}

		const text = fs.readFileSync(file, 'utf8');
		for (const pattern of vendored.patterns) {
			if (pattern.test(text) && !hasWebviewNetworkGuard) {
				failures.push(`${vendored.file}: vendored file contains blocked network API pattern ${pattern}, but the Webview network guard is missing.`);
			}
		}
	}
}
