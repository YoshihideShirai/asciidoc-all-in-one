declare module 'asciidoctor-kroki-embedded' {
	type Registry = {
		block(name: string, callback: (this: unknown) => void): void;
		blockMacro(name: string, callback: (this: unknown) => void): void;
	};

	type RendererArgs = {
		diagramType: string;
		source: string;
		attrs: Record<string, string>;
		options?: Record<string, unknown>;
	};

	export function register(registry: Registry, options?: Record<string, unknown>): void;
	export function defaultRenderer(args: RendererArgs): string;

	const extension: {
		register: typeof register;
		defaultRenderer: typeof defaultRenderer;
	};

	export default extension;
}
