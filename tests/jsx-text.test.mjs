import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

// React Native rejects even an explicit space string directly under View.
function rawTextErrors(code) {
  const source = ts.createSourceFile('screen.tsx', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const errors = [];
  function visit(node) {
    if (ts.isJsxElement(node) && node.openingElement.tagName.getText(source) !== 'Text') {
      for (const child of node.children) {
        const raw = ts.isJsxText(child) && child.text.trim().length > 0;
        const literal = ts.isJsxExpression(child) && child.expression &&
          (ts.isStringLiteral(child.expression) || ts.isNumericLiteral(child.expression) || ts.isNoSubstitutionTemplateLiteral(child.expression));
        if (raw || literal) errors.push(source.getLineAndCharacterOfPosition(child.getStart(source)).line + 1);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return errors;
}
test('guard detects explicit whitespace outside Text', () => {
  assert.equal(rawTextErrors('<View>{" "}</View>').length, 1);
  assert.equal(rawTextErrors('<View>Hello</View>').length, 1);
  assert.deepEqual(rawTextErrors('<View><Text>Hello</Text></View>'), []);
});
test('app has no literal text children outside Text', () => {
  assert.deepEqual(rawTextErrors(fs.readFileSync(new URL('../App.tsx', import.meta.url), 'utf8')), []);
});
