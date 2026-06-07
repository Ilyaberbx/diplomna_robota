#!/usr/bin/env python3
"""Assemble thesis/*.md into a single RULES.md-conformant PDF.

Fonts: Liberation Serif (metric-compatible Times New Roman),
Liberation Mono (metric-compatible Courier New).
Layout: A4, margins L25/R10/T20/B20 mm, TNR 14pt, line-height 1.5,
justified, first-line indent 1.25cm, page number top-right (not on title).
"""
import html
import re
import sys
from pathlib import Path

import markdown as md

HERE = Path(__file__).parent
ORDER = [
    "00-tytulnyi-arkush.md", "01-anotaciya.md", "02-zmist.md", "03-vstup.md",
    "04-rozdil-1.md", "05-rozdil-2.md", "06-rozdil-3.md", "07-rozdil-4.md",
    "08-rozdil-5.md", "09-rozdil-6.md", "10-rozdil-7.md",
    "11-zagalni-vysnovky.md", "12-spysok-dzherel.md", "13-dodatky.md",
]

STRUCT = re.compile(
    r"^(АНОТАЦІЯ|ABSTRACT|ЗМІСТ|ВСТУП|ЗАГАЛЬНІ ВИСНОВКИ|"
    r"СПИСОК ВИКОРИСТАНИХ ДЖЕРЕЛ)$")
CHAPTER = re.compile(r"^\d+\s+[А-ЯІЇЄҐ’A-Z][А-ЯІЇЄҐ’A-Z \-]+$")
APPENDIX = re.compile(r"^ДОДАТОК\s+[А-ЯБВГ]$")
SUB3 = re.compile(r"^\d+\.\d+\.\d+\s+\S")
SUB2 = re.compile(r"^\d+\.\d+\s+\S")
CONCL = re.compile(r"^Висновки до розділу\s+\d+")
FIGCAP = re.compile(r"^Рисунок\s+[\dА-Я]")
TBLCAP = re.compile(r"^(Таблиця|Сценарій|Лістинг)\s+[\dА-Я]")
RULECAP = re.compile(r"^(Сценарій|Лістинг)\s+[\dА-Я]")
FORMULA = re.compile(r"^(.*?)\s*(\(\d\.\d\))\s*$")
LISTITEM = re.compile(r"^[–-]\s+\S")
NUMITEM = re.compile(r"^\d+\.\s+\S")


def inline(s: str) -> str:
    s = html.escape(s)
    # Real sub/superscripts (RULES §9): author writes `_{...}` / `^{...}`.
    # Done before strong/em so inner *italic* indices are still processed,
    # e.g. `*s*_{*x*}` -> <em>s</em><sub><em>x</em></sub>. A bare `_`/`^`
    # not followed by `{` (e.g. __drizzle_migrations, STORAGE_DIR) is left as-is.
    s = re.sub(r"_\{([^{}]*)\}", r"<sub>\1</sub>", s)
    s = re.sub(r"\^\{([^{}]*)\}", r"<sup>\1</sup>", s)
    s = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", s)
    s = re.sub(r"(?<!\*)\*(?!\s)(.+?)(?<!\s)\*(?!\*)", r"<em>\1</em>", s)
    return s


def strip_formatting_comment(text: str) -> str:
    return re.sub(r"<!--.*?-->", "", text, flags=re.DOTALL).strip()


def highlight_code(code: str, lang: str) -> str:
    """Listing body with coloured syntax highlighting (RULES §6).

    Pygments emits <span class="k|s|c1|…"> tokens (nowrap → no wrapper div);
    the muted palette for those classes lives in the CSS. Falls back to plain
    escaped text if the language is unknown or Pygments is unavailable.
    """
    try:
        from pygments import highlight
        from pygments.lexers import get_lexer_by_name
        from pygments.formatters import HtmlFormatter
        lexer = get_lexer_by_name(lang or "text")
        body = highlight(code, lexer, HtmlFormatter(nowrap=True)).rstrip("\n")
    except Exception:
        body = html.escape(code)
    return '<pre class="code"><code>' + body + "</code></pre>"


def title_class(line: str) -> str:
    if line.startswith("МІНІСТЕРСТВО"):
        return "tp-min"
    if line.startswith("НАЦІОНАЛЬНИЙ УНІВЕРСИТЕТ"):
        return "tp-uni"
    if line.startswith("КВАЛІФІКАЦІЙНА РОБОТА"):
        return "tp-qual"
    if line in ("Вебзастосунок для пошуку загублених домашніх тварин",):
        return "tp-theme"
    if line.endswith(":") and line in (
        "Спеціальність:", "Освітньо-професійна програма:", "Керівник:"):
        return "tp-it"
    return "tp"


