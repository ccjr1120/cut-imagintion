'use client';

import { ArrowDown, ArrowLeft, ArrowUp, Check, ChevronRight, ExternalLink, FolderKanban, Image as ImageIcon, LoaderCircle, LogOut, Plus, Save, Trash2, Upload, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Category, PortfolioContent, Project } from '@/lib/types';

type Section = 'categories' | 'projects';
type Notice = { type: 'ok' | 'error'; message: string } | null;

function makeId(label: string, existing: string[]) {
  const base = label.toLowerCase().trim().replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-').replace(/^-|-$/g, '') || `item-${Date.now()}`;
  let id = base;
  let suffix = 2;
  while (existing.includes(id)) id = `${base}-${suffix++}`;
  return id;
}

async function responseJson(response: Response) {
  const body = await response.json().catch(() => ({})) as { error?: string };
  if (!response.ok) throw new Error(body.error || '请求失败');
  return body;
}

function MediaField({ label, value, accept, onChange, hint }: { label: string; value: string; accept: string; onChange: (value: string) => void; hint?: string }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function upload(file?: File) {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const response = await fetch('/api/admin/upload', { method: 'POST', body: form });
      const result = await responseJson(response) as { url: string };
      onChange(result.url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : '上传失败');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="admin-field admin-media-field">
      <div className="field-heading"><label>{label}</label>{value && <button type="button" className="icon-button subtle" onClick={() => onChange('')} title="移除"><X size={15} /></button>}</div>
      <div className="media-input-row">
        <input value={value} onChange={(event) => onChange(event.target.value)} placeholder="粘贴媒体地址，或从本地上传" />
        <label className={`upload-button ${uploading ? 'is-loading' : ''}`}>
          {uploading ? <LoaderCircle className="spin" size={16} /> : <Upload size={16} />}
          <span>{uploading ? '上传中' : '上传'}</span>
          <input type="file" accept={accept} disabled={uploading} onChange={(event) => void upload(event.target.files?.[0])} />
        </label>
      </div>
      {hint && <small>{hint}</small>}
      {error && <small className="field-error">{error}</small>}
      {value && accept.startsWith('image') && <div className="media-preview"><img src={value} alt={`${label}预览`} /></div>}
      {value && accept.startsWith('video') && <div className="media-preview video-preview"><video src={value} controls preload="metadata" /></div>}
    </div>
  );
}

function TextField({ label, value, onChange, placeholder, required, wide, multiline }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; required?: boolean; wide?: boolean; multiline?: boolean }) {
  return (
    <div className={`admin-field ${wide ? 'field-wide' : ''}`}>
      <label>{label}{required && <span>必填</span>}</label>
      {multiline ? <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={5} /> : <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />}
    </div>
  );
}

function MoveButtons({ index, total, onMove }: { index: number; total: number; onMove: (direction: -1 | 1) => void }) {
  return (
    <div className="move-buttons">
      <button type="button" className="icon-button" disabled={index === 0} onClick={() => onMove(-1)} title="上移"><ArrowUp size={15} /></button>
      <button type="button" className="icon-button" disabled={index === total - 1} onClick={() => onMove(1)} title="下移"><ArrowDown size={15} /></button>
    </div>
  );
}

function Login({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await responseJson(await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) }));
      onSuccess();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : '登录失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-login">
      <a href="/" className="login-back"><ArrowLeft size={16} /> 返回作品集</a>
      <form onSubmit={submit} className="login-panel">
        <div className="login-mark">GM<span>®</span></div>
        <p className="admin-kicker">CONTENT STUDIO</p>
        <h1>内容管理</h1>
        <p>登录后可维护分类、项目资料和媒体文件。</p>
        <label>管理员密码</label>
        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoFocus autoComplete="current-password" placeholder="输入密码" />
        {error && <p className="login-error">{error}</p>}
        <button type="submit" className="primary-button" disabled={loading || !password}>{loading ? <LoaderCircle className="spin" size={17} /> : <ChevronRight size={17} />}进入后台</button>
        {process.env.NODE_ENV !== 'production' && <small>本地开发默认密码：admin</small>}
      </form>
    </main>
  );
}

