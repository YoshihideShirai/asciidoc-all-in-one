import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as path from 'path';
import * as vscode from 'vscode';
// import * as myExtension from '../../extension';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Sample test', () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	});

	test('Open preview command handles an existing incompatible Opal global', async () => {
		(globalThis as typeof globalThis & { Opal?: unknown }).Opal = {
			queue() {
				// This mimics a pre-existing Opal runtime enough to trigger Asciidoctor 3 load conflicts.
			},
			loaded() {
				return false;
			},
			modules: {},
			config: {},
			gvars: {},
			nil: null,
		};

		const document = await vscode.workspace.openTextDocument({
			content: '= Test\n\nHello from AsciiDoc.',
			language: 'asciidoc',
		});
		await vscode.window.showTextDocument(document);
		await vscode.commands.executeCommand('asciidoc-local-preview.openPreview');
	});

	test('Open preview command renders an Antora directory sample', async () => {
		const sample = vscode.Uri.file(path.resolve(__dirname, '..', '..', 'examples', 'antora-preview', 'modules', 'ROOT', 'pages', 'index.adoc'));
		const document = await vscode.workspace.openTextDocument(sample);
		await vscode.window.showTextDocument(document);
		await vscode.commands.executeCommand('asciidoc-local-preview.openPreview');
	});

	test('Open preview command renders an AsciiDoc document', async () => {
		const document = await vscode.workspace.openTextDocument({
			content: '= Test\n\nHello from AsciiDoc.',
			language: 'asciidoc',
		});
		await vscode.window.showTextDocument(document);
		await vscode.commands.executeCommand('asciidoc-local-preview.openPreview');
	});
});