def render_title(lines):
    out = ['<section class="sheet title-page">']
    for ln in lines:
        ln = ln.strip()
        if not ln:
            out.append('<div class="tp-gap"></div>')
            continue
        out.append(f'<p class="{title_class(ln)}">{inline(ln)}</p>')
    out.append("</section>")
    return "\n".join(out)


TOC_ROW = re.compile(r"^(.*?)\s*\.{2,}\s*(\d+)\s*$")


def toc_level(label: str) -> str:
    if re.match(r"^Висновки до розділу\s+\d+", label):
        return "lvl2"
    if re.match(r"^\d+\.\d+", label):
        return "lvl1"
    return "lvl0"


def render_toc(text):
    parts = ['<section class="sheet" data-f="toc">',
             '<h1 class="struct">ЗМІСТ</h1>', '<div class="toc-wrap">']
    for ln in text.split("\n"):
        s = ln.strip()
        if not s or s == "ЗМІСТ":
            continue
        m = TOC_ROW.match(s)
        if not m:
            parts.append(
                f'<div class="toc-row lvl0"><span class="t">'
                f'{inline(s)}</span></div>')
            continue
        label, page = m.group(1).strip(), m.group(2)
        parts.append(
            f'<div class="toc-row {toc_level(label)}">'
            f'<span class="t">{inline(label)}</span>'
            f'<span class="dots"></span>'
            f'<span class="p">{page}</span></div>')
    parts.append("</div></section>")
    return "\n".join(parts)


def render_body(fname, text):
    lines = text.split("\n")
    parts = [f'<section class="sheet" data-f="{fname}">']
    para, plist = [], []
    i, n = 0, len(lines)
    appendix_title_pending = False
    # The reference bibliography (RULES §11 + §1.1) is a sequence of normal
    # paragraphs: first line indented 1.25 cm, wrapped lines flush at the
    # left margin, justified — NOT a hanging list block.
    is_refs = fname == "12-spysok-dzherel.md"

    def flush_para():
        if para:
            parts.append(
                '<p class="n">' + " ".join(para).strip() + "</p>")
            para.clear()

    def flush_list():
        if plist:
            parts.append('<ul class="lst">' + "".join(plist) + "</ul>")
            plist.clear()

    while i < n:
        raw = lines[i]
        line = raw.strip()

        if line.startswith("```"):
            flush_para(); flush_list()
            lang = line[3:].strip()
            i += 1
            code = []
            while i < n and not lines[i].strip().startswith("```"):
                code.append(lines[i])
                i += 1
            i += 1
            parts.append(highlight_code("\n".join(code), lang))
            parts.append('<hr class="rule"/>')
            continue

        if line.startswith("|"):
            flush_para(); flush_list()
            tbl = []
            while i < n and lines[i].strip().startswith("|"):
                tbl.append(lines[i]); i += 1
            parts.append(md.markdown("\n".join(tbl),
                                     extensions=["tables"]))
            continue

        if not line:
            flush_para(); flush_list()
            i += 1
            continue

        if appendix_title_pending:
            parts.append(f'<p class="appx-title">{inline(line)}</p>')
            appendix_title_pending = False
            i += 1
            continue

        if APPENDIX.match(line):
            flush_para(); flush_list()
            parts.append(f'<h1 class="struct apx">{inline(line)}</h1>')
            appendix_title_pending = True
            i += 1
            continue

        if STRUCT.match(line) or CHAPTER.match(line):
            flush_para(); flush_list()
            parts.append(f'<h1 class="struct">{inline(line)}</h1>')
            i += 1
            continue

        if CONCL.match(line):
            flush_para(); flush_list()
            parts.append(f'<h2 class="concl">{inline(line)}</h2>')
            i += 1
            continue

        if SUB3.match(line):
            flush_para(); flush_list()
            parts.append(f'<h3>{inline(line)}</h3>')
            i += 1
            continue

        if SUB2.match(line):
            flush_para(); flush_list()
            parts.append(f'<h2>{inline(line)}</h2>')
            i += 1
            continue

        if FIGCAP.match(line):
            flush_para(); flush_list()
            num = re.match(r"^Рисунок\s+(\d+)\.(\d+)", line)
            img_rel = None
            if num:
                cand = HERE / "figures" / f"{num.group(1)}-{num.group(2)}.png"
                if cand.exists():
                    img_rel = f"figures/{num.group(1)}-{num.group(2)}.png"
            if img_rel:
                parts.append(
                    f'<figure class="fig">'
                    f'<img class="fig-img" src="{img_rel}"/>'
                    f'<figcaption class="cap-fig">{inline(line)}</figcaption>'
                    f'</figure>')
            else:
                parts.append(f'<p class="cap-fig">{inline(line)}</p>')
            i += 1
            continue

        if TBLCAP.match(line) and line.startswith("Таблиця"):
            flush_para(); flush_list()
            j = i + 1
            while j < n and not lines[j].strip():
                j += 1
            table_follows = j < n and lines[j].strip().startswith("|")
            if table_follows:
                tbl = []
                k = j
                while k < n and lines[k].strip().startswith("|"):
                    tbl.append(lines[k]); k += 1
                parts.append(
                    '<div class="tbl-block">'
                    f'<p class="cap-tbl">{inline(line)}</p>'
                    + md.markdown("\n".join(tbl), extensions=["tables"])
                    + '</div>')
                i = k
                continue
            parts.append(f'<p class="cap-tbl">{inline(line)}</p>')
            i += 1
            continue

        if TBLCAP.match(line):
            flush_para(); flush_list()
            parts.append(f'<p class="cap-tbl">{inline(line)}</p>')
            if RULECAP.match(line):
                parts.append('<hr class="rule"/>')
            i += 1
            continue

        fm = FORMULA.match(line)
        if fm and "=" in fm.group(1):
            flush_para(); flush_list()
            parts.append(
                f'<p class="formula"><span class="fbody">'
                f'{inline(fm.group(1))}</span>'
                f'<span class="fnum">{inline(fm.group(2))}</span></p>')
            i += 1
            continue

        if LISTITEM.match(line):
            flush_para()
            plist.append(f'<li>{inline(line[1:].strip())}</li>')
            i += 1
            continue

        if NUMITEM.match(line) and is_refs:
            flush_para(); flush_list()
            parts.append(f'<p class="ref">{inline(line)}</p>')
            i += 1
            continue

        if NUMITEM.match(line):
            flush_para()
            plist.append(f'<li class="num">{inline(line)}</li>')
            i += 1
            continue

        flush_list()
        para.append(inline(line))
        i += 1

    flush_para(); flush_list()
    parts.append("</section>")
    return "\n".join(parts)


