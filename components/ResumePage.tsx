'use client';

import { ArrowLeft, Mail, Printer } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { PortfolioContent, Project } from '@/lib/types';

type ResumeRole = 'information-flow' | 'editing-assistant' | 'video-editor';

const roleLabels: Record<ResumeRole, { label: string; shortLabel: string }> = {
  'video-editor': { label: '视频剪辑师', shortLabel: '视频剪辑' },
  'editing-assistant': { label: '剪辑助理 / 后期执行', shortLabel: '剪辑助理' },
  'information-flow': { label: '信息流剪辑师', shortLabel: '信息流' },
};

const roleProjects: Record<ResumeRole, string[]> = {
  'information-flow': ['new-project', 'new-project-2', 'new-project-3', 'new-project-4', 'new-project-5', 'new-project-6', 'new-project-7'],
  'editing-assistant': ['new-project-3', 'new-project-4', 'new-project-7', 'new-project-6', 'new-project-5', 'new-project', 'new-project-2'],
  'video-editor': ['new-project-7', 'new-project-6', 'new-project-5', 'new-project-3', 'new-project-4', 'new-project', 'new-project-2'],
};

type ResumeProject = Pick<Project, 'id' | 'title' | 'type' | 'year' | 'description' | 'role' | 'software'>;
type ResumeCopy = { eyebrow: string; summary: string; highlights: string[]; skills: { label: string; value: string }[]; selfEvaluation: string };

const campusProjects: ResumeProject[] = [{ id: 'campus-theme-video', title: '校园主题宣传', type: '校园宣传片', year: '2022 - 2024', description: '完成新生宣传视频与教师节宣传活动记录，围绕校园主题进行内容策划与后期剪辑包装。', role: '负责脚本梳理、镜头组接、字幕与基础包装。', software: 'Premiere Pro / After Effects' }, { id: 'campus-event-interview', title: '校园活动与人物记录', type: '校园活动视频', year: '2022 - 2024', description: '完成运动会视频与毕业生采访，兼顾活动节奏和人物内容表达。', role: '负责素材筛选、采访内容剪辑、调色与音画合成。', software: 'Premiere Pro / After Effects' }];
const personalCategoryTitles: Record<string, string> = { 'new-category-4': 'MG 动画' };
const personalCategoryDescriptions: Record<string, string> = { 'new-category': '垃圾袋、洗面奶信息流：围绕用户痛点、产品实测和卖点包装制作千川带货素材。', 'new-category-2': '装修避雷、汽车宣传口播：通过气口粗剪、字幕特效和情绪节奏提升信息表达。', 'new-category-3': '动漫混剪、《小巷人家》：结合 BGM 卡点重构叙事，完成蒙版、转场和氛围包装。', 'new-category-4': '企业运营可视化：制作数据图表、路径生长和百分比跳动等 MG 动画特效。' };
const personalCategoryOrder = ['new-category', 'new-category-2', 'new-category-3', 'new-category-4'];