export function AdminDashboard() {
  const [content, setContent] = useState<PortfolioContent | null>(null);
  const [authState, setAuthState] = useState<'loading' | 'login' | 'ready'>('loading');
  const [section, setSection] = useState<Section>('projects');
  const [selectedId, setSelectedId] = useState('');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const load = useCallback(async () => {
    setAuthState('loading');
    try {
      const response = await fetch('/api/admin/content', { cache: 'no-store' });
      if (response.status === 401) { setAuthState('login'); return; }
      const loaded = await responseJson(response) as PortfolioContent;
      setContent(loaded);
      setSelectedId(loaded.projects[0]?.id || loaded.categories[0]?.id || '');
      setAuthState('ready');
    } catch (error) {
      setNotice({ type: 'error', message: error instanceof Error ? error.message : '内容加载失败' });
      setAuthState('login');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const selectedCategory = section === 'categories' ? content?.categories.find((item) => item.id === selectedId) : undefined;
  const selectedProject = section === 'projects' ? content?.projects.find((item) => item.id === selectedId) : undefined;
  const list = section === 'categories' ? content?.categories || [] : content?.projects || [];

  const projectCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    content?.projects.forEach((item) => { counts[item.categoryId] = (counts[item.categoryId] || 0) + 1; });
    return counts;
  }, [content]);

  function mutate(updater: (current: PortfolioContent) => PortfolioContent) {
    setContent((current) => current ? updater(current) : current);
    setDirty(true);
    setNotice(null);
  }

  function updateCategory(patch: Partial<Category>) {
    if (!selectedCategory) return;
    mutate((current) => ({ ...current, categories: current.categories.map((item) => item.id === selectedCategory.id ? { ...item, ...patch } : item) }));
  }

  function updateProject(patch: Partial<Project>) {
    if (!selectedProject) return;
    mutate((current) => ({ ...current, projects: current.projects.map((item) => item.id === selectedProject.id ? { ...item, ...patch } : item) }));
  }

  function changeSection(next: Section) {
    setSection(next);
    const items = next === 'categories' ? content?.categories : content?.projects;
    setSelectedId(items?.[0]?.id || '');
  }

  function addItem() {
    if (!content) return;
    if (section === 'categories') {
      const id = makeId('new-category', content.categories.map((item) => item.id));
      const category: Category = { id, title: '新分类', enTitle: 'NEW CATEGORY', description: '', cover: '' };
      mutate((current) => ({ ...current, categories: [...current.categories, category] }));
      setSelectedId(id);
    } else {
      if (!content.categories.length) { setNotice({ type: 'error', message: '请先新建一个分类' }); return; }
      const id = makeId('new-project', content.projects.map((item) => item.id));
      const project: Project = { id, categoryId: content.categories[0].id, title: '新项目', enTitle: 'NEW PROJECT', type: '', year: String(new Date().getFullYear()), duration: '', description: '', role: '', software: '', plugins: '', cover: '', video: '', screenshots: [] };
      mutate((current) => ({ ...current, projects: [...current.projects, project] }));
      setSelectedId(id);
    }
  }

  function removeItem() {
    if (!content) return;
    if (section === 'categories') {
      if (!selectedCategory) return;
      if (projectCounts[selectedCategory.id]) { setNotice({ type: 'error', message: '这个分类下还有项目，请先移动或删除相关项目' }); return; }
      if (!window.confirm(`确定删除分类“${selectedCategory.title}”吗？`)) return;
      const categories = content.categories.filter((item) => item.id !== selectedCategory.id);
      mutate((current) => ({ ...current, categories }));
      setSelectedId(categories[0]?.id || '');
    } else {
      if (!selectedProject || !window.confirm(`确定删除项目“${selectedProject.title}”吗？`)) return;
      const projects = content.projects.filter((item) => item.id !== selectedProject.id);
      mutate((current) => ({ ...current, projects }));
      setSelectedId(projects[0]?.id || '');
    }
  }

  function moveItem(direction: -1 | 1) {
    if (!content) return;
    const key = section;
    const items = [...content[key]] as Array<Category | Project>;
    const index = items.findIndex((item) => item.id === selectedId);
    const next = index + direction;
    if (index < 0 || next < 0 || next >= items.length) return;
    [items[index], items[next]] = [items[next], items[index]];
    mutate((current) => ({ ...current, [key]: items } as PortfolioContent));
  }

  async function save() {
    if (!content) return;
    setSaving(true);
    setNotice(null);
    try {
      const saved = await responseJson(await fetch('/api/admin/content', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(content) })) as PortfolioContent;
      setContent(saved);
      setDirty(false);
      setNotice({ type: 'ok', message: '内容已发布' });
    } catch (error) {
      setNotice({ type: 'error', message: error instanceof Error ? error.message : '保存失败' });
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    if (dirty && !window.confirm('还有未保存的修改，仍要退出吗？')) return;
    await fetch('/api/admin/logout', { method: 'POST' });
    setContent(null);
    setAuthState('login');
  }

  if (authState === 'loading') return <main className="admin-loading"><LoaderCircle className="spin" /><p>正在载入内容</p></main>;
  if (authState === 'login') return <Login onSuccess={() => void load()} />;
  if (!content) return null;

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <header><a href="/" className="admin-brand">GM<span>®</span></a><span>CONTENT STUDIO</span></header>
        <nav aria-label="管理项目">
          <button type="button" className={section === 'projects' ? 'active' : ''} onClick={() => changeSection('projects')}><FolderKanban size={17} /><span>项目</span><em>{content.projects.length}</em></button>
          <button type="button" className={section === 'categories' ? 'active' : ''} onClick={() => changeSection('categories')}><ImageIcon size={17} /><span>分类</span><em>{content.categories.length}</em></button>
        </nav>
        <footer><a href="/" target="_blank"><ExternalLink size={15} />查看前台</a><button type="button" onClick={() => void logout()}><LogOut size={15} />退出</button></footer>
      </aside>

      <section className="admin-list-panel">
        <header><div><p>{section === 'projects' ? 'PROJECTS' : 'CATEGORIES'}</p><h1>{section === 'projects' ? '项目' : '分类'}</h1></div><button type="button" className="icon-button add-button" onClick={addItem} title={section === 'projects' ? '新建项目' : '新建分类'}><Plus size={18} /></button></header>
        <div className="admin-items">
          {list.map((item, index) => {
            const category = section === 'projects' ? content.categories.find((entry) => entry.id === (item as Project).categoryId) : null;
            return <button type="button" key={item.id} className={selectedId === item.id ? 'selected' : ''} onClick={() => setSelectedId(item.id)}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{item.title || '未命名'}</strong><small>{category?.title || item.enTitle || '尚未填写'}</small></div><ChevronRight size={16} /></button>;
          })}
          {!list.length && <div className="admin-empty"><p>这里还没有内容</p><button type="button" onClick={addItem}><Plus size={16} />立即新建</button></div>}
        </div>
      </section>

      <section className="admin-editor">
        <header className="editor-toolbar">
          <div>{selectedCategory || selectedProject ? <><span>{section === 'projects' ? 'EDIT PROJECT' : 'EDIT CATEGORY'}</span><strong>{selectedProject?.title || selectedCategory?.title}</strong></> : <strong>选择一项开始编辑</strong>}</div>
          {(selectedCategory || selectedProject) && <div className="toolbar-actions"><MoveButtons index={list.findIndex((item) => item.id === selectedId)} total={list.length} onMove={moveItem} /><button type="button" className="danger-icon" onClick={removeItem} title="删除"><Trash2 size={16} /></button><button type="button" className="save-button" disabled={!dirty || saving} onClick={() => void save()}>{saving ? <LoaderCircle className="spin" size={16} /> : dirty ? <Save size={16} /> : <Check size={16} />}{saving ? '保存中' : dirty ? '发布修改' : '已保存'}</button></div>}
        </header>
        {notice && <div className={`admin-notice ${notice.type}`}><span>{notice.message}</span><button type="button" onClick={() => setNotice(null)}><X size={15} /></button></div>}

        <div className="editor-scroll">
          {selectedCategory && (
            <form className="editor-form" onSubmit={(event) => event.preventDefault()}>
              <div className="form-section-heading"><span>01</span><div><h2>分类信息</h2><p>分类名称、首页描述和识别信息</p></div></div>
              <div className="form-grid">
                <TextField label="分类名称" required value={selectedCategory.title} onChange={(title) => updateCategory({ title })} />
                <TextField label="英文名称" required value={selectedCategory.enTitle} onChange={(enTitle) => updateCategory({ enTitle })} />
                <div className="admin-field"><label>分类 ID<span>稳定标识</span></label><input value={selectedCategory.id} disabled /></div>
                <div className="admin-field"><label>项目数量</label><input value={`${projectCounts[selectedCategory.id] || 0} 个项目`} disabled /></div>
                <TextField label="分类描述" wide multiline value={selectedCategory.description} onChange={(description) => updateCategory({ description })} />
              </div>
              <div className="form-section-heading"><span>02</span><div><h2>分类封面</h2><p>首页分类拼贴中展示的主视觉</p></div></div>
              <MediaField label="封面图片" value={selectedCategory.cover} accept="image/*" onChange={(cover) => updateCategory({ cover })} hint="推荐 16:9 或更宽的横图，JPG / PNG / WebP" />
            </form>
          )}

          {selectedProject && (
            <form className="editor-form" onSubmit={(event) => event.preventDefault()}>
              <div className="form-section-heading"><span>01</span><div><h2>基本信息</h2><p>项目标题、分类和前台摘要</p></div></div>
              <div className="form-grid">
                <TextField label="项目标题" required value={selectedProject.title} onChange={(title) => updateProject({ title })} />
                <TextField label="英文标题" required value={selectedProject.enTitle} onChange={(enTitle) => updateProject({ enTitle })} />
                <div className="admin-field"><label>所属分类<span>必填</span></label><select value={selectedProject.categoryId} onChange={(event) => updateProject({ categoryId: event.target.value })}>{content.categories.map((category) => <option value={category.id} key={category.id}>{category.title}</option>)}</select></div>
                <TextField label="项目类型" value={selectedProject.type} onChange={(type) => updateProject({ type })} placeholder="例如：品牌短片" />
                <TextField label="年份" value={selectedProject.year} onChange={(year) => updateProject({ year })} />
                <TextField label="片长" value={selectedProject.duration} onChange={(duration) => updateProject({ duration })} placeholder="例如：01:42" />
                <TextField label="项目描述" wide multiline value={selectedProject.description} onChange={(description) => updateProject({ description })} />
              </div>
              <div className="form-section-heading"><span>02</span><div><h2>制作信息</h2><p>前台展示为职责、软件和插件</p></div></div>
              <div className="form-grid three-columns">
                <TextField label="职责" value={selectedProject.role} onChange={(role) => updateProject({ role })} placeholder="剪辑 / 调色" />
                <TextField label="软件" value={selectedProject.software} onChange={(software) => updateProject({ software })} placeholder="Premiere Pro / Resolve" />
                <TextField label="插件" value={selectedProject.plugins} onChange={(plugins) => updateProject({ plugins })} placeholder="FilmConvert / Sapphire" />
              </div>
              <div className="form-section-heading"><span>03</span><div><h2>主媒体</h2><p>视频封面和完整视频，可上传或使用外链</p></div></div>
              <div className="media-fields-grid">
                <MediaField label="视频封面" value={selectedProject.cover} accept="image/*" onChange={(cover) => updateProject({ cover })} hint="推荐 16:9 横图" />
                <MediaField label="项目视频" value={selectedProject.video} accept="video/*" onChange={(video) => updateProject({ video })} hint="支持 MP4 / WebM / MOV，单文件不超过 250MB" />
              </div>
              <div className="form-section-heading"><span>04</span><div><h2>项目截图</h2><p>可添加、删除和调整展示顺序，最多 12 张</p></div><button type="button" className="secondary-button" disabled={selectedProject.screenshots.length >= 12} onClick={() => updateProject({ screenshots: [...selectedProject.screenshots, ''] })}><Plus size={15} />添加截图</button></div>
              <div className="screenshot-fields">
                {selectedProject.screenshots.map((screenshot, index) => (
                  <div className="screenshot-item" key={index}>
                    <div className="screenshot-index"><span>{String(index + 1).padStart(2, '0')}</span><div className="move-buttons"><button type="button" className="icon-button" disabled={index === 0} onClick={() => { const next = [...selectedProject.screenshots]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; updateProject({ screenshots: next }); }}><ArrowUp size={14} /></button><button type="button" className="icon-button" disabled={index === selectedProject.screenshots.length - 1} onClick={() => { const next = [...selectedProject.screenshots]; [next[index + 1], next[index]] = [next[index], next[index + 1]]; updateProject({ screenshots: next }); }}><ArrowDown size={14} /></button></div></div>
                    <MediaField label={`截图 ${index + 1}`} value={screenshot} accept="image/*" onChange={(value) => { const screenshots = [...selectedProject.screenshots]; screenshots[index] = value; updateProject({ screenshots }); }} />
                    <button type="button" className="remove-screenshot" onClick={() => updateProject({ screenshots: selectedProject.screenshots.filter((_, itemIndex) => itemIndex !== index) })}><Trash2 size={15} />删除</button>
                  </div>
                ))}
                {!selectedProject.screenshots.length && <div className="screenshots-empty"><ImageIcon size={22} /><p>还没有项目截图</p></div>}
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
