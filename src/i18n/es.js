import tr0 from "./tr-0.json";
import tr1 from "./tr-1.json";
import tr2 from "./tr-2.json";
import tr3 from "./tr-3.json";
import extra from "./extra.json";

function pick(lang, ...parts) {
  const out = {};
  for (const part of parts) {
    for (const [key, value] of Object.entries(part)) {
      if (value?.[lang]) out[key] = value[lang];
    }
  }
  return out;
}

export const es = pick("es", tr0, tr1, tr2, tr3, extra);
