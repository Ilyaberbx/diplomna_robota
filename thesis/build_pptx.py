#!/usr/bin/env python3
"""Build the defense presentation (thesis/presentation.pptx).

Mirrors build_pdf.py in spirit: a single reproducible script that turns the
already-written thesis into the deliverable. Uses sample-presentation-2.pptx as
the *style template* (theme, masters, layouts, fonts, 16:9), strips its content
slides, and rebuilds the canonical slide sequence from PRESENTATION-RULES.md.

Verbatim content (мета / задачі / об'єкт / предмет / висновки) is extracted
straight from the thesis markdown so the /grill-presentation word-for-word
cross-check is byte-identical. Diagrams reuse the thesis figures; the control
example uses the fresh presentation-only screenshots in figures/presentation/.
"""
from __future__ import annotations

import re
import struct
import uuid
from copy import deepcopy
from pathlib import Path

from PIL import Image
from pptx import Presentation
from pptx.util import Pt, Emu
from pptx.enum.shapes import PP_PLACEHOLDER
from pptx.enum.text import PP_ALIGN
from pptx.oxml.ns import qn

HERE = Path(__file__).resolve().parent
REPO = HERE.parent
TEMPLATE = REPO / "docs/diploma-rules/references/sample-presentation-2.pptx"
FIG = HERE / "figures"
DEMO = FIG / "presentation"
ASSETS = HERE / ".pptx_assets"  # right-sized image copies; figures/ stays immutable
OUT = HERE / "presentation.pptx"

EMU = 914400
# Image-slide titles are set to 28pt (vs the master's 40pt) so even the longest
# "Контрольний приклад: …" stays on ONE line. IMG_TOP=1.9" still clears a 2-line
# title as a safety margin, and IMG_MAX_H keeps the image off the bottom edge.
TITLE_FONT_PT = 28
IMG_TOP = 1.90
IMG_MAX_W = 11.8
IMG_MAX_H = 5.10  # 1.90 + 5.10 = 7.00" of 7.50"
# Keep full source resolution for every image (only cap the longest side to bound
# file size). Quality over size — view in Slideshow / desktop PowerPoint, since
# PowerPoint Online recompresses anything above ~220 PPI on its own side.
IMG_MAX_SIDE = 4000

THEME = "Вебзастосунок для пошуку загублених домашніх тварин"


# --------------------------------------------------------------------------- #
# Verbatim extraction from the thesis markdown                                  #
# --------------------------------------------------------------------------- #
def read(name: str) -> str:
    return (HERE / name).read_text(encoding="utf-8")


def extract_intro() -> dict[str, object]:
    vstup = read("03-vstup.md")
    meta = re.search(r"Метою роботи є[\s\S]*?про знахідку\.", vstup).group(0).strip()
    connector = "Для досягнення поставленої мети необхідно вирішити такі задачі:"
    region = vstup[vstup.index("такі задачі:") + len("такі задачі:") : vstup.index("**Об")]
    tasks = [t.strip().rstrip(";.") for t in re.findall(r"–\s+(.+)", region) if t.strip()]
    obj = re.search(r"Об.єктом роботи є[\s\S]*?про знахідку\.", vstup).group(0).strip()
    subj = re.search(r"Предметом роботи є[\s\S]*?людиною\.", vstup).group(0).strip()
    return {"meta": meta, "connector": connector, "tasks": tasks, "obj": obj, "subj": subj}


