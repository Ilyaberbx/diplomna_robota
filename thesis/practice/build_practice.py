#!/usr/bin/env python3
"""Build the practice report (zvit.pdf) and practice diary (shodennyk.pdf).

Звіт reuses thesis/build_pdf.py verbatim (same ДСТУ 3008 / RULES.md text
formatting): same CSS, same markdown line-scanner, same render_* helpers. We
only (a) extend the structural-heading regex so the un-numbered heading
"ХАРАКТЕРИСТИКА ПІДПРИЄМСТВА" is recognised, (b) point figure resolution at the
practice-local figures/ dir, and (c) render the bibliography via the alias name
"12-spysok-dzherel.md" so build_pdf's is_refs branch fires.

Щоденник is a fixed official form (not free prose), rendered from
shodennyk-data.md (a fenced ```yaml block) into a Python HTML template with its
own bordered-form CSS appended to build_pdf's page/font CSS.

Usage:  python build_practice.py [zvit|shodennyk|both]   (default: both)
"""
import html
import re
import sys
from pathlib import Path

HERE = Path(__file__).parent          # thesis/practice/
THESIS = HERE.parent                  # thesis/
sys.path.insert(0, str(THESIS))
import build_pdf as bp                 # noqa: E402  (reuse inline/render_*/CSS)

# Resolve <figure> images against thesis/practice/figures/ (build_pdf's FIGCAP
# handler reads the module-level bp.HERE). build_pdf.main() is never called from
# here, so reassigning these module globals is safe and isolated to this run.
bp.HERE = HERE

# Звіт structural headings: the report uses plain "ВИСНОВКИ" (not "ЗАГАЛЬНІ
# ВИСНОВКИ") and adds the un-numbered "ХАРАКТЕРИСТИКА ПІДПРИЄМСТВА". ЗМІСТ is
# handled by render_toc, not the body scanner.
bp.STRUCT = re.compile(
    r"^(ЗМІСТ|ВСТУП|ХАРАКТЕРИСТИКА ПІДПРИЄМСТВА|ВИСНОВКИ|"
    r"СПИСОК ВИКОРИСТАНИХ ДЖЕРЕЛ)$")

ZVIT_ORDER = [
    "zvit-00-tytul.md", "zvit-01-zmist.md", "zvit-02-vstup.md",
    "zvit-03-harakterystyka.md", "zvit-04-rozdil-1.md", "zvit-05-rozdil-2.md",
    "zvit-06-rozdil-3.md", "zvit-07-rozdil-4.md", "zvit-08-vysnovky.md",
    "zvit-09-dzherela.md",
]
ZVIT_REFS = "zvit-09-dzherela.md"   # rendered via the build_pdf is_refs alias


# --------------------------------------------------------------------------- #
# Звіт                                                                         #
# --------------------------------------------------------------------------- #
def _zvit_title_class(line: str) -> str:
    if line.startswith("МІНІСТЕРСТВО"):
        return "tp-min"
    if line.startswith("НАЦІОНАЛЬНИЙ УНІВЕРСИТЕТ"):
        return "tp-uni"
    if line == "ЗВІТ":
        return "tp-qual"
    if line.startswith("з ") and "практики" in line:
        return "tp-theme"
    if line.endswith(":"):
        return "tp-it"
    return "tp"


def render_title_zvit(lines):
    """Like build_pdf.render_title but with report-specific line classes."""
    out = ['<section class="sheet title-page">']
    for ln in lines:
        ln = ln.strip()
        if not ln:
            out.append('<div class="tp-gap"></div>')
            continue
        out.append(f'<p class="{_zvit_title_class(ln)}">{bp.inline(ln)}</p>')
    out.append("</section>")
    return "\n".join(out)


