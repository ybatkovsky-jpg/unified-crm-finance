# -*- coding: utf-8 -*-
"""Создаёт рабочие docx-шаблоны с плейсхолдерами {{Key}} (без пробелов) из исходников."""
import os, re
import docx

SRC = r"D:\CLAUDE\Project\unified-crm-finance\documents"
OUT = r"D:\CLAUDE\Project\unified-crm-finance\apps\web\src\server\templates"
os.makedirs(OUT, exist_ok=True)

def norm(s):
    return re.sub(r"\s+", " ", s).strip()

def iter_paragraphs(doc):
    for p in doc.paragraphs:
        yield p
    for t in doc.tables:
        for row in t.rows:
            for cell in row.cells:
                for p in cell.paragraphs:
                    yield p
                for sub in cell.tables:
                    for r2 in sub.rows:
                        for c2 in r2.cells:
                            for p in c2.paragraphs:
                                yield p
    for sec in doc.sections:
        for hf in (sec.header, sec.footer):
            if hf and not hf.is_linked_to_previous:
                for p in hf.paragraphs:
                    yield p

def write_para(p, text):
    if p.runs:
        p.runs[0].text = text
        for r in p.runs[1:]:
            r.text = ""
    else:
        p.add_run(text)

def apply_rules(doc, rules):
    changed = 0
    for p in iter_paragraphs(doc):
        raw = norm(p.text)
        if not raw:
            continue
        new = raw
        for rx, repl in rules:
            if isinstance(repl, str):
                new, n = re.subn(rx, repl, new)
            else:
                new, n = rx.sub(repl, new)
            changed += n
        if new != raw:
            write_para(p, new)
    return changed

sale_rules = [
    (re.compile(r"ДОГОВОР № _{3,} купли-продажи"),
     "ДОГОВОР № {{Doc.saleContract.number}} купли-продажи"),
    (re.compile(r"^«___»\s*_{3,}\s*2026\s*г\.?$"), "{{Doc.saleContract.date}}"),
    (re.compile(r"(с одной стороны, и )_{10,}(, именуем)"),
     r"\1{{Client.fullName}}\2"),
    (re.compile(r"составляет\s+_{5,}\s*\(_{5,}\)\s*рублей\s+_{1,}\s*копеек"),
     "составляет {{Order.amountRoubles}} ({{Order.amountWords}}) рублей {{Order.amountKopecks}} копеек"),
    (re.compile(r"НДС не облагается / в том числе НДС \(нужное указать\)"),
     "{{Order.ndsLabel}}"),
    (re.compile(r"^Ф\.И\.О\.:\s*_{3,}$"), "Ф.И.О.: {{Client.fullName}}"),
    (re.compile(r"Паспорт:\s*серия\s+_{3,}\s*№\s+_{3,}"),
     "Паспорт: серия {{Client.passport.series}} № {{Client.passport.number}}"),
    (re.compile(r"^Выдан:\s*_{3,}$"), "Выдан: {{Client.passport.issuedBy}}"),
    (re.compile(r"Дата выдачи:\s*_{3,}\s*Код подразделения:\s*_{3,}"),
     "Дата выдачи: {{Client.passport.issuedAt}} Код подразделения: {{Client.passport.code}}"),
    (re.compile(r"^Адрес:\s*_{3,}$"), "Адрес: {{Client.regAddress}}"),
    (re.compile(r"^Тел\.:\s*_{3,}$"), "Тел.: {{Client.phone}}"),
]

def convert(src_name, dst_name, rules):
    doc = docx.Document(os.path.join(SRC, src_name))
    n = apply_rules(doc, rules)
    out = os.path.join(OUT, dst_name)
    doc.save(out)
    print(f"{dst_name}: замен = {n}")

convert("sale_contract_2026.docx", "sale_contract_2026.docx", sale_rules)

check = docx.Document(os.path.join(OUT, "sale_contract_2026.docx"))
found = 0
for p in iter_paragraphs(check):
    found += len(re.findall(r"\{\{[^}]+\}\}", p.text))
print("placeholders in template:", found)
