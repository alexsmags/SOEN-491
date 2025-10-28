process.env.NODE_ENV = "test";

const keep = console.log;
console.log = (...args: any[]) => {
  const m = String(args[0] ?? "");
  if (m.startsWith("[caption]") || m.startsWith("[media]")) return;
  keep(...args);
};
