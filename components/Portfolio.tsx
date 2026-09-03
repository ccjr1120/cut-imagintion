'use client';

import { ArrowLeft, ArrowRight, ArrowUpRight, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PortfolioContent, Project } from '@/lib/types';

type InfoPanel = 'about' | 'contact';

function readParam(name: string) {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get(name);
}

function WorkItem({ project, index, total, variant, orientation }: { project: Project; index: number; total: number; variant: number; orientation: 'landscape' | 'portrait' }) {
  return (
    <article className={`work-page reveal-variant-${(variant % 6) + 1}`} data-orientation={orientation} aria-labelledby={`project-${project.id}`}>
      <div className="work-feature">
        <div className="work-video" data-reveal>
          <video src={project.video} poster={project.cover} controls playsInline preload="metadata" aria-label={`${project.title}作品视频`} />
        </div>
        <div className="work-info">
          <p className="work-number" data-reveal>{String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</p>
          <div className="work-summary" data-reveal>
            <p>{project.type} · {project.year}{project.duration ? ` · ${project.duration}` : ''}</p>
            <h3 id={`project-${project.id}`}>{project.title}</h3>
            <p className="work-description">{project.description}</p>
          </div>
          <dl className="work-facts" data-reveal>
            <div><dt>亮点</dt><dd>{project.plugins || '—'}</dd></div>
            <div><dt>职责</dt><dd>{project.role || '—'}</dd></div>
            <div><dt>软件</dt><dd>{project.software || '—'}</dd></div>
          </dl>
        </div>
      </div>
      {project.screenshots.length > 0 && (
        <div className="work-stills" aria-label={`${project.title}项目截图`}>
          {project.screenshots.map((screenshot, screenshotIndex) => (
            <figure key={`${screenshot}-${screenshotIndex}`} data-reveal>
              {/* Media URLs are editable and can come from the built-in upload service. */}
              <img src={screenshot} alt={`${project.title}项目截图 ${screenshotIndex + 1}`} loading={index === 0 ? 'eager' : 'lazy'} />
              <figcaption>STILL {String(screenshotIndex + 1).padStart(2, '0')}</figcaption>
            </figure>
          ))}
        </div>
      )}
    </article>
  );
}

export function Portfolio({ content }: { content: PortfolioContent }) {
  const categoryIds = useMemo(() => new Set(content.categories.map((item) => item.id)), [content.categories]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<InfoPanel | null>(null);
  const activeCategory = content.categories.find((item) => item.id === selectedCategory);
  const visibleProjects = content.projects.filter((item) => item.categoryId === selectedCategory);
  const activeProject = visibleProjects.find((item) => item.id === selectedProject);
  const density = content.categories.length > 6 ? 'compact' : content.categories.length > 3 ? 'dense' : 'standard';

  const navigate = useCallback((category: string | null, panel: InfoPanel | null, project: string | null = null) => {
    const params = new URLSearchParams(window.location.search);
    params.delete('category');
    params.delete('panel');
    params.delete('project');
    if (category) params.set('category', category);
    if (panel) params.set('panel', panel);
    if (project) params.set('project', project);
    const search = params.toString();
    window.history.pushState({}, '', `${window.location.pathname}${search ? `?${search}` : ''}`);
    setSelectedCategory(category);
    setActivePanel(panel);
    setSelectedProject(project);
  }, []);

  useEffect(() => {
    const sync = () => {
      const category = readParam('category');
      const panel = readParam('panel');
      const nextCategory = category && categoryIds.has(category) ? category : null;
      const project = readParam('project');
      const nextProject = project && content.projects.some((item) => item.id === project && item.categoryId === nextCategory) ? project : null;
      setSelectedCategory(nextCategory);
      setActivePanel(panel === 'about' || panel === 'contact' ? panel : null);
      setSelectedProject(nextProject);
    };
    sync();
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, [categoryIds, content.projects]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [selectedCategory, selectedProject]);

  useEffect(() => {
    if (!activePanel) return;
    const close = (event: KeyboardEvent) => event.key === 'Escape' && navigate(null, null);
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [activePanel, navigate]);

  useEffect(() => {
    const revealElements = document.querySelectorAll<HTMLElement>('[data-reveal]');
    const projectPages = document.querySelectorAll<HTMLElement>('.work-page');
    const playbackObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) entry.target.querySelector('video')?.pause();
    }));
    projectPages.forEach((item) => playbackObserver.observe(item));
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      revealElements.forEach((item) => item.classList.add('is-visible'));
      return () => playbackObserver.disconnect();
    }
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      entry.target.classList.toggle('is-visible', entry.isIntersecting);
    }), { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
    revealElements.forEach((item) => observer.observe(item));
    return () => { observer.disconnect(); playbackObserver.disconnect(); };
  }, [selectedCategory, selectedProject]);

  const renderCategoryPanel = (category: (typeof content.categories)[number], index: number) => {
    const cover = category.cover || content.projects.find((project) => project.categoryId === category.id)?.cover || '';
    return (
      <button className="category-panel" type="button" key={category.id} data-orientation={category.orientation || 'landscape'} onClick={() => navigate(category.id, null)} aria-label={`查看${category.title}作品`}>
        <img src={cover} alt="" aria-hidden="true" />
        <span className="category-shade" aria-hidden="true" />
        <span className="category-index">{String(index + 1).padStart(2, '0')}</span>
        <span className="category-copy">
          <strong>{category.title}</strong>
          <span className="category-description">{category.description}</span>
        </span>
        <ArrowUpRight className="category-arrow" aria-hidden="true" />
      </button>
    );
  };

  if (!activeCategory) {
    const hasPortraitCategory = content.categories.some((category) => category.orientation === 'portrait');
    return (
      <main className="category-gateway">
        <header className="gateway-header">
          <p className="gateway-name"><span>古梦雪</span><small>GU MENGXUE</small></p>
          <p>VIDEO EDITOR / HANGZHOU</p>
          <nav className="gateway-nav" aria-label="个人信息">
            <a href="/resume">简历</a>
            <button type="button" onClick={() => navigate(null, 'about')}>关于</button>
            <button type="button" onClick={() => navigate(null, 'contact')}>联系</button>
          </nav>
        </header>
        <div className="category-grid" data-density={density} data-layout={hasPortraitCategory ? 'oriented' : 'collage'} aria-label="作品分类">
          {hasPortraitCategory ? Array.from({ length: Math.ceil(content.categories.length / 2) }, (_, rowIndex) => {
            const row = content.categories.slice(rowIndex * 2, rowIndex * 2 + 2);
            return <div className="category-row" key={rowIndex} data-count={row.length} data-first-orientation={row[0]?.orientation || 'landscape'} data-second-orientation={row[1]?.orientation || 'landscape'}>{row.map((category, index) => renderCategoryPanel(category, rowIndex * 2 + index))}</div>;
          }) : content.categories.map(renderCategoryPanel)}
        </div>
        {activePanel && (
          <div className="gateway-info-overlay">
            <button className="gateway-info-backdrop" type="button" onClick={() => navigate(null, null)} aria-label="关闭信息面板" />
            <aside className="gateway-info-panel" role="dialog" aria-modal="true" aria-labelledby={`${activePanel}-panel-title`}>
              <button className="gateway-info-close" type="button" onClick={() => navigate(null, null)} aria-label="关闭" title="关闭" autoFocus><X /></button>
              {activePanel === 'about' ? (
                <div className="gateway-info-content">
                  <p className="gateway-info-index">01 / PROFILE</p>
                  <h2 id="about-panel-title">把每一次剪辑，做成让观众愿意看下去的下一秒。</h2>
                  <div className="gateway-info-copy"><p>我是古梦雪，目前在杭州寻找视频剪辑相关岗位。虽然还没有正式工作经验，但我通过信息流广告、口播、影视混剪和 MG 动画等个人项目持续练习，熟悉从素材整理、粗剪到字幕与特效包装的完整流程。</p><p>我重视节奏、信息层级和情绪表达，愿意从具体任务做起，在团队反馈中快速成长，也期待参与真实项目。</p></div>
                  <dl className="gateway-info-facts"><div><dt>方向</dt><dd>视频剪辑 / 短视频后期 / 特效包装</dd></div><div><dt>工作地</dt><dd>杭州 / 可接受到岗或远程沟通</dd></div><div><dt>经历</dt><dd>个人项目与作品集实践</dd></div></dl>
                </div>
              ) : (
                <div className="gateway-info-content gateway-contact-content">
                  <p className="gateway-info-index">02 / CONTACT</p><h2 id="contact-panel-title">正在寻找杭州的视频剪辑机会。</h2>
                  <div className="gateway-contact-mail" aria-label="微信号 Febirle">微信号：Febirle</div>
                  <div className="gateway-contact-meta"><p className="availability"><span /> 杭州 · 视频剪辑岗位求职中</p><div><span>简历与作品集可按需发送</span></div></div>
                </div>
              )}
            </aside>
          </div>
        )}
      </main>
    );
  }

  if (!activeProject) {
    return (
      <main className="portfolio-shell portfolio-directory" data-orientation={activeCategory.orientation || 'landscape'}>
        <header className="work-site-header">
          <div className="work-header-brand">
            <button className="category-back" type="button" onClick={() => navigate(null, null)} aria-label="返回作品分类" title="返回作品分类"><ArrowLeft size={17} /></button>
            <button className="wordmark" type="button" onClick={() => navigate(null, null)} aria-label="返回古梦雪首页">XUE<span>®</span></button>
          </div>
            <p>{activeCategory.title}</p><p>{String(visibleProjects.length).padStart(2, '0')} PROJECTS</p>
        </header>
        <section className="directory-section" aria-labelledby="directory-title">
          <div className="directory-intro" data-reveal>
            <div>
              <p className="section-index">01 / PROJECT INDEX</p>
              <h1 id="directory-title">{activeCategory.title}</h1>
            </div>
            <p>{activeCategory.description}。<br />选择一个项目，查看完整视频与制作细节。</p>
          </div>
          <div className="directory-layout">
            <div className="directory-list" aria-label={`${activeCategory.title}项目目录`}>
              {visibleProjects.length ? visibleProjects.map((project, index) => (
                <button className="directory-item" type="button" key={project.id} onClick={() => navigate(selectedCategory, null, project.id)} data-orientation={activeCategory.orientation || 'landscape'}>
                  <span className="directory-item-index">{String(index + 1).padStart(2, '0')}</span>
                  <span className="directory-thumb">{project.cover ? <img src={project.cover} alt="" loading="lazy" /> : <span aria-hidden="true">NO COVER</span>}</span>
                  <span className="directory-item-copy"><strong>{project.title}</strong><small>{project.type || '视频剪辑'} · {project.year}{project.duration ? ` · ${project.duration}` : ''}</small></span>
                  <ArrowUpRight className="directory-item-arrow" aria-hidden="true" />
                </button>
              )) : <p className="empty-projects">这个分类还没有发布项目。</p>}
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="portfolio-shell" data-orientation={activeCategory.orientation || 'landscape'}>
      <header className="work-site-header">
        <div className="work-header-brand">
          <button className="category-back" type="button" onClick={() => navigate(selectedCategory, null, null)} aria-label="返回项目目录" title="返回项目目录"><ArrowLeft size={17} /></button>
          <button className="wordmark" type="button" onClick={() => navigate(null, null)} aria-label="返回古梦雪首页">XUE<span>®</span></button>
        </div>
        <p>{activeCategory.title} / {activeProject.title}</p><p>{String(visibleProjects.indexOf(activeProject) + 1).padStart(2, '0')} / {String(visibleProjects.length).padStart(2, '0')}</p>
      </header>
      <section className="works-section" id="work" aria-labelledby="work-title">
        <header className="section-header" data-reveal><p className="section-index">01 / {activeCategory.title} / DETAIL</p><h2 id="work-title">{activeProject.title}</h2><p>{activeCategory.description}。</p></header>
        <div className="works-list">
          <WorkItem project={activeProject} index={visibleProjects.indexOf(activeProject)} total={visibleProjects.length} variant={content.projects.indexOf(activeProject)} orientation={activeCategory.orientation || 'landscape'} />
          <div className="detail-navigation" aria-label="切换项目">
            {(() => {
              const projectIndex = visibleProjects.indexOf(activeProject);
              const previous = visibleProjects[projectIndex - 1];
              const next = visibleProjects[projectIndex + 1];
              return <>
                <button type="button" onClick={() => previous && navigate(selectedCategory, null, previous.id)} disabled={!previous}><ArrowLeft size={16} /><span>{previous ? previous.title : '已经是第一个项目'}</span></button>
                <button type="button" onClick={() => next && navigate(selectedCategory, null, next.id)} disabled={!next}><span>{next ? next.title : '已经是最后一个项目'}</span><ArrowRight size={16} /></button>
              </>;
            })()}
          </div>
        </div>
      </section>
    </main>
  );
}