def extract_conclusions() -> list[str]:
    v = read("11-zagalni-vysnovky.md")

    def grab(pattern: str) -> str:
        return re.search(pattern, v, re.S).group(0).strip()

    bullets = [
        grab(r"У кваліфікаційній роботі вирішено задачу[\s\S]*?про знахідку\."),
        grab(r"Аналіз аналогів — сервісу PawBoost[\s\S]*?не приховує контактні дані до підтвердження\."),
        grab(r"Для обчислення відстані застосовано формулу гаверсинуса[\s\S]*?природний пріоритет ознак\."),
        grab(r"На основі проєктних рішень реалізовано вебзастосунок[\s\S]*?PostgreSQL\."),
        grab(r"автоматизований набір із 130 серверних і 44 клієнтських тестів[\s\S]*?без помилок\."),
        # Rule §3/§7: close with "задачі виконано, мету досягнуто". First clause
        # is verbatim from the thesis; the "мету" clause is the mandated closing.
        "Поставлені в роботі задачі виконано повністю, мету роботи досягнуто.",
    ]
    return bullets


# --------------------------------------------------------------------------- #
# Low-level slide helpers                                                       #
# --------------------------------------------------------------------------- #
def png_size(path: Path) -> tuple[int, int]:
    with path.open("rb") as f:
        head = f.read(24)
    # PNG: width/height are big-endian uint32 at byte offset 16.
    w, h = struct.unpack(">II", head[16:24])
    return w, h


def strip_content_slides(prs: Presentation) -> None:
    """Drop the template's content slides — both the sldId entries and the
    underlying slide parts (via their relationships) so they don't linger in
    the saved package as duplicate zip entries."""
    lst = prs.slides._sldIdLst
    for sld in list(lst):
        rId = sld.get(qn("r:id"))
        prs.part.drop_rel(rId)
        lst.remove(sld)


def layout(prs: Presentation, name: str):
    for lay in prs.slide_layouts:
        if lay.name == name:
            return lay
    raise KeyError(name)


def remove_slide_number(slide) -> None:
    for ph in list(slide.placeholders):
        if ph.placeholder_format.type == PP_PLACEHOLDER.SLIDE_NUMBER:
            ph._element.getparent().remove(ph._element)


def add_slide_number(slide, number: int) -> None:
    """Attach an explicit sldNum placeholder (cloned from the layout) carrying a
    slidenum field, so numbering is both rendered and machine-detectable."""
    src = None
    for ph in slide.slide_layout.placeholders:
        if ph.placeholder_format.type == PP_PLACEHOLDER.SLIDE_NUMBER:
            src = ph._element
            break
    if src is None:
        return
    sp = deepcopy(src)
    txBody = sp.find(qn("p:txBody"))
    for p in txBody.findall(qn("a:p")):
        txBody.remove(p)
    p = txBody.makeelement(qn("a:p"), {})
    fld = p.makeelement(qn("a:fld"), {"id": "{%s}" % str(uuid.uuid4()).upper(), "type": "slidenum"})
    t = fld.makeelement(qn("a:t"), {})
    t.text = str(number)
    fld.append(t)
    p.append(fld)
    txBody.append(p)
    slide.shapes._spTree.append(sp)


def _pPr(p):
    return p._p.get_or_add_pPr()


def set_no_bullet(p) -> None:
    pPr = _pPr(p)
    for tag in ("a:buChar", "a:buAutoNum", "a:buNone"):
        e = pPr.find(qn(tag))
        if e is not None:
            pPr.remove(e)
    pPr.append(pPr.makeelement(qn("a:buNone"), {}))


def set_bullet(p) -> None:
    pPr = _pPr(p)
    pPr.set("marL", "342900")
    pPr.set("indent", "-342900")
    for tag in ("a:buNone", "a:buChar", "a:buAutoNum"):
        e = pPr.find(qn(tag))
        if e is not None:
            pPr.remove(e)
    pPr.append(pPr.makeelement(qn("a:buFont"), {"typeface": "Arial"}))
    pPr.append(pPr.makeelement(qn("a:buChar"), {"char": "•"}))


