'use client';

import { ArrowLeft, ArrowUpRight, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PortfolioContent, Project } from '@/lib/types';

type InfoPanel = 'about' | 'contact';

function readParam(name: string) {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get(name);
}

function WorkItem({ project, index, total, variant }: { project: Project; index: number; total: number; variant: number }) {
  return (
    <article className={`work-page reveal-variant-${(variant % 6) + 1}`} aria-labelledby={`project-${project.id}`}>
      <div className="work-feature">
        <div className="work-video" data-reveal>
          <video src={project.video} poster={project.cover} controls playsInline preload="metadata" aria-label={`${project.title}作品视频`} />
        </div>
        <div className="work-info">
          <p className="work-number" data-reveal>{String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</p>
          <div className="work-summary" data-reveal>
            <p>{project.type} · {project.year}{project.duration ? ` · ${project.duration}` : ''}</p>
            <h3 id={`project-${project.id}`}>{project.title}</h3>
            <p className="work-en-title">{project.enTitle}</p>
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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(() => {
    const value = readParam('category');
    return value && categoryIds.has(value) ? value : null;
  });
  const [activePanel, setActivePanel] = useState<InfoPanel | null>(() => {
    const value = readParam('panel');
    return value === 'about' || value === 'contact' ? value : null;
  });
  const activeCategory = content.categories.find((item) => item.id === selectedCategory);
  const visibleProjects = content.projects.filter((item) => item.categoryId === selectedCategory);
  const density = content.categories.length > 6 ? 'compact' : content.categories.length > 3 ? 'dense' : 'standard';

  const navigate = useCallback((category: string | null, panel: InfoPanel | null) => {
    const params = new URLSearchParams(window.location.search);
    params.delete('category');
    params.delete('panel');
    if (category) params.set('category', category);
    if (panel) params.set('panel', panel);
    const search = params.toString();
    window.history.pushState({}, '', `${window.location.pathname}${search ? `?${search}` : ''}`);
    setSelectedCategory(category);
    setActivePanel(panel);
  }, []);

  useEffect(() => {
    const sync = () => {
      const category = readParam('category');
      const panel = readParam('panel');
      setSelectedCategory(category && categoryIds.has(category) ? category : null);
      setActivePanel(panel === 'about' || panel === 'contact' ? panel : null);
    };
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, [categoryIds]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [selectedCategory]);

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
  }, [selectedCategory]);

  if (!activeCategory) {
    return (
      <main className="category-gateway">
        <header className="gateway-header">
          <p className="gateway-name"><span>古梦雪</span><small>GU MENGXUE</small></p>
          <p>VIDEO EDITOR / SHANGHAI</p>
          <nav className="gateway-nav" aria-label="个人信息">
            <button type="button" onClick={() => navigate(null, 'about')}>关于</button>
            <button type="button" onClick={() => navigate(null, 'contact')}>联系</button>
          </nav>
        </header>
        <div className="category-grid" data-density={density} aria-label="作品分类">
          {content.categories.map((category, index) => {
            const cover = category.cover || content.projects.find((project) => project.categoryId === category.id)?.cover || '';
            return (
            <button className="category-panel" type="button" key={category.id} onClick={() => navigate(category.id, null)} aria-label={`查看${category.title}作品`}>
              <img src={cover} alt="" aria-hidden="true" />
              <span className="category-shade" aria-hidden="true" />
              <span className="category-index">{String(index + 1).padStart(2, '0')}</span>
              <span className="category-copy">
                <span className="category-en">{category.enTitle}</span>
                <strong>{category.title}</strong>
                <span className="category-description">{category.description}</span>
              </span>
              <ArrowUpRight className="category-arrow" aria-hidden="true" />
            </button>
            );
          })}
        </div>
        {activePanel && (
          <div className="gateway-info-overlay">
            <button className="gateway-info-backdrop" type="button" onClick={() => navigate(null, null)} aria-label="关闭信息面板" />
            <aside className="gateway-info-panel" role="dialog" aria-modal="true" aria-labelledby={`${activePanel}-panel-title`}>
              <button className="gateway-info-close" type="button" onClick={() => navigate(null, null)} aria-label="关闭" title="关闭" autoFocus><X /></button>
              {activePanel === 'about' ? (
                <div className="gateway-info-content">
                  <p className="gateway-info-index">01 / PROFILE</p>
                  <h2 id="about-panel-title">剪辑不只是连接镜头，而是在时间里安排情绪。</h2>
                  <div className="gateway-info-copy"><p>我是古梦雪，一名独立视频剪辑师。过去 7 年里，我参与了品牌短片、人物纪录片、音乐影像与数字内容的后期制作。</p><p>我关心画面之间的呼吸、声音留下的空间，以及一个故事如何在恰当的时刻被看见。</p></div>
                  <dl className="gateway-info-facts"><div><dt>服务</dt><dd>剪辑 / 调色 / 声音设计 / 动态设计</dd></div><div><dt>工作地</dt><dd>上海 / 可远程合作</dd></div><div><dt>语言</dt><dd>中文 / ENGLISH</dd></div></dl>
                </div>
              ) : (
                <div className="gateway-info-content gateway-contact-content">
                  <p className="gateway-info-index">02 / CONTACT</p><h2 id="contact-panel-title">有一个故事准备开剪？</h2>
                  <a className="gateway-contact-mail" href="mailto:hello@gumengxue.studio">HELLO@GUMENGXUE.STUDIO <ArrowUpRight /></a>
                  <div className="gateway-contact-meta"><p className="availability"><span /> 2026 档期开放</p><div><a href="#">VIMEO</a><a href="#">INSTAGRAM</a><a href="#">小红书</a></div></div>
                </div>
              )}
            </aside>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="portfolio-shell">
      <header className="work-site-header">
        <div className="work-header-brand">
          <button className="category-back" type="button" onClick={() => navigate(null, null)} aria-label="返回作品分类" title="返回作品分类"><ArrowLeft size={17} /></button>
          <button className="wordmark" type="button" onClick={() => navigate(null, null)} aria-label="返回古梦雪首页">XUE<span>®</span></button>
        </div>
        <p>{activeCategory.title} / {activeCategory.enTitle}</p><p>{String(visibleProjects.length).padStart(2, '0')} PROJECTS</p>
      </header>
      <section className="works-section" id="work" aria-labelledby="work-title">
        <header className="section-header" data-reveal><p className="section-index">01 / {activeCategory.enTitle}</p><h2 id="work-title">{activeCategory.title}</h2><p>{activeCategory.description}。</p></header>
        <div className="works-list">
          {visibleProjects.length ? visibleProjects.map((project, index) => <WorkItem key={project.id} project={project} index={index} total={visibleProjects.length} variant={content.projects.indexOf(project)} />) : <p className="empty-projects">这个分类还没有发布项目。</p>}
        </div>
      </section>
    </main>
  );
}
