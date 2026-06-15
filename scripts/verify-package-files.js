#!/usr/bin/env node

const fs = require('fs');

const requiredFiles = [
	'package.json',
	'language-configuration.json',
	'snippets/asciidoc.json',
	'out/extension.js',
	'out/emoji-map.js',
	'media/extension-icon.png',
	'media/antora-default-preview.css',
	'media/bitfield.js',
	'media/graphre.js',
	'media/json5.min.js',
	'media/mermaid.min.js',
	'media/nomnoml.js',
	'media/plantuml.js',
	'media/vega.min.js',
	'media/vega-lite.min.js',
	'media/vega-interpreter.js',
	'media/viz-global.js',
	'media/wavedrom-skin-default.js',
	'media/wavedrom.min.js',
	'media/mathjax/tex-chtml.js',
	'media/mathjax/input/tex/extensions/ams.js',
	'media/mathjax-newcm/chtml.js',
	'media/mathjax-newcm/chtml/dynamic/latin.js',
	'media/mathjax-newcm/chtml/woff2/mjx-ncm-rb.woff2',
];

const listedFiles = new Set(
	fs.readFileSync(0, 'utf8')
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean)
		.map((line) => line.replace(/^extension\//, '')),
);

const missingFiles = requiredFiles.filter((file) => !listedFiles.has(file));

if (missingFiles.length > 0) {
	console.error('Package file verification failed:');
	for (const file of missingFiles) {
		console.error(`- ${file} is not included in the VSIX package file list.`);
	}
	process.exit(1);
}

console.log('Package file verification passed.');