def fill_body(body, paragraphs: list[dict]) -> None:
    """paragraphs: list of {text, size, bold?, bullet?}."""
    tf = body.text_frame
    tf.word_wrap = True
    tf.clear()
    for i, spec in enumerate(paragraphs):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.text = spec["text"]
        p.alignment = PP_ALIGN.LEFT
        run = p.runs[0]
        run.font.size = Pt(spec["size"])
        run.font.bold = spec.get("bold", False)
        if spec.get("bullet"):
            set_bullet(p)
        else:
            set_no_bullet(p)
        p.space_after = Pt(spec.get("space_after", 6))


def fit_image(image: Path) -> Path:
    """Keep full source resolution; only downscale if the longest side exceeds
    IMG_MAX_SIDE (bounds file size). Never upscale. Diagrams and screenshots both
    stay crisp when zoomed — no shrinking to the small display box."""
    with Image.open(image) as im:
        nw, nh = im.size
        longest = max(nw, nh)
        if longest <= IMG_MAX_SIDE:
            return image
        ASSETS.mkdir(exist_ok=True)
        out = ASSETS / image.name
        scale = IMG_MAX_SIDE / longest
        im.resize((round(nw * scale), round(nh * scale)), Image.LANCZOS).save(
            out, "PNG", optimize=True
        )
        return out


def add_image_slide(prs, title_text: str, image: Path, number: int):
    slide = prs.slides.add_slide(layout(prs, "TITLE_ONLY"))
    slide.shapes.title.text = title_text
    for run in slide.shapes.title.text_frame.paragraphs[0].runs:
        run.font.size = Pt(TITLE_FONT_PT)  # keep long titles on one line
    w_px, h_px = png_size(image)
    ratio = w_px / h_px
    max_w = Emu(int(IMG_MAX_W * EMU))
    max_h = Emu(int(IMG_MAX_H * EMU))
    if max_w / ratio <= max_h:
        width = max_w
        height = Emu(int(max_w / ratio))
    else:
        height = max_h
        width = Emu(int(max_h * ratio))
    src = fit_image(image)
    left = Emu(int((prs.slide_width - width) / 2))
    # Center within the band below the title.
    top = Emu(int(IMG_TOP * EMU + (max_h - height) / 2))
    slide.shapes.add_picture(str(src), left, top, width, height)
    add_slide_number(slide, number)
    return slide


def set_notes(slide, text: str) -> None:
    slide.notes_slide.notes_text_frame.text = text


