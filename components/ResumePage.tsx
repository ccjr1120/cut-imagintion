'use client';

import { ArrowLeft, Mail, Printer } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { PortfolioContent, Project, ResumeRole } from '@/lib/types';
import { resumeRoles } from '@/lib/resume';

const roleProjects: Record<ResumeRole, string[]> = {
  'information-flow': ['new-project', 'new-project-2', 'new-project-3', 'new-project-4', 'new-project-5', 'new-project-6', 'new-project-7'],
  'editing-assistant': ['new-project-3', 'new-project-4', 'new-project-7', 'new-project-6', 'new-project-5', 'new-project', 'new-project-2'],
  'video-editor': ['new-project-7', 'new-project-6', 'new-project-5', 'new-project-3', 'new-project-4', 'new-project', 'new-project-2'],
};

const personalCategoryOrder = ['new-category', 'new-category-2', 'new-category-3', 'new-category-4'];

export function ResumePage({ content, initialRole }: { content: PortfolioContent; initialRole: ResumeRole }) {
  const [role, setRole] = useState<ResumeRole>(initialRole);
  const resume = content.resume;
  const copy = resume.roleCopies[role];
  const personalProjects = useMemo(() => roleProjects[role].map((id) => content.projects.find((project) => project.id === id)).filter((project): project is Project => Boolean(project)), [content.projects, role]);
  const personalProjectGroups = useMemo(() => content.categories.map((category) => {
    const projects = personalProjects.filter((project) => project.categoryId === category.id);
    const override = resume.personalCategories.find((item) => item.categoryId === category.id);
    return { category, projects, title: override?.title || category.title, description: override?.description || category.description };
  }).filter((group) => group.projects.length).sort((a, b) => personalCategoryOrder.indexOf(a.category.id) - personalCategoryOrder.indexOf(b.category.id)), [content.categories, personalProjects, resume.personalCategories]);

  useEffect(() => { document.title = `${resume.roleLabels[role].label} | ${resume.name}`; }, [resume.name, resume.roleLabels, role]);

  function changeRole(nextRole: ResumeRole) {
    setRole(nextRole);
    window.history.replaceState({}, '', `/resume?role=${nextRole}`);
  }

  return (
    <main className="resume-shell">
      <header className="resume-toolbar">
        <a className="resume-back" href="/" aria-label="返回作品集"><ArrowLeft size={16} /> <span>返回作品集</span></a>
        <div className="resume-switcher" role="tablist" aria-label="选择简历方向">
          {resumeRoles.map((item) => <button key={item} type="button" role="tab" aria-selected={role === item} className={role === item ? 'is-active' : ''} onClick={() => changeRole(item)}>{resume.roleLabels[item].shortLabel}</button>)}
        </div>
        <button className="resume-print" type="button" onClick={() => window.print()}><Printer size={16} /> <span>打印 / 导出 PDF</span></button>
      </header>
      <article className="resume-sheet">
        <header className="resume-identity"><div><p className="resume-kicker">个人简历 / PERSONAL RESUME</p><h1>{resume.name}</h1></div><div className="resume-contact"><span className="resume-phone">电话：{resume.phone}</span><a href={`mailto:${resume.email}`}><Mail size={15} /> 邮箱：{resume.email}</a><span className="resume-availability"><i /> 求职方向：{resume.roleLabels[role].label}</span></div></header>

        <section className="resume-section resume-skills-before"><p className="resume-section-label">02 / 个人技能</p><h2>个人技能</h2><dl className="resume-skills">{copy.skills.map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}</dl></section>

        <section className="resume-basic-section resume-education-section"><p className="resume-section-label">03 / 教育背景</p><h2>教育背景</h2><div className="resume-education"><strong>{resume.education.period}</strong><span>{resume.education.school}</span><span>{resume.education.major}</span></div></section>

        <section className="resume-campus resume-campus-featured"><p className="resume-section-label">04 / 校园经历</p><h2>{resume.campus.title}</h2><div className="resume-campus-entry"><div className="resume-campus-meta"><strong>{resume.campus.period}</strong><span>{resume.campus.organization}</span><span>{resume.campus.role}</span></div><ul>{resume.campus.bullets.map((bullet, index) => <li key={`${bullet}-${index}`}>{bullet}</li>)}</ul></div></section>

        <section className="resume-projects"><div className="resume-projects-heading"><div><p className="resume-section-label">05 / 项目经历</p><h2>项目经历</h2></div><span>{String(resume.projects.length).padStart(2, '0')} PROJECTS</span></div><div className="resume-project-list">{resume.projects.map((project, index) => <article className="resume-project" key={project.id}><div className="resume-project-number">{String(index + 1).padStart(2, '0')}</div><div><h3>{project.title}</h3><p className="resume-project-meta">{project.type} · {project.year}</p><p>{project.description}</p></div><div className="resume-project-role"><span>职责</span><p>{project.role}</p><small>{project.software}</small></div></article>)}</div></section>

        <section className="resume-personal-projects"><div className="resume-projects-heading"><div><p className="resume-section-label">06 / 个人项目</p><h2>个人项目</h2></div><span>{String(personalProjectGroups.length).padStart(2, '0')} CATEGORIES</span></div><div className="resume-personal-categories">{personalProjectGroups.map((group) => <article className="resume-personal-category" key={group.category.id}><h3>{group.title}</h3><p>{group.description}</p></article>)}</div></section>

        <section className="resume-section resume-evaluation-section"><p className="resume-section-label">07 / 自我评价</p><h2>自我评价</h2><p className="resume-evaluation">{copy.selfEvaluation}</p></section>

        <section className="resume-portfolio-link"><p className="resume-section-label">08 / 作品集链接</p><h2>作品集链接</h2><a href={resume.portfolioUrl} target="_blank" rel="noreferrer">{resume.portfolioLabel}（{resume.portfolioUrl}） <span>↗</span></a></section>
        <footer className="resume-footer"><span>{resume.name} / {resume.roleLabels[role].label}</span><span>{resume.email}</span><span>{resume.updatedLabel}</span></footer>
      </article>
    </main>
  );
}

export type { ResumeRole };
