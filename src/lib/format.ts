import type { Cliente, Frequencia, Nf, OS, Servico, StatusOS, StatusRetorno } from "@/types/domain";

export const EMPRESA = "LavCri"; // empresa desta instalação do HigFlow

/* ---------- moeda e números ---------- */
const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const brl = (v: number | string | null | undefined) => BRL.format(Number(v) || 0);
export const brlK = (v: number) => {
  const a = Math.abs(v);
  return a >= 1e6
    ? "R$ " + (v / 1e6).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " mi"
    : a >= 1e4
      ? "R$ " + Math.round(v / 1e3) + " mil"
      : a >= 1e3
        ? "R$ " + (v / 1e3).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " mil"
        : "R$ " + Math.round(v);
};
export const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
export const num = (v: unknown) => Number(v) || 0;

/* ---------- datas (sempre texto AAAA-MM-DD, sem fuso) ---------- */
export const pad = (n: number) => String(n).padStart(2, "0");
export const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseYmd = (s: string) => {
  const [y, m, d] = String(s).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};
export const today = () => ymd(new Date());
export const addDays = (s: string, n: number) => {
  const d = parseYmd(s);
  d.setDate(d.getDate() + n);
  return ymd(d);
};
export const addMonths = (s: string, n: number) => {
  const d = parseYmd(s);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return ymd(d);
};
export const mk = (s: string | null | undefined) => String(s || "").slice(0, 7);
export const MES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
export const MESL = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
export const DIA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
export const fmtData = (s: string) => {
  if (!s) return "—";
  const d = parseYmd(s);
  return `${DIA[d.getDay()]}, ${d.getDate()} ${MES[d.getMonth()]}`;
};
export const fmtDC = (s: string | null | undefined) => (s ? `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(2, 4)}` : "—");
export const relDia = (s: string) => {
  const t = today();
  if (s === t) return "Hoje";
  if (s === addDays(t, 1)) return "Amanhã";
  if (s === addDays(t, -1)) return "Ontem";
  return fmtData(s);
};
export const fmtMes = (k: string) => {
  const [y, m] = k.split("-");
  return `${MESL[+m - 1]} ${y}`;
};
export const shiftMes = (k: string, n: number) => mk(addMonths(k + "-01", n));
export const proxData = (d: string, f: Frequencia) =>
  f === "semanal" ? addDays(d, 7) : f === "quinzenal" ? addDays(d, 14) : f === "bimestral" ? addMonths(d, 2) : f === "trimestral" ? addMonths(d, 3) : addMonths(d, 1);

/* ---------- horas ---------- */
export const hm = (s: string | null | undefined) => {
  const [h, m] = String(s || "").split(":").map(Number);
  return isNaN(h) ? null : h * 60 + (m || 0);
};
export const fmtHm = (m: number) => `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`;
export const durOS = (o: Pick<OS, "duracao">) => (Number(o.duracao) > 0 ? Number(o.duracao) : 120);

/* ---------- texto ---------- */
export const digits = (s: string | null | undefined) => String(s || "").replace(/\D/g, "");
export const norm = (s: string | null | undefined) =>
  String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
export const firstName = (s: string | null | undefined) => String(s || "").trim().split(/\s+/)[0] || "";
export const numOS = (n: number | null | undefined) => "OS " + String(n || 0).padStart(4, "0");

/* ---------- contato e mapas ---------- */
export const waLink = (tel: string | null | undefined, msg?: string) => {
  let d = digits(tel);
  if (d.length < 10) return null;
  if (d.length <= 11) d = "55" + d;
  return `https://wa.me/${d}${msg ? `?text=${encodeURIComponent(msg)}` : ""}`;
};
export const endTxt = (c: Partial<Cliente> | null | undefined) =>
  c ? [c.endereco, c.bairro, c.cidade].filter(Boolean).join(", ") : "";
export const isUrl = (u: string | null | undefined) =>
  /^https:\/\/(www\.)?(google\.[a-z.]+\/maps|maps\.google\.[a-z.]+|maps\.app\.goo\.gl|goo\.gl\/maps)/i.test(String(u || "").trim());
