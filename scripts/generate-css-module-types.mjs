import fs from 'node:fs';
import path from 'node:path';

const isCheckMode = process.argv.includes('--check');
const componentsDir = path.resolve('src/components');
const cssModuleFiles = fs.readdirSync(componentsDir).filter((file) => file.endsWith('.module.css'));

const escapeClassName = (className) => className.replace(/'/g, "\\'");

const buildDeclarationContent = (classNames) => {
  const lines = [];
  lines.push('export type Styles = {');

  for (const className of classNames) {
    lines.push(`  '${escapeClassName(className)}': string;`);
  }

  lines.push('};');
  lines.push('');
  lines.push('export type ClassNames = keyof Styles;');
  lines.push('');
  lines.push('declare const styles: Styles;');
  lines.push('');
  lines.push('export default styles;');

  return `${lines.join('\n')}\n`;
};

const mismatches = [];

for (const cssModuleFile of cssModuleFiles) {
  const cssPath = path.join(componentsDir, cssModuleFile);
  const cssSource = fs.readFileSync(cssPath, 'utf8');
  const classNames = [...new Set([...cssSource.matchAll(/\.([A-Za-z_][A-Za-z0-9_-]*)\s*(?=[,{])/g)].map((match) => match[1]))].sort();

  const declarationPath = `${cssPath}.d.ts`;
  const declarationContent = buildDeclarationContent(classNames);

  if (!isCheckMode) {
    fs.writeFileSync(declarationPath, declarationContent);
    continue;
  }

  const currentContent = fs.existsSync(declarationPath) ? fs.readFileSync(declarationPath, 'utf8') : '';
  if (currentContent !== declarationContent) {
    mismatches.push(path.relative(process.cwd(), declarationPath));
  }
}

if (isCheckMode && mismatches.length > 0) {
  console.error('CSS module type declarations are out of date:');
  mismatches.forEach((filePath) => console.error(`- ${filePath}`));
  process.exit(1);
}

if (isCheckMode) {
  console.log('CSS module type declaration check passed.');
} else {
  console.log(`Generated CSS module type declarations for ${cssModuleFiles.length} files.`);
}