def build_zvit():
    sections = []
    for fname in ZVIT_ORDER:
        p = HERE / fname
        if not p.exists():
            print(f"skip missing {fname}", file=sys.stderr)
            continue
        text = bp.strip_formatting_comment(p.read_text(encoding="utf-8"))
        if fname == "zvit-00-tytul.md":
            sections.append(render_title_zvit(text.split("\n")))
        elif fname == "zvit-01-zmist.md":
            sections.append(bp.render_toc(text))
        elif fname == ZVIT_REFS:
            # alias to the diploma bibliography filename so is_refs fires
            sections.append(bp.render_body("12-spysok-dzherel.md", text))
        else:
            sections.append(bp.render_body(fname, text))
    doc = (f"<!DOCTYPE html><html lang='uk'><head><meta charset='utf-8'>"
           f"<style>{bp.CSS}</style></head><body>"
           f"{''.join(sections)}</body></html>")
    (HERE / "zvit.html").write_text(doc, encoding="utf-8")
    from weasyprint import HTML
    out_pdf = HERE / "zvit.pdf"
    HTML(string=doc, base_url=str(HERE)).write_pdf(str(out_pdf))
    print(f"OK -> {out_pdf}")


# --------------------------------------------------------------------------- #
# Щоденник (fixed official form)                                              #
# --------------------------------------------------------------------------- #
SHODENNYK_CSS = """
.shdoc { text-align: left; }
.shdoc p { text-indent: 0; margin: 0.2em 0; }
.shdoc h1.form-h {
  text-align: center; font-weight: bold; text-transform: uppercase;
  font-size: 14pt; margin: 0 0 1em 0; page-break-after: avoid;
}
.shdoc h2.form-h {
  text-align: center; font-weight: bold; font-size: 14pt;
  margin: 1.2em 0 0.6em 0; page-break-before: always; page-break-after: avoid;
}
.shdoc .center { text-align: center; }
.shdoc .small { font-size: 11pt; color: #000; }
.shdoc .muted { font-size: 10pt; color: #444; font-style: italic; }
table.form { border-collapse: collapse; width: 100%; margin: 0.5em 0;
             font-size: 13pt; }
table.form td, table.form th {
  border: 0.5pt solid #000; padding: 4pt 6pt; vertical-align: top;
  text-align: left;
}
table.form th { font-weight: bold; text-align: center; }
table.form.noborder td { border: 0; padding: 2pt 4pt; }
.kalendar td, .kalendar th { text-align: center; }
.kalendar td.work { text-align: left; }
.kalendar .wk { width: 12mm; }
.seal-box {
  border: 0.5pt solid #000; min-height: 16mm; width: 38mm;
  text-align: center; font-style: italic; color: #444; padding-top: 6mm;
}
.sig-line {
  display: inline-block; min-width: 55mm; border-bottom: 0.5pt solid #000;
  height: 1em;
}
.sig-cap { font-size: 10pt; color: #444; }
.blank-line {
  display: block; border-bottom: 0.5pt solid #000; height: 1.4em;
  margin: 0.2em 0;
}
.review-blank { min-height: 60mm; }
"""


def _load_shodennyk_data(path: Path) -> dict:
    raw = path.read_text(encoding="utf-8")
    m = re.search(r"```ya?ml\s*(.*?)```", raw, re.DOTALL)
    payload = m.group(1) if m else raw
    try:
        import yaml
    except ImportError:
        sys.exit("PyYAML required: pip install pyyaml (into thesis/.venv)")
    data = yaml.safe_load(payload)
    if not isinstance(data, dict):
        sys.exit(f"{path.name}: expected a YAML mapping of form fields")
    return data


def _esc(v) -> str:
    return html.escape("" if v is None else str(v))


def _sig(caption: str) -> str:
    return (f'<div><span class="sig-line"></span>'
            f'<div class="sig-cap">{_esc(caption)}</div></div>')


