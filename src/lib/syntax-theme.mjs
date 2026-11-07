// CSS variables keep highlighting in sync with the active site palette.
export const syntaxTheme = {
  name: 'dev-notes',
  type: 'light',
  colors: {
    'editor.background': 'var(--code-background, #e8e9e3)',
    'editor.foreground': 'var(--code-foreground, #292a28)',
  },
  tokenColors: [
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: 'var(--code-comment, #62635d)', fontStyle: 'italic' } },
    { scope: ['keyword', 'storage'], settings: { foreground: 'var(--code-keyword, #9f3e2b)' } },
    { scope: ['entity.name.type', 'entity.name.namespace', 'support.type', 'support.class', 'storage.type'], settings: { foreground: 'var(--code-type, #176d76)' } },
    { scope: ['entity.name.function', 'support.function'], settings: { foreground: 'var(--code-function, #2465aa)' } },
    { scope: ['string', 'markup.inline.raw'], settings: { foreground: 'var(--code-string, #286446)' } },
    { scope: ['constant.numeric', 'constant.language', 'constant.character'], settings: { foreground: 'var(--code-constant, #895b13)' } },
    { scope: ['variable', 'entity.name.variable'], settings: { foreground: 'var(--code-foreground, #292a28)' } },
    { scope: ['punctuation', 'keyword.operator'], settings: { foreground: 'var(--code-punctuation, #62635d)' } },
    { scope: ['invalid'], settings: { foreground: 'var(--code-keyword, #9f3e2b)', fontStyle: 'underline' } },
  ],
};