CSS = """
@page {
  size: A4;
  margin: 20mm 10mm 20mm 25mm;
  @top-right {
    content: counter(page);
    font-family: 'Liberation Serif', serif;
    font-size: 14pt; color: #000;
  }
}
@page :first { @top-right { content: normal; } }
* { box-sizing: border-box; }
body {
  font-family: 'Liberation Serif', 'Times New Roman', serif;
  font-size: 14pt; line-height: 1.5; color: #000;
  text-align: justify; hyphens: auto;
  orphans: 2; widows: 2;
}
sub { vertical-align: sub; font-size: 0.75em; line-height: 0; }
sup { vertical-align: super; font-size: 0.75em; line-height: 0; }
h1.struct, h1.apx { page-break-before: always; }
p.n { text-indent: 12.5mm; margin: 0; }
ul.lst { margin: 0; padding-left: 12.5mm; list-style: none; }
ul.lst li { text-indent: 0; margin: 0; }
ul.lst li::before { content: "– "; }
ul.lst li.num::before { content: ""; }
h1.struct {
  text-align: center; font-weight: bold; text-transform: uppercase;
  font-size: 14pt; text-indent: 0; margin: 0 0 1.5em 0;
  page-break-after: avoid;
}
hr.rule { border: 0; border-top: 0.25pt solid #000; margin: 0.2em 0; }
h1.apx { margin-bottom: 0.2em; }
p.appx-title {
  text-align: center; text-indent: 0; margin: 0 0 1.5em 0;
  page-break-after: avoid;
}
h2, h3 {
  font-weight: bold; font-size: 14pt; text-align: left;
  text-indent: 12.5mm; margin: 1.5em 0 1.5em 0; page-break-after: avoid;
}
h2.concl {
  text-indent: 12.5mm; text-transform: none;
}
h3 { margin: 1em 0 0 0; }
.toc-wrap { text-align: left; }
.toc-row {
  display: flex; align-items: baseline; margin: 0; line-height: 1.5;
  text-indent: 0; hyphens: none;
}
.toc-row .t { white-space: nowrap; }
.toc-row .dots {
  flex: 1; margin: 0 3px; align-self: stretch;
  border-bottom: 1px dotted #000; transform: translateY(-0.32em);
}
.toc-row .p { white-space: nowrap; }
.toc-row.lvl0 { padding-left: 0; }
.toc-row.lvl1 { padding-left: 5mm; }
.toc-row.lvl2 { padding-left: 12.5mm; }
figure.fig {
  page-break-inside: avoid; text-align: center; margin: 1.5em 0;
}
figure.fig img.fig-img {
  max-width: 165mm; max-height: 130mm; display: block;
  margin: 0 auto 0.3em auto;
}
p.cap-fig, figcaption.cap-fig {
  text-align: center; text-indent: 0; margin: 0.3em 0 1em 0;
}
p.cap-fig { margin: 1em 0; }
p.ref { text-indent: 12.5mm; margin: 0; text-align: justify; }
div.tbl-block { page-break-inside: avoid; margin: 1em 0; }
div.tbl-block p.cap-tbl { margin: 0 0 0.1em 0; }
div.tbl-block table { margin: 0; }
p.cap-tbl { text-align: left; text-indent: 12.5mm; margin: 1em 0 0.3em 0; }
p.formula {
  position: relative; text-align: center; text-indent: 0;
  margin: 1.5em 0; padding: 0 14mm;
}
p.formula .fnum { position: absolute; right: 0; }
pre.code {
  font-family: 'Liberation Mono', 'Courier New', monospace;
  font-size: 10pt; line-height: 1.0; text-align: left;
  white-space: pre-wrap; word-break: break-word;
  border: 0; padding: 2pt 0; margin: 0.2em 0;
}
pre.code code { font-family: inherit; }
/* coloured syntax highlighting for listings (RULES §6), muted print palette */
pre.code .k, pre.code .kd, pre.code .kr, pre.code .kc,
pre.code .kn, pre.code .kt, pre.code .nt { color: #00007f; font-weight: bold; }
pre.code .s, pre.code .s1, pre.code .s2, pre.code .sb,
pre.code .se, pre.code .sr, pre.code .sd { color: #007f00; }
pre.code .c, pre.code .c1, pre.code .cm, pre.code .cs { color: #6f6f6f; font-style: italic; }
pre.code .mi, pre.code .mf, pre.code .mh, pre.code .mo, pre.code .m { color: #7f3f00; }
pre.code .nb, pre.code .bp { color: #7f007f; }
pre.code .nf, pre.code .nx, pre.code .nc, pre.code .o, pre.code .p { color: #000; }
table {
  border-collapse: collapse; width: 100%; font-size: 12pt;
  margin: 0.5em 0; page-break-inside: avoid;
}
/* §5 allows single–1.5 spacing inside tables; single-ish keeps dense tables
   on one page so a caption never orphans onto a near-empty page. */
th, td { border: 0.5pt solid #000; padding: 2pt 4pt; text-align: left;
         vertical-align: top; line-height: 1.15; }
th { font-weight: bold; }
tr { page-break-inside: avoid; }
/* title page */
.title-page p { text-align: center; text-indent: 0; margin: 0; }
.title-page .tp-gap { height: 1.5em; }
.tp-min { font-size: 12pt; font-weight: bold; text-transform: uppercase; }
.tp-uni { font-weight: bold; text-transform: uppercase; }
.tp-qual { font-size: 16pt; font-weight: bold; text-transform: uppercase; }
.tp-theme { font-weight: bold; }
.tp-it { font-style: italic; }
"""


def main():
    sections = []
    for fname in ORDER:
        p = HERE / fname
        if not p.exists():
            print(f"skip missing {fname}", file=sys.stderr)
            continue
        text = strip_formatting_comment(p.read_text(encoding="utf-8"))
        if fname == "00-tytulnyi-arkush.md":
            sections.append(render_title(text.split("\n")))
        elif fname == "02-zmist.md":
            sections.append(render_toc(text))
        else:
            sections.append(render_body(fname, text))
    doc = (f"<!DOCTYPE html><html lang='uk'><head><meta charset='utf-8'>"
           f"<style>{CSS}</style></head><body>"
           f"{''.join(sections)}</body></html>")
    out_html = HERE / "diploma.html"
    out_html.write_text(doc, encoding="utf-8")
    from weasyprint import HTML
    out_pdf = HERE / "diploma.pdf"
    HTML(string=doc, base_url=str(HERE)).write_pdf(str(out_pdf))
    print(f"OK -> {out_pdf}")


if __name__ == "__main__":
    main()
