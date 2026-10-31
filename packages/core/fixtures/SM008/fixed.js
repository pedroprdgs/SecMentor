const base = path.resolve("./uploads");
const target = path.resolve(base, String(req.query.path));
const relative = path.relative(base, target);
if (relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("Caminho inválido");
// Verifique também links simbólicos antes de abrir.
fs.readFile(target, callback);