const resumeCopy: Record<ResumeRole, ResumeCopy> = {
  'information-flow': {
    eyebrow: 'VIDEO EDITOR / PERFORMANCE CREATIVE',
    summary: '专注短视频信息流广告后期，擅长从用户痛点和产品卖点出发，搭建前 3 秒钩子、实测证明与行动引导，完成从素材筛选到成片包装的完整剪辑流程。',
    highlights: ['独立完成垃圾袋信息流推广：以日常痛点切入，用暴力测试和对比演示建立产品信任，完成素材筛选、字幕与特效包装。', '完成洗面奶信息流推广：设计开头钩子，组织皮肤实测、质地特写和成分展示，搭建短视频广告叙事结构。', '熟悉千川广告投放、带货素材的节奏与卖点表达，能够根据投放目标快速迭代素材版本。'],
    skills: [{ label: '广告剪辑', value: '钩子设计 / 卖点拆解 / 素材筛选 / 节奏优化' }, { label: '包装执行', value: '动态字幕 / 纹理叠加 / 对比演示 / 重点标注' }, { label: '剪辑软件', value: 'Premiere Pro（PR） / After Effects（AE） / 剪映 / CapCut' }, { label: '视觉与设计', value: 'Adobe Illustrator（AI） / Blender' }, { label: 'AIGC', value: 'ComfyUI 工作流 / AI 短剧创意 / 视觉素材生成 / 风格测试' }],
    selfEvaluation: '兴趣是最好的老师。我热爱用视频表达创作力，熟悉信息流广告剪辑与相关软件应用，保持主动学习和复盘迭代，愿意持续精进并在岗位中高效成长。',
  },
  'editing-assistant': {
    eyebrow: 'VIDEO EDITOR / POST-PRODUCTION',
    summary: '面向剪辑助理与后期执行岗位，能稳定承接素材整理、气口粗剪、镜头筛选、字幕音效包装和基础调色，具备 Premiere Pro、After Effects、剪映与 CapCut 工作流经验。',
    highlights: ['装修避雷口播：完成气口粗剪、特效音效包装，用图文补充、人物缩放与重点标注降低信息理解门槛。', '汽车宣传口播：完成粗剪、字幕包装和汽车特写筛选，把控整体情绪节奏并突出产品卖点。', '影视与动漫混剪：根据 BGM 重构叙事，完成卡点剪辑、蒙版、转场和氛围感包装。', 'MG 动画：使用 After Effects 完成数据可视化动态图形、图表入场与数据跳动特效。'],
    skills: [{ label: '后期执行', value: '素材筛选 / 气口粗剪 / 卡点剪辑 / 字幕与音效' }, { label: '视觉包装', value: '动态字幕 / 蒙版转场 / 图文穿插 / 基础调色' }, { label: '剪辑软件', value: 'Premiere Pro（PR） / After Effects（AE） / 剪映 / CapCut' }, { label: '视觉与设计', value: 'Adobe Illustrator（AI） / Blender' }, { label: 'AIGC', value: 'ComfyUI 工作流 / AI 短剧分镜 / 角色与场景设定 / 素材生成' }],
    selfEvaluation: '兴趣是最好的老师。我热爱视频创作，熟悉相关剪辑软件应用，愿意主动学习并从素材整理、后期执行等基础工作做起，在团队协作中持续提升、稳定成长。',
  },
  'video-editor': {
    eyebrow: 'VIDEO EDITOR / EDITING & VISUAL STORYTELLING',
    summary: '具备从素材筛选、叙事结构、粗剪精剪到字幕、声音、调色和动态包装的完整视频后期能力，能够结合内容目标完成广告、口播、影视混剪与 MG 动画等不同类型的视频创作。',
    highlights: ['覆盖信息流广告、知识口播、汽车宣传、影视混剪、动漫混剪和 MG 动画等多种内容类型，能够根据题材调整节奏与视觉表达。', '具备从脚本与素材理解到成片输出的完整剪辑意识，关注镜头衔接、音乐情绪、信息层级和画面质感。', '熟悉 AIGC 工作流，可使用 ComfyUI 进行灵感探索、角色与场景设定、AI 短剧分镜和视觉素材生成，辅助前期创意与后期制作。'],
    skills: [{ label: '剪辑能力', value: '叙事结构 / 粗剪精剪 / 节奏设计 / 音画合成' }, { label: '视觉包装', value: '动态字幕 / 调色 / 蒙版转场 / MG 动画' }, { label: '剪辑软件', value: 'Premiere Pro（PR） / After Effects（AE） / 剪映 / CapCut' }, { label: '视觉与设计', value: 'Adobe Illustrator（AI） / Blender' }, { label: 'AIGC', value: 'ComfyUI 工作流 / AI 短剧分镜 / 角色与场景设定 / 视觉素材生成 / 风格测试' }],
    selfEvaluation: '兴趣是最好的老师。我热爱用视频表达创作力，能够主动学习并适应不同题材和制作流程；同时关注生成式视觉工作流的发展，愿意将 AIGC 工具（如 ComfyUI）融入 AI 短剧创意、前期分镜与后期制作，在实践中持续提升。',
  },
};

