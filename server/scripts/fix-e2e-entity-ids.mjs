import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src');
const importLine = "import { generateEntityId } from '../common/entity-id';\n";

function walk(dir, acc = []) {
	for (const name of fs.readdirSync(dir)) {
		const p = path.join(dir, name);
		if (fs.statSync(p).isDirectory()) walk(p, acc);
		else if (name.endsWith('.e2e-spec.ts')) acc.push(p);
	}
	return acc;
}

for (const file of walk(root)) {
	let s = fs.readFileSync(file, 'utf8');
	if (!s.includes('prisma.client.create') && !s.includes('prisma.invoice.create')) continue;
	if (!s.includes('generateEntityId')) {
		const anchor = "from '../common/test-helpers/auth.helper';";
		if (s.includes(anchor)) {
			s = s.replace(anchor, `${anchor}\n${importLine.trim()}`);
		} else {
			const m = s.match(/^import .+$/m);
			if (m) {
				const idx = s.indexOf(m[0]) + m[0].length;
				s = `${s.slice(0, idx)}\n${importLine.trim()}${s.slice(idx)}`;
			}
		}
	}
	s = s.replace(/(prisma\.client\.create\(\{\s*data:\s*)\{/g, '$1{ id: generateEntityId(), ');
	s = s.replace(/(prisma\.invoice\.create\(\{\s*data:\s*)\{/g, '$1{ id: generateEntityId(), ');
	fs.writeFileSync(file, s);
	console.log('fixed', path.relative(root, file));
}