# --------------------------------------------------------------------------- #
# Build                                                                         #
# --------------------------------------------------------------------------- #
def build() -> None:
    intro = extract_intro()
    conclusions = extract_conclusions()

    prs = Presentation(str(TEMPLATE))
    strip_content_slides(prs)

    n = 0  # running slide number (title is unnumbered)

    # 1 — Title -------------------------------------------------------------- #
    s = prs.slides.add_slide(layout(prs, "TITLE"))
    s.shapes.title.text = THEME
    sub = s.placeholders[1].text_frame
    sub.clear()
    sub_lines = [
        ("Кваліфікаційна робота бакалавра", True),
        ("Виконав: ст. гр. АС-222 Ілля Вербанов", False),
        ("Керівник: Надія Беглова, асистент каф. ІПЗ", False),
        ("Національний університет «Одеська політехніка»", False),
        ("Одеса – 2026", False),
    ]
    for i, (line, bold) in enumerate(sub_lines):
        p = sub.paragraphs[0] if i == 0 else sub.add_paragraph()
        p.text = line
        p.runs[0].font.bold = bold
        p.runs[0].font.size = Pt(16 if bold else 14)
    remove_slide_number(s)
    set_notes(s, NOTES["title"])

    # 2 — Мета і задачі ------------------------------------------------------ #
    n += 1
    s = prs.slides.add_slide(layout(prs, "TITLE_AND_BODY"))
    s.shapes.title.text = "Мета і задачі"
    paras = [
        {"text": intro["meta"], "size": 15, "bold": True, "space_after": 8},
        {"text": intro["connector"], "size": 14, "space_after": 6},
    ]
    paras += [{"text": t, "size": 14, "bullet": True, "space_after": 4} for t in intro["tasks"]]
    fill_body(s.placeholders[1], paras)
    add_slide_number(s, n)
    set_notes(s, NOTES["goal"])

    # 3 — Предмет та об'єкт --------------------------------------------------- #
    n += 1
    s = prs.slides.add_slide(layout(prs, "TITLE_AND_BODY"))
    s.shapes.title.text = "Предмет та об'єкт"
    fill_body(
        s.placeholders[1],
        [
            {"text": "Об'єкт роботи", "size": 18, "bold": True, "space_after": 4},
            {"text": intro["obj"], "size": 16, "space_after": 14},
            {"text": "Предмет роботи", "size": 18, "bold": True, "space_after": 4},
            {"text": intro["subj"], "size": 16, "space_after": 6},
        ],
    )
    add_slide_number(s, n)
    set_notes(s, NOTES["subject"])

    # 4 — Аналіз аналогів (таблиця) ------------------------------------------ #
    n += 1
    s = prs.slides.add_slide(layout(prs, "TITLE_ONLY"))
    s.shapes.title.text = "Аналіз аналогів"
    header = ["Критерій", "PawBoost", "Pet FBI", "Спільноти", "Власна розробка"]
    rows = [
        ["Структурована модель оголошення", "+", "+", "–", "+"],
        ["Автоматичне зіставлення втрати та знахідки", "–", "–", "–", "+"],
        ["Урахування відстані та дати", "частково", "частково", "–", "+"],
        ["Ранжування кандидатів", "–", "–", "–", "+"],
        ["Підтвердження збігу людиною", "–", "–", "–", "+"],
        ["Приховування контактів до підтвердження", "–", "–", "–", "+"],
        ["Безкоштовність базових функцій", "частково", "+", "+", "+"],
    ]
    n_rows, n_cols = len(rows) + 1, len(header)
    left = Emu(int(0.5 * 914400))
    top = Emu(int(1.5 * 914400))
    width = Emu(int(12.3 * 914400))
    height = Emu(int(5.0 * 914400))
    table = s.shapes.add_table(n_rows, n_cols, left, top, width, height).table
    table.columns[0].width = Emu(int(4.7 * 914400))
    for c in range(1, n_cols):
        table.columns[c].width = Emu(int(1.9 * 914400))
    for c, txt in enumerate(header):
        cell = table.cell(0, c)
        cell.text = txt
        para = cell.text_frame.paragraphs[0]
        para.runs[0].font.bold = True
        para.runs[0].font.size = Pt(13)
        para.alignment = PP_ALIGN.CENTER
    for r, row in enumerate(rows, start=1):
        for c, txt in enumerate(row):
            cell = table.cell(r, c)
            cell.text = txt
            para = cell.text_frame.paragraphs[0]
            para.runs[0].font.size = Pt(12)
            para.alignment = PP_ALIGN.LEFT if c == 0 else PP_ALIGN.CENTER
    add_slide_number(s, n)
    set_notes(s, NOTES["analogs"])

    # 5–7 — Діаграми --------------------------------------------------------- #
    n += 1
    add_image_slide(prs, "Діаграма варіантів використання системи", DEMO / "diagram-usecase.png", n)
    set_notes(prs.slides[-1], NOTES["usecase"])
    n += 1
    add_image_slide(prs, "Загальна архітектура вебзастосунку", DEMO / "diagram-arch.png", n)
    set_notes(prs.slides[-1], NOTES["arch"])
    n += 1
    add_image_slide(prs, "Схема бази даних («сутність — зв'язок»)", DEMO / "diagram-db.png", n)
    set_notes(prs.slides[-1], NOTES["db"])

    # 8 — Стек технологій ---------------------------------------------------- #
    n += 1
    s = prs.slides.add_slide(layout(prs, "TITLE_AND_BODY"))
    s.shapes.title.text = "Стек технологій"
    stack = [
        "Платформа та мова: Node.js 22 LTS, TypeScript 5.6",
        "Серверний фреймворк: NestJS 11 (модульність, впровадження залежностей)",
        "Дані: ORM Drizzle 0.44, PostgreSQL 16",
        "Валідація та обробка помилок: Zod, neverthrow",
        "Безпека: argon2id, JWT, заголовки безпеки, обмеження джерел запитів",
        "Клієнт: React 19, Vite 6, React Router, CSS-модулі",
        "Тестування: Vitest, testcontainers (ефемерна БД у контейнері)",
        "Інфраструктура: монорепозиторій pnpm + Turborepo, Docker",
    ]
    fill_body(
        s.placeholders[1],
        [{"text": t, "size": 16, "bullet": True, "space_after": 6} for t in stack],
    )
    add_slide_number(s, n)
    set_notes(s, NOTES["stack"])

    # 9–13 — Контрольний приклад --------------------------------------------- #
    demo = [
        ("Контрольний приклад: авторизація користувача", "demo-auth.png", "demo_auth"),
        ("Контрольний приклад: публічна стрічка оголошень", "demo-browse.png", "demo_browse"),
        ("Контрольний приклад: форма публікації оголошення", "demo-create.png", "demo_create"),
        ("Контрольний приклад: перелік кандидатів", "demo-candidates.png", "demo_candidates"),
        ("Контрольний приклад: підтверджений зв'язок", "demo-match.png", "demo_match"),
    ]
    for title_text, fname, note_key in demo:
        n += 1
        add_image_slide(prs, title_text, DEMO / fname, n)
        set_notes(prs.slides[-1], NOTES[note_key])

    # 14 — Загальні висновки ------------------------------------------------- #
    n += 1
    s = prs.slides.add_slide(layout(prs, "TITLE_AND_BODY"))
    s.shapes.title.text = "Загальні висновки"
    fill_body(
        s.placeholders[1],
        [{"text": b, "size": 14, "bullet": True, "space_after": 6} for b in conclusions],
    )
    add_slide_number(s, n)
    set_notes(s, NOTES["conclusions"])

    prs.save(str(OUT))
    print(f"wrote {OUT}  ({len(prs.slides._sldIdLst)} slides)")