export const coordsDe = (u: string | null | undefined) => {
  const m = String(u || "").match(/(-?\d{1,2}\.\d{3,})\s*,\s*(-?\d{1,3}\.\d{3,})/);
  return m ? m[1] + "," + m[2] : null;
};
export const destino = (c: Partial<Cliente> | null | undefined) => (c ? coordsDe(c.mapsUrl) || endTxt(c) || null : null);
export const mapsLink = (c: Partial<Cliente> | null | undefined) => {
  if (c && isUrl(c.mapsUrl)) return String(c.mapsUrl).trim();
  const q = destino(c);
  return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : null;
};
export const rotaLink = (c: Partial<Cliente> | null | undefined) => {
  const q = destino(c);
  if (q) return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}&travelmode=driving`;
  return c && isUrl(c.mapsUrl) ? String(c.mapsUrl).trim() : null;
};
export const rotaDia = (cs: Array<Partial<Cliente>>) => {
  const ds = cs.map(destino).filter((x): x is string => !!x).filter((d, i, a) => a.indexOf(d) === i);
  if (!ds.length) return null;
  const dest = ds[ds.length - 1];
  const wp = ds.slice(0, -1).slice(0, 9);
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}${wp.length ? "&waypoints=" + encodeURIComponent(wp.join("|")) : ""}&travelmode=driving`;
};

/* ---------- cores da agenda ---------- */
export const CORES: Record<string, { n: string; bd: string; bg: string; fg: string }> = {
  verde: { n: "Verde", bd: "#13855a", bg: "#e3f4eb", fg: "#0b5a3a" },
  azul: { n: "Azul", bd: "#1f6fb2", bg: "#e3effa", fg: "#134a78" },
  ciano: { n: "Ciano", bd: "#0e8a99", bg: "#dff4f6", fg: "#0a5c66" },
  roxo: { n: "Roxo", bd: "#6a4bc4", bg: "#ece7fa", fg: "#4a2f94" },
  rosa: { n: "Rosa", bd: "#c2407c", bg: "#fae6ef", fg: "#8a2456" },
  laranja: { n: "Laranja", bd: "#c8620f", bg: "#fdeedd", fg: "#8a4208" },
  amarelo: { n: "Amarelo", bd: "#a67c00", bg: "#fbf3d6", fg: "#6e5200" },
  cinza: { n: "Cinza", bd: "#5b6b64", bg: "#eef2f0", fg: "#33413b" },
};
export const corDe = (k: string | null | undefined) => CORES[k || ""] || CORES.verde;
export const corOS = (o: Pick<OS, "cor" | "itens">, serv: Record<string, Servico>) =>
  o.cor || serv[o.itens[0]?.servicoId]?.cor || "verde";

/* ---------- rótulos ---------- */
export const STATUS: Record<StatusOS, string> = { agendada: "Agendada", em_andamento: "Em andamento", concluida: "Concluída", cancelada: "Cancelada" };
export const FORMAS: Record<string, string> = { pix: "Pix", dinheiro: "Dinheiro", credito: "Cartão de crédito", debito: "Cartão de débito", boleto: "Boleto", transferencia: "Transferência" };
export const FREQ: Record<Frequencia, string> = { semanal: "Semanal", quinzenal: "Quinzenal", mensal: "Mensal", bimestral: "Bimestral", trimestral: "Trimestral" };
export const UNID: Record<string, string> = { un: "unidade", lugar: "lugar/assento", m2: "m²", peca: "peça", h: "hora" };
export const RSTATUS: Record<StatusRetorno, string> = { pendente: "A oferecer", contatado: "Contatado", agendado: "Agendado", dispensado: "Dispensado" };
export const CATS = ["Produtos químicos", "Combustível", "Manutenção de equipamento", "Equipamentos", "Marketing", "Salários", "Aluguel", "Impostos e taxas", "Alimentação", "Outros"];
export const BASE_SERVICOS: Array<[string, string, number, string]> = [
  ["Higienização de sofá", "lugar", 6, "verde"],
  ["Higienização de colchão", "un", 6, "azul"],
  ["Higienização de tapete", "m2", 6, "laranja"],
  ["Higienização de cortina", "m2", 12, "roxo"],
  ["Higienização de persiana", "un", 12, "ciano"],
  ["Impermeabilização de estofado", "lugar", 12, "rosa"],
];

export const clone = <T,>(o: T): T => JSON.parse(JSON.stringify(o ?? {}));

export const NF_VAZIA: Nf = { numero: "", serie: "", emissao: null, link: "" };
export const temNf = (o: Pick<OS, "nf">) => !!o.nf.numero.trim();
export const rotuloNf = (nf: Nf) => (nf.numero ? `NF ${nf.numero}${nf.serie ? "/" + nf.serie : ""}` : "");