def _title_block(d: dict) -> str:
    rows = [
        ("Інститут, факультет", d.get("institute", "")),
        ("Кафедра, циклова комісія", d.get("kafedra", "")),
        ("освітньо-кваліфікаційний рівень", d.get("level", "Бакалавр")),
        ("спеціальність", d.get("specialty", "")),
        ("освітня програма", d.get("opp", "")),
        ("курс, група", f'{d.get("course", "")}  {d.get("group", "")}'),
    ]
    meta = "".join(
        f'<tr><td class="small">{_esc(k)}</td><td>{_esc(v)}</td></tr>'
        for k, v in rows)
    return (
        '<section class="sheet shdoc">'
        f'<p class="center">{_esc(d.get("ministry", "МІНІСТЕРСТВО ОСВІТИ І НАУКИ УКРАЇНИ"))}</p>'
        f'<p class="center"><strong>{_esc(d.get("university", "Національний університет «Одеська політехніка»"))}</strong></p>'
        '<div class="tp-gap"></div>'
        '<h1 class="form-h">Щоденник практики</h1>'
        f'<p class="center">{_esc(d.get("practice_kind", "переддипломна"))}</p>'
        '<p class="center muted">(вид і назва практики)</p>'
        '<div class="tp-gap"></div>'
        f'<p class="center"><strong>{_esc(d.get("student", ""))}</strong></p>'
        '<p class="center muted">(прізвище, ім’я, по батькові)</p>'
        '<div class="tp-gap"></div>'
        '<table class="form">' + meta + '</table>'
        '<div class="tp-gap"></div>'
        f'<p>Підприємство, організація, установа: <strong>{_esc(d.get("enterprise", ""))}</strong></p>'
        f'<p>Період практики: {_esc(d.get("practice_start", ""))} – {_esc(d.get("practice_end", ""))}</p>'
        '</section>')


def _pribuv_vybuv(d: dict) -> str:
    arrival = d.get("arrival_date", d.get("practice_start", ""))
    departure = d.get("departure_date", d.get("practice_end", ""))
    enterprise = d.get("enterprise", "")
    return (
        '<section class="sheet shdoc">'
        '<h2 class="form-h">Відмітки про прибуття та вибуття</h2>'
        f'<p>Прибув на підприємство, організацію, установу: '
        f'<strong>{_esc(enterprise)}</strong></p>'
        '<table class="form noborder"><tr>'
        f'<td>« {_esc(arrival)} »</td>'
        '<td><div class="seal-box">М.П.</div></td>'
        f'<td>{_sig("посада, прізвище та ініціали відповідальної особи")}</td>'
        '</tr></table>'
        f'<p>Вибув з підприємства, організації, установи: '
        f'<strong>{_esc(enterprise)}</strong></p>'
        '<table class="form noborder"><tr>'
        f'<td>« {_esc(departure)} »</td>'
        '<td><div class="seal-box">М.П.</div></td>'
        f'<td>{_sig("посада, прізвище та ініціали відповідальної особи")}</td>'
        '</tr></table>'
        '</section>')


def _indyvidualne_zavdannia(d: dict) -> str:
    task = d.get("individual_task", "")
    body = (f'<p>{_esc(task)}</p>' if task
            else '<span class="blank-line"></span><span class="blank-line"></span>')
    return ('<section class="sheet shdoc">'
            '<h2 class="form-h">Індивідуальне завдання</h2>'
            f'{body}</section>')


def _kalendar_grafik(d: dict) -> str:
    items = d.get("calendar", []) or []
    rows = []
    for it in items:
        weeks = set(it.get("weeks", []) or [])
        cells = "".join(
            f'<td class="wk">{"х" if w in weeks else ""}</td>'
            for w in (1, 2, 3, 4))
        rows.append(
            f'<tr><td>{_esc(it.get("n", ""))}</td>'
            f'<td class="work">{_esc(it.get("work", ""))}</td>'
            f'{cells}<td></td></tr>')
    return (
        '<section class="sheet shdoc">'
        '<h2 class="form-h">Календарний графік проходження практики</h2>'
        '<table class="form kalendar">'
        '<tr><th rowspan="2">№<br/>з/п</th><th rowspan="2">Назви робіт</th>'
        '<th colspan="4">Тижні проходження практики</th>'
        '<th rowspan="2">Відмітки про виконання</th></tr>'
        '<tr><th class="wk">1</th><th class="wk">2</th>'
        '<th class="wk">3</th><th class="wk">4</th></tr>'
        + "".join(rows) +
        '</table>'
        '<div class="tp-gap"></div>'
        '<table class="form noborder"><tr>'
        f'<td>Керівник практики від університету</td><td>{_sig("підпис")}</td>'
        f'<td>{_esc(d.get("kerivnyk_vnz", ""))}</td></tr></table>'
        '</section>')