# --------------------------------------------------------------------------- #
# Speaker notes (~6 min total). Prose, conversational defense narration.        #
# Slide bodies stay verbatim; only these notes are free prose.                  #
# --------------------------------------------------------------------------- #
NOTES = {
    "title": (
        "Доброго дня. Мене звати Ілля Вербанов, група АС-222. Тема моєї роботи — "
        "вебзастосунок для пошуку загублених домашніх тварин. Керівник роботи — "
        "Надія Беглова. Далі коротко розповім, навіщо цей застосунок і що саме зроблено."
    ),
    "goal": (
        "Коли тварина губиться, все вирішують перші дні. Власники й ті, хто знайшов "
        "тварину, шукають одне одного вручну — у різних чатах, групах, на OLX, і "
        "оголошення ніяк не зіставляються між собою. Тому мета роботи — скоротити час "
        "возз'єднання за рахунок автоматичного зіставлення оголошень про втрату та про "
        "знахідку. Щоб цього досягти, я розбив роботу на вісім задач: від дослідження "
        "області й аналізу аналогів до алгоритму зіставлення, проєктування, реалізації "
        "та тестування."
    ),
    "subject": (
        "Якщо коротко: об'єкт — це сам процес пошуку й повернення тварин через "
        "зіставлення втрати та знахідки. А предмет — те, що я безпосередньо будую: "
        "моделі, алгоритм і програмні засоби, які структуровано подають оголошення й "
        "формують ранжований перелік ймовірних збігів. Важливо, що остаточне рішення "
        "про збіг приймає людина, а не система."
    ),
    "analogs": (
        "Я подивився на три типові варіанти: PawBoost, базу Pet FBI і тематичні "
        "спільноти у соцмережах. Усі вони дозволяють опублікувати оголошення, але "
        "жоден не зіставляє втрату зі знахідкою автоматично, не ранжує кандидатів і не "
        "ховає контакти до підтвердження. Саме ці порожні клітинки в останньому "
        "стовпці й стали моєю нішею."
    ),
    "usecase": (
        "Ось основні сценарії користувача. Незалежно від того, власник це чи людина, "
        "яка знайшла тварину, шлях однаковий: опублікувати структуроване оголошення, "
        "переглянути перелік ймовірних збігів і підтвердити або відхилити зв'язок. "
        "Перегляд стрічки доступний і без реєстрації."
    ),
    "arch": (
        "Архітектурно застосунок побудований за принципом портів та адаптерів. "
        "Клієнт на React спілкується із сервером на NestJS через HTTP, а доступ до "
        "PostgreSQL ізольований за портом. Завдяки цьому модуль зв'язків не лізе "
        "напряму в таблицю оголошень, а працює через її порт — межі модулів чіткі."
    ),
    "db": (
        "База навмисно проста — лише три таблиці: користувач, оголошення і зв'язок. "
        "Цього достатньо, щоб описати всю предметну область. Зверніть увагу: єдиний "
        "ідентифікатор користувача є зовнішнім ключем для решти таблиць."
    ),
    "stack": (
        "Щодо інструментів. І клієнт, і сервер — на TypeScript, у одному "
        "монорепозиторії. Сервер на Node.js і NestJS, дані через Drizzle і PostgreSQL. "
        "Помилки повертаю як значення через neverthrow, дані валідую через Zod. Паролі "
        "— argon2id, автентифікація — JWT. Окремо відзначу тести: репозиторні тести "
        "ганяються проти справжньої бази в контейнері через testcontainers, без "
        "імітації драйвера."
    ),
    "demo_auth": (
        "Перейдемо до роботи застосунку. Користувач реєструється або входить — це "
        "звичайна форма входу українською. Після входу стають доступні особисті дії: "
        "подати оголошення, переглянути свої оголошення й збіги."
    ),
    "demo_browse": (
        "Це публічна стрічка оголошень. Її видно й без входу, але контактні дані тут "
        "приховані — їх не показують, доки збіг не підтверджено. Є фільтри за типом і "
        "видом тварини."
    ),
    "demo_create": (
        "Так виглядає публікація оголошення. Форма структурована: тип, вид, кличка, "
        "порода, забарвлення, опис, а далі — місце й дата події. Саме ці поля потім "
        "використовує алгоритм зіставлення."
    ),
    "demo_candidates": (
        "А ось головне — перелік кандидатів для конкретного оголошення про втрату. "
        "Система сама підібрала оголошення про знахідку того ж виду поблизу і "
        "впорядкувала їх: спершу за збігом виду, потім за відстанню, потім за різницею "
        "дат. Власнику лишається переглянути й запропонувати зв'язок."
    ),
    "demo_match": (
        "Коли друга сторона підтверджує зв'язок, контактні дані обох оголошень "
        "взаємно розкриваються — ось ця панель. До цього моменту телефони й пошта були "
        "прихованими. Так ми захищаємо персональні дані й водночас даємо людям зв'язок, "
        "коли збіг справді підтверджено."
    ),
    "conclusions": (
        "Підсумую. Я розробив вебзастосунок, який автоматизує найтрудомісткіший етап "
        "пошуку — виявлення ймовірного збігу, і захищає контакти до підтвердження. "
        "Ключовий результат — алгоритм зіставлення на формулі гаверсинуса з "
        "лексикографічним упорядкуванням. Систему перевірено: 130 серверних і 44 "
        "клієнтських тести проходять, конвеєр зелений. Поставлені задачі виконано, "
        "мету роботи досягнуто. Дякую за увагу, готовий відповісти на запитання."
    ),
}


if __name__ == "__main__":
    build()
