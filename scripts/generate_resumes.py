#!/usr/bin/env python3
"""Generate role-specific resumes by patching text slots in the retained DOCX template."""

from __future__ import annotations

import hashlib
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path


REFERENCE = Path(
    "/Users/ccjr/Library/Containers/com.tencent.xinWeChat/Data/Documents/"
    "xwechat_files/wxid_12usmppfn6ek22_ce1f/msg/file/2026-08/后期简历docx.docx"
)
OUT_DIR = Path("generated_resumes")
NS = {
    "w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
    "xml": "http://www.w3.org/XML/1998/namespace",
}
W = "{" + NS["w"] + "}"
XML_SPACE = "{" + NS["xml"] + "}space"

ET.register_namespace("w", NS["w"])
ET.register_namespace("w14", "http://schemas.microsoft.com/office/word/2010/wordml")
ET.register_namespace("w15", "http://schemas.microsoft.com/office/word/2012/wordml")
ET.register_namespace("wp", "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing")
ET.register_namespace("a", "http://schemas.openxmlformats.org/drawingml/2006/main")
ET.register_namespace("mc", "http://schemas.openxmlformats.org/markup-compatibility/2006")


COMMON = {
    "title": ["个人简历"],
    "subtitle": ["", "Personal resume"],
    "contact": [
        "姓    名：古梦雪",
        "电    话：18708891784",
        "邮    箱：936374627@qq.com",
        "",
    ],
    "basic_heading": ["基本信息"],
    "education_heading": ["教育背景"],
    "education": ["2022.09-2026.07          玉溪师范学院                         数学与应用数学", ""],
    "project_heading": ["项目经历"],
    "skills_heading": ["技能证书"],
    "self_heading": ["自我评价"],
    "campus_heading": ["校园经历"],
    "campus": [
        "2022.09-2024.07               玉溪师范学院校团委             影视策划工作室成员 / 继任部长",
        "全流程负责：独立主导宣传视频，完成脚本撰写、拍摄执行、后期剪辑与特效包装，从创意构思到成片输出形成闭环。",
        "专业技能应用：使用 PR、AE 完成镜头组接、调色、音画合成与动态图形设计。",
        "内容策划：结合校园热点撰写故事化脚本，完成校园宣传片并获得师生好评。",
        "",
    ],
    "portfolio": ["作品集链接"],
}

ROLE_DATA = {
    "information-flow": {
        "filename": "古梦雪-信息流剪辑师-简历.docx",
        "skills": [
            "广告剪辑：钩子设计 / 卖点拆解 / 素材筛选 / 节奏优化；剪辑软件：PR / AE / 剪映 / CapCut。"
        ],
        "self": [
            "专注短视频信息流广告后期，擅长从用户痛点和产品卖点出发，完成从素材筛选到成片包装的完整流程。"
        ],
        "projects": [
            ("垃圾袋信息流推广", "以日常痛点切入，结合暴力测试与对比演示突出加厚、不漏水卖点；负责素材筛选、字幕和特效包装。"),
            ("洗面奶信息流推广", "设计前 3 秒钩子，组织皮肤实测、质地特写与成分展示，搭建短视频广告叙事结构。"),
            ("装修避雷口播", "完成气口粗剪、特效音效包装与重点标注，用图文穿插和人物缩放降低信息理解门槛。"),
        ],
    },
    "editing-assistant": {
        "filename": "古梦雪-剪辑助理后期执行-简历.docx",
        "skills": [
            "后期执行：素材筛选 / 气口粗剪 / 卡点剪辑 / 字幕音效；视觉包装：动态字幕 / 蒙版转场 / 基础调色。"
        ],
        "self": [
            "面向剪辑助理与后期执行岗位，能稳定承接素材整理、镜头筛选、字幕音效包装和基础调色。"
        ],
        "projects": [
            ("装修避雷口播", "完成气口粗剪、特效音效包装与重点标注，用图文穿插和人物缩放降低信息理解门槛。"),
            ("汽车宣传口播", "完成视频粗剪、字幕包装和汽车特写筛选，把控整体情绪节奏并突出产品卖点。"),
            ("小巷人家混剪", "根据抒情 BGM 重构剧集叙事，完成情感卡点、空镜穿插、叠化转场与年代氛围包装。"),
        ],
    },
    "video-editor": {
        "filename": "古梦雪-视频剪辑师-简历.docx",
        "skills": [
            "剪辑能力：叙事结构 / 粗剪精剪 / 节奏设计 / 音画合成；视觉包装：动态字幕 / 调色 / 蒙版转场 / MG 动画。"
        ],
        "self": [
            "具备从素材筛选、叙事结构、粗剪精剪到字幕、声音、调色和动态包装的完整视频后期能力。"
        ],
        "projects": [
            ("小巷人家混剪", "根据抒情 BGM 重构剧集叙事，完成情感卡点、空镜穿插、叠化转场与年代氛围包装。"),
            ("动漫混剪", "筛选多类动漫素材，结合 BGM 卡点重构画面，完成镜头加工、蒙版、转场与特效包装。"),
            ("企业运营可视化 MG 动画", "制作数据动态图形、柱形图与环形图入场动画，并完成线条描边、路径生长和百分比跳动特效。"),
        ],
    },
}