def _robochi_zapysy(d: dict) -> str:
    entries = d.get("work_entries", []) or []
    rows = []
    for e in entries:
        period = f'{_esc(e.get("from", ""))} – {_esc(e.get("to", ""))}'
        rows.append(f'<tr><td style="width:42mm">{period}</td>'
                    f'<td>{_esc(e.get("text", ""))}</td></tr>')
    return (
        '<section class="sheet shdoc">'
        '<h2 class="form-h">Робочі записи під час практики</h2>'
        '<table class="form"><tr><th>Період</th>'
        '<th>Зміст виконаних робіт</th></tr>'
        + "".join(rows) + '</table></section>')


def _vidhuk_pidpryemstva(d: dict) -> str:
    review = d.get("enterprise_review", "")
    body = (f'<p>{_esc(review)}</p>' if review
            else '<div class="blank-line review-blank"></div>')
    return (
        '<section class="sheet shdoc">'
        '<h2 class="form-h">Відгук і оцінка роботи здобувача на практиці</h2>'
        f'<p>{_esc(d.get("enterprise", ""))}</p>'
        '<p class="muted">(назва підприємства, організації, установи)</p>'
        f'{body}'
        '<div class="tp-gap"></div>'
        '<table class="form noborder"><tr>'
        '<td>Керівник практики від підприємства, організації, установи</td>'
        f'<td>{_sig("підпис")}</td>'
        f'<td>{_esc(d.get("kerivnyk_pidpryemstva", ""))}</td></tr></table>'
        '<div class="seal-box">М.П.</div>'
        '</section>')


def _vidhuk_kerivnyka(d: dict) -> str:
    return (
        '<section class="sheet shdoc">'
        '<h2 class="form-h">Відгук керівника практики від університету</h2>'
        '<p>Висновок керівника практики від університету про проходження практики:</p>'
        '<div class="blank-line review-blank"></div>'
        '<div class="tp-gap"></div>'
        '<table class="form noborder"><tr>'
        '<td>Керівник практики від університету</td>'
        f'<td>{_sig("підпис")}</td>'
        f'<td>{_esc(d.get("kerivnyk_vnz", ""))}</td></tr></table>'
        '</section>')


def _ocinka(d: dict) -> str:
    return (
        '<section class="sheet shdoc">'
        '<h2 class="form-h">Оцінка</h2>'
        '<table class="form">'
        '<tr><td>Дата складання заліку</td><td>«___» __________ 20__ р.</td></tr>'
        '<tr><td>Оцінка за національною шкалою</td><td></td></tr>'
        '<tr><td>Кількість балів</td><td></td></tr>'
        '<tr><td>За шкалою ECTS</td><td></td></tr>'
        '</table>'
        '<div class="tp-gap"></div>'
        '<table class="form noborder"><tr>'
        '<td>Керівник практики від університету</td>'
        f'<td>{_sig("підпис")}</td>'
        f'<td>{_esc(d.get("kerivnyk_vnz", ""))}</td></tr></table>'
        '</section>')


def render_shodennyk(d: dict) -> str:
    return "".join([
        _title_block(d),
        _pribuv_vybuv(d),
        _indyvidualne_zavdannia(d),
        _kalendar_grafik(d),
        _robochi_zapysy(d),
        _vidhuk_pidpryemstva(d),
        _vidhuk_kerivnyka(d),
        _ocinka(d),
    ])


def build_shodennyk():
    data = _load_shodennyk_data(HERE / "shodennyk-data.md")
    body = render_shodennyk(data)
    doc = (f"<!DOCTYPE html><html lang='uk'><head><meta charset='utf-8'>"
           f"<style>{bp.CSS}{SHODENNYK_CSS}</style></head><body>"
           f"{body}</body></html>")
    (HERE / "shodennyk.html").write_text(doc, encoding="utf-8")
    from weasyprint import HTML
    out_pdf = HERE / "shodennyk.pdf"
    HTML(string=doc, base_url=str(HERE)).write_pdf(str(out_pdf))
    print(f"OK -> {out_pdf}")


def main():
    target = sys.argv[1] if len(sys.argv) > 1 else "both"
    if target in ("zvit", "both"):
        build_zvit()
    if target in ("shodennyk", "both"):
        build_shodennyk()


if __name__ == "__main__":
    main()