export function ResumePage({ content, initialRole }: { content: PortfolioContent; initialRole: ResumeRole }) {
  const [role, setRole] = useState<ResumeRole>(initialRole);
  const copy = resumeCopy[role];
  const personalProjects = useMemo(() => roleProjects[role].map((id) => content.projects.find((project) => project.id === id)).filter((project): project is Project => Boolean(project)), [content.projects, role]);
  const personalProjectGroups = useMemo(() => content.categories.map((category) => {
    const projects = personalProjects.filter((project) => project.categoryId === category.id);
    return { category, projects };
  }).filter((group) => group.projects.length).sort((a, b) => personalCategoryOrder.indexOf(a.category.id) - personalCategoryOrder.indexOf(b.category.id)), [content.categories, personalProjects]);

  useEffect(() => { document.title = `${roleLabels[role].label} | 古梦雪`; }, [role]);

  function changeRole(nextRole: ResumeRole) {
    setRole(nextRole);
    window.history.replaceState({}, '', `/resume?role=${nextRole}`);
  }

  return (
    <main className="resume-shell">
      <header className="resume-toolbar">
        <a className="resume-back" href="/" aria-label="返回作品集"><ArrowLeft size={16} /> <span>返回作品集</span></a>
        <div className="resume-switcher" role="tablist" aria-label="选择简历方向">
          {(Object.keys(roleLabels) as ResumeRole[]).map((item) => <button key={item} type="button" role="tab" aria-selected={role === item} className={role === item ? 'is-active' : ''} onClick={() => changeRole(item)}>{roleLabels[item].shortLabel}</button>)}
        </div>
        <button className="resume-print" type="button" onClick={() => window.print()}><Printer size={16} /> <span>打印 / 导出 PDF</span></button>
      </header>
      <article className="resume-sheet">
        <header className="resume-identity"><div><p className="resume-kicker">个人简历 / PERSONAL RESUME</p><h1>古梦雪</h1></div><div className="resume-contact"><span className="resume-phone">电话：18708891784</span><a href="mailto:936374627@qq.com"><Mail size={15} /> 邮箱：936374627@qq.com</a><span className="resume-availability"><i /> 求职方向：{roleLabels[role].label}</span></div></header>

        <section className="resume-section resume-skills-before"><p className="resume-section-label">02 / 个人技能</p><h2>个人技能</h2><dl className="resume-skills">{copy.skills.map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl></section>

        <section className="resume-basic-section resume-education-section"><p className="resume-section-label">03 / 教育背景</p><h2>教育背景</h2><div className="resume-education"><strong>2022.09 - 2026.07</strong><span>玉溪师范学院</span><span>数学与应用数学</span></div></section>

        <section className="resume-campus resume-campus-featured"><p className="resume-section-label">04 / 校园经历</p><h2>影视策划工作室部长经历</h2><div className="resume-campus-entry"><div className="resume-campus-meta"><strong>2022.09 - 2024.07</strong><span>玉溪师范学院校团委</span><span>影视策划工作室成员 / 继任部长</span></div><ul><li>全流程负责：独立主导宣传视频，包括脚本撰写、拍摄执行、后期剪辑与特效包装，完成从创意构思到成片输出的闭环工作。</li><li>专业技能应用：熟练应用 PR、AE 等软件完成镜头组接、调色、音画合成及动态图形设计。</li><li>内容策划：结合校园热点撰写故事化脚本，创作校园宣传片并获得师生好评。</li></ul></div></section>

        <section className="resume-projects"><div className="resume-projects-heading"><div><p className="resume-section-label">05 / 项目经历</p><h2>项目经历</h2></div><span>{String(campusProjects.length).padStart(2, '0')} PROJECTS</span></div><div className="resume-project-list">{campusProjects.map((project, index) => <article className="resume-project" key={project.id}><div className="resume-project-number">{String(index + 1).padStart(2, '0')}</div><div><h3>{project.title}</h3><p className="resume-project-meta">{project.type} · {project.year}</p><p>{project.description}</p></div><div className="resume-project-role"><span>职责</span><p>{project.role}</p><small>{project.software}</small></div></article>)}</div></section>

        <section className="resume-personal-projects"><div className="resume-projects-heading"><div><p className="resume-section-label">06 / 个人项目</p><h2>个人项目</h2></div><span>{String(personalProjectGroups.length).padStart(2, '0')} CATEGORIES</span></div><div className="resume-personal-categories">{personalProjectGroups.map((group) => <article className="resume-personal-category" key={group.category.id}><h3>{personalCategoryTitles[group.category.id] || group.category.title}</h3><p>{personalCategoryDescriptions[group.category.id] || group.category.description}</p></article>)}</div></section>

        <section className="resume-section resume-evaluation-section"><p className="resume-section-label">07 / 自我评价</p><h2>自我评价</h2><p className="resume-evaluation">{copy.selfEvaluation}</p></section>

        <section className="resume-portfolio-link"><p className="resume-section-label">08 / 作品集链接</p><h2>作品集链接</h2><a href="https://imagintion.gleeze.com/" target="_blank" rel="noreferrer">进入古梦雪视频剪辑作品集（https://imagintion.gleeze.com/） <span>↗</span></a></section>
        <footer className="resume-footer"><span>古梦雪 / {roleLabels[role].label}</span><span>936374627@qq.com</span><span>UPDATED 2026</span></footer>
      </article>
    </main>
  );
}

export type { ResumeRole };
