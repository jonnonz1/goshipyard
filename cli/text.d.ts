// Ambient declarations so `import x from './foo.md' with { type: 'text' }` (Bun's
// text loader, embedded into the compiled binary) also type-checks under tsc.
declare module '*.md' {
  const content: string;
  export default content;
}
declare module '*.mdc' {
  const content: string;
  export default content;
}