def paragraph_text(para: ET.Element) -> str:
    return "".join((t.text or "") for t in para.findall(".//" + W + "t"))


def set_paragraph_text(para: ET.Element, text: str) -> None:
    """Replace visible text while retaining the paragraph and run formatting."""
    nodes = para.findall(".//" + W + "t")
    if nodes:
        nodes[0].text = text
        if text[:1].isspace() or text[-1:].isspace():
            nodes[0].set(XML_SPACE, "preserve")
        else:
            nodes[0].attrib.pop(XML_SPACE, None)
        for node in nodes[1:]:
            node.text = ""
            node.attrib.pop(XML_SPACE, None)
    elif text:
        run = ET.SubElement(para, W + "r")
        ET.SubElement(run, W + "t").text = text


def set_box(box: ET.Element, texts: list[str]) -> None:
    paragraphs = box.findall("./" + W + "p")
    if len(paragraphs) != len(texts):
        raise ValueError(f"Slot paragraph count mismatch: {len(paragraphs)} != {len(texts)}")
    for para, text in zip(paragraphs, texts):
        set_paragraph_text(para, text)


def make_slot_texts(role: dict) -> dict[str, list[str]]:
    project_lines: list[str] = []
    for title, description in role["projects"]:
        project_lines.extend([title, description])
    project_lines.extend(["", "作品集链接"])
    return {
        **COMMON,
        "skills": role["skills"],
        "self": role["self"],
        "projects": project_lines,
    }


def patch_document_xml(data: bytes, slots: dict[str, list[str]]) -> bytes:
    root = ET.fromstring(data)
    boxes = root.findall(".//" + W + "txbxContent")
    # The source uses Choice/Fallback pairs. Matching the source text lets us
    # update both copies without disturbing the drawing and compatibility layer.
    signatures: dict[str, str] = {
        "title": "个人简历",
        "subtitle": " | Personal resume",
        "contact": "姓    名：古梦雪 | 电    话：18708891784 | 邮    箱：936374627@qq.com | ",
        "basic_heading": "基本信息",
        "education_heading": "教育背景",
        "education": "2022.09-2026.07          玉溪师范学院                         数学与应用数学 | ",
        "project_heading": "项目经历",
        "skills_heading": "技能证书",
        "skills": "熟练使用PR、AE、达芬奇、blender、C4D、AIGC工具进行完整视频剪辑与创作",
        "self_heading": "自我评价",
        "self": "热衷用视频表达创作力，熟悉相关剪辑软件应用，学习能力强，愿意深耕岗位高效成长",
        "projects": "慕课视频制作 | 利用AIGC工具创作，辅助Pr、AE等进行多轨道编辑，独立负责全流程制作 | mg科普动画制作 | 利用Adobe After Effects,Adobe Illustrator独立完成元素绘制，关键帧动画，特效转场等 | 企业宣传片 | 参与企业宣传片后期制作，利用blender，C4D等设计科技感logo以及数据动态包装 |  | 作品集链接",
        "campus": "2022.09-2024.07               玉溪师范学院校团委             影视策划工作室成员继任部长 | 全流程负责：独立主导宣传视频包括脚本撰写，拍摄执行，后期剪辑特效包装等环节，完成从创意构思到成片输出的闭环工作 | 专业技能应用：熟练应用PR、DaVinci、AE等软件完成镜头组接，调色，音画合成及动态图形设计 | 内容策划：结合校园热点撰写故事化脚本，创作的校园宣传片广受师生好评 | ",
        "campus_heading": "校园经历",
    }
    updated = set()
    for box in boxes:
        current = " | ".join(paragraph_text(p) for p in box.findall("./" + W + "p"))
        for key, signature in signatures.items():
            if current == signature:
                set_box(box, slots[key])
                updated.add(key)
                break
    missing = set(signatures) - updated
    if missing:
        raise ValueError("Template slots not found: " + ", ".join(sorted(missing)))
    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def generate_one(role: dict, destination: Path) -> None:
    with zipfile.ZipFile(REFERENCE, "r") as source:
        document_xml = source.read("word/document.xml")
        patched_xml = patch_document_xml(document_xml, make_slot_texts(role))
        with zipfile.ZipFile(destination, "w", compression=zipfile.ZIP_DEFLATED) as target:
            for info in source.infolist():
                payload = patched_xml if info.filename == "word/document.xml" else source.read(info.filename)
                target.writestr(info, payload)


def main() -> None:
    if not REFERENCE.exists():
        raise FileNotFoundError(REFERENCE)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for role in ROLE_DATA.values():
        generate_one(role, OUT_DIR / role["filename"])
    print("reference_sha256=" + hashlib.sha256(REFERENCE.read_bytes()).hexdigest())
    for path in sorted(OUT_DIR.glob("*.docx")):
        print(path, path.stat().st_size)


if __name__ == "__main__":
    main()
