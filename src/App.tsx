import { ArrowLeft, ArrowUpRight, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

type CategoryId = 'commercial' | 'culture' | 'portrait';
type InfoPanel = 'about' | 'contact';

type Work = {
  category: CategoryId;
  title: string;
  enTitle: string;
  type: string;
  year: string;
  duration: string;
  role: string;
  client: string;
  description: string;
  cover: string;
  video: string;
  screenshots: string[];
};

const works: Work[] = [
  {
    category: 'commercial',
    title: '夜航',
    enTitle: 'NIGHT FLIGHT',
    type: '品牌短片',
    year: '2025',
    duration: '01:42',
    role: '剪辑 / 调色',
    client: 'AER STUDIO',
    description: '一次从暮色驶向凌晨的城市漫游。以密集的环境声、霓虹反射和呼吸感剪辑，重新描绘熟悉的夜。',
    cover: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1800&q=86',
    video: 'https://videos.pexels.com/video-files/3130284/3130284-hd_1920_1080_30fps.mp4',
    screenshots: [
      'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1000&q=82',
      'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1000&q=82',
      'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=1000&q=82',
    ],
  },
  {
    category: 'culture',
    title: '回声现场',
    enTitle: 'ECHOES LIVE',
    type: '音乐现场',
    year: '2025',
    duration: '03:18',
    role: '剪辑 / 声音设计',
    client: 'MONO CLUB',
    description: '记录一场只发生一次的地下演出。剪辑跟随鼓点推进，同时保留观众、呼吸与现场噪音的粗粝质感。',
    cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1500&q=86',
    video: 'https://videos.pexels.com/video-files/4990245/4990245-hd_1920_1080_30fps.mp4',
    screenshots: [
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1000&q=82',
      'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1000&q=82',
      'https://images.unsplash.com/photo-1501612780327-45045538702b?auto=format&fit=crop&w=1000&q=82',
    ],
  },
  {
    category: 'commercial',
    title: '公路以北',
    enTitle: 'NORTHBOUND',
    type: '汽车广告',
    year: '2024',
    duration: '00:45',
    role: '剪辑 / 动态设计',
    client: 'VANTA MOTORS',
    description: '速度之外，寻找一段更安静的旅程。用长镜头与瞬时切点对照，建立机械和自然之间的张力。',
    cover: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1500&q=86',
    video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    screenshots: [
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1000&q=82',
      'https://images.unsplash.com/photo-1471479917193-f00955256257?auto=format&fit=crop&w=1000&q=82',
      'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1000&q=82',
    ],
  },
  {
    category: 'culture',
    title: '她的第二层皮肤',
    enTitle: 'SECOND SKIN',
    type: '时装影像',
    year: '2024',
    duration: '01:06',
    role: '剪辑 / 视觉概念',
    client: 'NOIR MAGAZINE',
    description: '围绕身体、织物和城市空间展开的时装实验。跳切与静帧共同构成一种不断变化的观看距离。',
    cover: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1500&q=86',
    video: 'https://videos.pexels.com/video-files/4990245/4990245-hd_1920_1080_30fps.mp4',
    screenshots: [
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1000&q=82',
      'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1000&q=82',
      'https://images.unsplash.com/photo-1496217590455-aa63a8350eea?auto=format&fit=crop&w=1000&q=82',
    ],
  },
  {
    category: 'portrait',
    title: '潮汐之间',
    enTitle: 'BETWEEN TIDES',
    type: '人物纪录片',
    year: '2023',
    duration: '08:24',
    role: '剪辑 / 联合编剧',
    client: 'FIELD NOTES',
    description: '一位海边手艺人的日常切片。影片让潮汐成为自然的时间线，在重复劳动里留下细微变化。',
    cover: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=86',
    video: 'https://videos.pexels.com/video-files/3130284/3130284-hd_1920_1080_30fps.mp4',
    screenshots: [
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=82',
      'https://images.unsplash.com/photo-1476673160081-cf065607f449?auto=format&fit=crop&w=1000&q=82',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=82',
    ],
  },
  {
    category: 'portrait',
    title: '留白',
    enTitle: 'ROOM TO BREATHE',
    type: '空间短片',
    year: '2023',
    duration: '01:30',
    role: '剪辑 / 声音设计',
    client: 'FORM ARCHIVE',
    description: '从光线、结构与人的尺度出发，用极简的节奏呈现一处空间如何随一天的时间缓慢变化。',
    cover: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=1500&q=86',
    video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    screenshots: [
      'https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=1000&q=82',
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1000&q=82',
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1000&q=82',
    ],
  },
];

const categories: Array<{
  id: CategoryId;
  title: string;
  enTitle: string;
  description: string;
  cover: string;
}> = [
  {
    id: 'commercial',
    title: '品牌与商业',
    enTitle: 'BRAND / COMMERCIAL',
    description: '品牌短片、汽车广告与商业叙事',
    cover: works[2].cover,
  },
  {
    id: 'culture',
    title: '音乐与时装',
    enTitle: 'MUSIC / FASHION',
    description: '现场节奏、时装影像与视觉实验',
    cover: works[1].cover,
  },
  {
    id: 'portrait',
    title: '人物与空间',
    enTitle: 'PORTRAIT / SPACE',
    description: '人物纪录、空间观察与安静叙事',
    cover: works[4].cover,
  },
];

function readCategoryParam(): CategoryId | null {
  const value = new URLSearchParams(window.location.search).get('category');
  return categories.some((category) => category.id === value) ? value as CategoryId : null;
}

function readPanelParam(): InfoPanel | null {
  const value = new URLSearchParams(window.location.search).get('panel');
  return value === 'about' || value === 'contact' ? value : null;
}

function WorkItem({ work, index, total, variant }: { work: Work; index: number; total: number; variant: number }) {
  return (
    <article
      className={`work-page reveal-variant-${variant + 1}`}
      aria-labelledby={`work-title-${variant}`}
    >
      <div className="work-feature">
        <div className="work-video" data-reveal>
          <video
            src={work.video}
            poster={work.cover}
            controls
            playsInline
            preload="metadata"
            aria-label={`${work.title}作品视频`}
          />
        </div>
        <div className="work-info">
          <p className="work-number" data-reveal>{String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</p>
          <div className="work-summary" data-reveal>
            <p>{work.type} · {work.year}</p>
            <h3 id={`work-title-${variant}`}>{work.title}</h3>
            <p className="work-en-title">{work.enTitle}</p>
            <p className="work-description">{work.description}</p>
          </div>
          <dl className="work-facts" data-reveal>
            <div><dt>客户</dt><dd>{work.client}</dd></div>
            <div><dt>职责</dt><dd>{work.role}</dd></div>
            <div><dt>片长</dt><dd>{work.duration}</dd></div>
          </dl>
        </div>
      </div>
      <div className="work-stills" aria-label={`${work.title}项目截图`}>
        {work.screenshots.map((screenshot, screenshotIndex) => (
          <figure key={screenshot} data-reveal>
            <img
              src={screenshot}
              alt={`${work.title}项目截图 ${screenshotIndex + 1}`}
              loading={index === 0 ? 'eager' : 'lazy'}
            />
            <figcaption>STILL {String(screenshotIndex + 1).padStart(2, '0')}</figcaption>
          </figure>
        ))}
      </div>
    </article>
  );
}

export default function App() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(readCategoryParam);
  const [activePanel, setActivePanel] = useState<InfoPanel | null>(readPanelParam);
  const activeCategory = categories.find((category) => category.id === selectedCategory);
  const visibleWorks = selectedCategory
    ? works.filter((work) => work.category === selectedCategory)
    : [];

  const navigate = useCallback((category: CategoryId | null, panel: InfoPanel | null) => {
    const params = new URLSearchParams(window.location.search);
    params.delete('category');
    params.delete('panel');

    if (category) params.set('category', category);
    if (panel) params.set('panel', panel);

    const search = params.toString();
    const nextUrl = `${window.location.pathname}${search ? `?${search}` : ''}`;
    window.history.pushState({}, '', nextUrl);
    setSelectedCategory(category);
    setActivePanel(panel);
  }, []);

  useEffect(() => {
    const syncViewFromUrl = () => {
      setSelectedCategory(readCategoryParam());
      setActivePanel(readPanelParam());
    };

    window.addEventListener('popstate', syncViewFromUrl);
    return () => window.removeEventListener('popstate', syncViewFromUrl);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [selectedCategory]);

  useEffect(() => {
    if (!activePanel) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') navigate(null, null);
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [activePanel, navigate]);

  useEffect(() => {
    const revealElements = document.querySelectorAll<HTMLElement>('[data-reveal]');
    const workPages = document.querySelectorAll<HTMLElement>('.work-page');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const playbackObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) (entry.target as HTMLElement).querySelector('video')?.pause();
      });
    });

    workPages.forEach((workPage) => playbackObserver.observe(workPage));

    if (reducedMotion.matches) {
      revealElements.forEach((element) => element.classList.add('is-visible'));
      return () => playbackObserver.disconnect();
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const element = entry.target as HTMLElement;
          if (entry.isIntersecting) {
            element.classList.add('is-visible');
          } else {
            element.classList.remove('is-visible');
          }
        });
      },
      { threshold: 0.14, rootMargin: '0px 0px -6% 0px' },
    );

    revealElements.forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
      playbackObserver.disconnect();
    };
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
        <div className="category-grid" aria-label="作品分类">
          {categories.map((category, index) => (
            <button
              className="category-panel"
              type="button"
              key={category.id}
              onClick={() => navigate(category.id, null)}
              aria-label={`查看${category.title}作品`}
            >
              <img src={category.cover} alt="" aria-hidden="true" />
              <span className="category-shade" aria-hidden="true" />
              <span className="category-index">0{index + 1}</span>
              <span className="category-copy">
                <span className="category-en">{category.enTitle}</span>
                <strong>{category.title}</strong>
                <span className="category-description">{category.description}</span>
              </span>
              <ArrowUpRight className="category-arrow" aria-hidden="true" />
            </button>
          ))}
        </div>
        {activePanel && (
          <div className="gateway-info-overlay">
            <button
              className="gateway-info-backdrop"
              type="button"
              onClick={() => navigate(null, null)}
              aria-label="关闭信息面板"
            />
            <aside
              className="gateway-info-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby={`${activePanel}-panel-title`}
            >
              <button
                className="gateway-info-close"
                type="button"
                onClick={() => navigate(null, null)}
                aria-label="关闭"
                title="关闭"
                autoFocus
              >
                <X aria-hidden="true" />
              </button>

              {activePanel === 'about' ? (
                <div className="gateway-info-content">
                  <p className="gateway-info-index">01 / PROFILE</p>
                  <h2 id="about-panel-title">剪辑不只是连接镜头，而是在时间里安排情绪。</h2>
                  <div className="gateway-info-copy">
                    <p>我是古梦雪，一名独立视频剪辑师。过去 7 年里，我参与了品牌短片、人物纪录片、音乐影像与数字内容的后期制作。</p>
                    <p>我关心画面之间的呼吸、声音留下的空间，以及一个故事如何在恰当的时刻被看见。</p>
                  </div>
                  <dl className="gateway-info-facts">
                    <div><dt>服务</dt><dd>剪辑 / 调色 / 声音设计 / 动态设计</dd></div>
                    <div><dt>工作地</dt><dd>上海 / 可远程合作</dd></div>
                    <div><dt>语言</dt><dd>中文 / ENGLISH</dd></div>
                  </dl>
                </div>
              ) : (
                <div className="gateway-info-content gateway-contact-content">
                  <p className="gateway-info-index">02 / CONTACT</p>
                  <h2 id="contact-panel-title">有一个故事准备开剪？</h2>
                  <a className="gateway-contact-mail" href="mailto:hello@gumengxue.studio">
                    HELLO@GUMENGXUE.STUDIO <ArrowUpRight aria-hidden="true" />
                  </a>
                  <div className="gateway-contact-meta">
                    <p className="availability"><span /> 2026 档期开放</p>
                    <div><a href="#">VIMEO</a><a href="#">INSTAGRAM</a><a href="#">小红书</a></div>
                  </div>
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
          <button
            className="category-back"
            type="button"
            onClick={() => navigate(null, null)}
            aria-label="返回作品分类"
            title="返回作品分类"
          >
            <ArrowLeft size={17} aria-hidden="true" />
          </button>
          <button className="wordmark" type="button" onClick={() => navigate(null, null)} aria-label="返回古梦雪首页">
            GM<span>®</span>
          </button>
        </div>
        <p>{activeCategory.title} / {activeCategory.enTitle}</p>
        <p>{String(visibleWorks.length).padStart(2, '0')} PROJECTS</p>
      </header>

      <section className="works-section" id="work" aria-labelledby="work-title">
        <header className="section-header" data-reveal>
          <p className="section-index">01 / {activeCategory.enTitle}</p>
          <h2 id="work-title">{activeCategory.title}</h2>
          <p>{activeCategory.description}。<br />以下内容均为演示用虚构项目。</p>
        </header>
        <div className="works-list">
          {visibleWorks.map((work, index) => (
            <WorkItem
              key={work.enTitle}
              work={work}
              index={index}
              total={visibleWorks.length}
              variant={works.indexOf(work)}
            />
          ))}
        </div>
      </section>

    </main>
  );
}
